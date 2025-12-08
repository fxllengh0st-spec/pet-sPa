import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { geminiService } from '../services/gemini';
import { Send, ChevronLeft, User, Loader2, Lock, AlertTriangle } from 'lucide-react';
import { formatCurrency, toLocalISOString, getPetAvatarUrl } from '../utils/ui';

// URL base do Bucket
const BASE_STORAGE_URL = 'https://vfryefavzurwoiuznkwv.supabase.co/storage/v1/object/public/site-assets';

interface ChatProps {
  onNavigate: (route: string) => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  options?: { label: string; action?: string; payload?: any; nextNode?: string }[];
}

// --- Tipos para o Cérebro Reserva (Fallback State Machine) ---
type FallbackState = 
  | 'IDLE' 
  | 'CREATE_PET_NAME' 
  | 'CREATE_PET_BREED' 
  | 'SCHEDULE_PET' 
  | 'SCHEDULE_SERVICE' 
  | 'SCHEDULE_TIME';

export const Chat: React.FC<ChatProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [botAvatarSrc, setBotAvatarSrc] = useState(`${BASE_STORAGE_URL}/bt.webp`);
  
  // Layout Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Inputs & Context
  const [inputValue, setInputValue] = useState('');
  const [inputType, setInputType] = useState<'text' | 'password' | null>('text');
  
  // User Session for AI Context
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  // --- Fallback Logic State (Cérebro Reserva Local) ---
  const [fallbackState, setFallbackState] = useState<FallbackState>('IDLE');
  const [fallbackData, setFallbackData] = useState<any>({}); // Armazena dados temporários (nome do pet, id do serviço, etc)

  // --- Mobile Keyboard Fix ---
  useEffect(() => {
    const handleResize = () => {
        if (chatContainerRef.current && window.visualViewport) {
            chatContainerRef.current.style.height = `${window.visualViewport.height}px`;
            chatContainerRef.current.style.top = `${window.visualViewport.offsetTop}px`; 
            scrollToBottom();
        }
    };

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleResize);
        window.visualViewport.addEventListener('scroll', handleResize);
        handleResize(); 
    }

    return () => {
        if (window.visualViewport) {
            window.visualViewport.removeEventListener('resize', handleResize);
            window.visualViewport.removeEventListener('scroll', handleResize);
        }
    };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load Session
  useEffect(() => {
      api.auth.getSession().then(session => {
          if (session) {
              setCurrentUserId(session.user.id);
          }
      });
      // Welcome Message
      processNode('START');
  }, []);

  const addMessage = (text: string, sender: 'bot' | 'user', options: any[] = []) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), text, sender, options }]);
  };

  // --- Logic Flow (Initial Greeting) ---
  const processNode = async (nodeId: string) => {
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 600)); 
    setIsTyping(false);

    let node: any = {};
    const userSession = await api.auth.getSession();

    switch (nodeId) {
      case 'START':
        if (userSession) {
            const userName = userSession.user.user_metadata.full_name?.split(' ')[0] || 'Tutor';
            node = {
                message: `Olá, ${userName}! 🐶 Sou o assistente inteligente da PetSpa. Posso agendar banhos e cadastrar pets pra você. Como posso ajudar hoje?`,
                options: [
                    { label: '📅 Agendar Banho', action: 'triggerAI_Appointment' },
                    { label: '🐶 Novo Pet', action: 'triggerAI_NewPet' }
                ]
            };
        } else {
            node = {
                message: 'Olá! Sou o mascote da PetSpa 🐶. Para eu conseguir agendar pra você, preciso que você entre na sua conta.',
                options: [
                    { label: '🔐 Entrar / Cadastrar', action: 'navLogin' }
                ]
            };
        }
        break;
      default:
        break;
    }

    if (node.message) addMessage(node.message, 'bot', node.options);
  };

  const handleOption = (opt: any) => {
    if (opt.nextNode) processNode(opt.nextNode);
    
    // Navigation Actions
    if (opt.action === 'navLogin') onNavigate('login');
    else if (opt.action === 'navHome') onNavigate('home');
    
    // Quick actions that just paste text for the AI to process (or fallback)
    else if (opt.action === 'triggerAI_Appointment') {
        handleInputSubmit(null, "Quero agendar um serviço");
    }
    else if (opt.action === 'triggerAI_NewPet') {
        handleInputSubmit(null, "Quero cadastrar um novo pet");
    }
    // Fallback Options Logic
    else if (opt.action === 'fallback_select_pet') {
        handleFallbackFlowInput(opt.payload); // Payload is pet ID
    }
    else if (opt.action === 'fallback_select_service') {
        handleFallbackFlowInput(opt.payload); // Payload is service object
    }
  };

  // --- BACKUP BRAIN (Interactive State Machine) ---
  // Este sistema assume o controle quando o Gemini falha, pedindo dados passo a passo.

  const activateBackupBrain = async (text: string) => {
    const t = text.toLowerCase();
    
    // Intent: Cadastro de Pet
    if (t.includes('pet') || t.includes('cadastra') || t.includes('novo')) {
         setFallbackState('CREATE_PET_NAME');
         setFallbackData({});
         return {
          message: "A minha conexão com a nuvem oscilou, mas eu mesmo faço isso pra você! 🐶\n\nQual é o **nome** do pet?",
          options: []
        };
    }
    
    // Intent: Agendamento
    if (t.includes('agenda') || t.includes('marca') || t.includes('banho') || t.includes('tosa')) {
       // Tenta buscar os pets pra facilitar
       if (currentUserId) {
           try {
               const pets = await api.booking.getMyPets(currentUserId);
               if (pets.length > 0) {
                   setFallbackState('SCHEDULE_PET');
                   setFallbackData({});
                   return {
                       message: "Certo, vou agendar manualmente pra você. Para qual pet seria?",
                       options: pets.map(p => ({ label: p.name, action: 'fallback_select_pet', payload: p.id }))
                   };
               }
           } catch(e) {}
       }
       
       // Se não achou pets ou deu erro, fluxo genérico
       return {
         message: "Estou com dificuldade de acessar minha inteligência avançada. 🧠🔌\nPor favor, use o botão abaixo para agendar visualmente:",
         options: [
           { label: '📅 Abrir Assistente de Agendamento', action: 'navServices' }
         ]
       };
    }

    // Default Fallback
    return {
      message: "Minha inteligência principal está fora do ar momentaneamente. 🛠️\nComo posso ajudar?",
      options: [
         { label: '📅 Agendar', action: 'triggerAI_Appointment' },
         { label: '🐶 Cadastrar Pet', action: 'triggerAI_NewPet' }
      ]
    };
  };

  // --- Fallback Flow Handler ---
  // Processa as respostas do usuário quando o Fallback está ativo
  const handleFallbackFlowInput = async (input: any) => {
      const textInput = typeof input === 'string' ? input : '';
      
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 500));
      setIsTyping(false);

      if (fallbackState === 'CREATE_PET_NAME') {
          // Usuário digitou o nome
          setFallbackData({ ...fallbackData, name: textInput });
          addMessage(textInput, 'user');
          setFallbackState('CREATE_PET_BREED');
          addMessage(`Ótimo nome! E qual é a raça dx ${textInput}? (Ou digite "não sei")`, 'bot');
          return;
      }

      if (fallbackState === 'CREATE_PET_BREED') {
          // Usuário digitou a raça, agora finaliza
          addMessage(textInput, 'user');
          setIsTyping(true);
          try {
              await api.booking.createPet(currentUserId!, {
                  name: fallbackData.name,
                  breed: textInput
              });
              setIsTyping(false);
              addMessage(`Prontinho! 🎉 Cadastrei o(a) **${fallbackData.name}** com sucesso! O que deseja fazer agora?`, 'bot', [
                  { label: '📅 Agendar Banho', action: 'triggerAI_Appointment' }
              ]);
          } catch (e) {
              setIsTyping(false);
              addMessage("Ops, tive um erro ao salvar no banco de dados. Tente novamente mais tarde.", 'bot');
          }
          setFallbackState('IDLE');
          setFallbackData({});
          return;
      }

      if (fallbackState === 'SCHEDULE_PET') {
          // Usuário selecionou o Pet (via options payload)
          const petId = input; 
          setFallbackData({ ...fallbackData, petId });
          addMessage("Selecionado!", 'user'); // Feedback visual
          
          // Busca serviços para mostrar opções
          setIsTyping(true);
          const services = await api.booking.getServices();
          setIsTyping(false);
          
          setFallbackState('SCHEDULE_SERVICE');
          addMessage("Qual serviço você gostaria?", 'bot', 
              services.map(s => ({ label: `${s.name} (${formatCurrency(s.price)})`, action: 'fallback_select_service', payload: s }))
          );
          return;
      }

      if (fallbackState === 'SCHEDULE_SERVICE') {
          const service = input; // Service Object
          setFallbackData({ ...fallbackData, service });
          addMessage(service.name, 'user');
          setFallbackState('SCHEDULE_TIME');
          addMessage("Para quando você gostaria? Digite a data e hora (ex: Amanhã às 14h, ou 25/12 as 10:00).", 'bot');
          return;
      }

      if (fallbackState === 'SCHEDULE_TIME') {
          // Tentar parsear data rudimentarmente (O Gemini faria isso melhor, mas é um fallback)
          addMessage(textInput, 'user');
          
          // Como é um fallback manual complexo fazer parse de NL, vamos simplificar:
          // Criamos um agendamento para "amanhã" se falhar o parse, ou pedir pra usar o wizard.
          // Para esta demo, vamos tentar criar um agendamento fictício ou real se a string for ISO.
          // Mas o melhor UX aqui é admitir a limitação de parse do fallback:
          
          addMessage(`Entendido. Como estou no modo manual, vou abrir a confirmação final pra você selecionar a data exata.`, 'bot');
          // Aqui poderíamos chamar o BookingWizard, mas vamos simular finalização:
          
          setFallbackState('IDLE');
          onNavigate('services'); // Redireciona para o wizard visual que é mais seguro para datas sem IA
          return;
      }
  };

  const handleInputSubmit = async (e: React.FormEvent | null, textOverride?: string) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || inputValue;
    if (!textToSend.trim()) return;

    // Se estivermos em um fluxo de fallback, desvia para o handler local
    if (fallbackState !== 'IDLE') {
        handleFallbackFlowInput(textToSend);
        setInputValue('');
        return;
    }

    // 1. User Message (Standard AI Flow)
    addMessage(textToSend, 'user');
    setInputValue('');
    setIsTyping(true);

    // 2. AI Processing
    try {
        const historyContext = messages.slice(-10).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        })) as { role: 'user' | 'model', parts: [{ text: string }] }[];

        const responseText = await geminiService.sendMessage(
            historyContext, 
            textToSend, 
            currentUserId 
        );

        setIsTyping(false);
        addMessage(responseText, 'bot');

    } catch (err) {
        setIsTyping(false);
        console.error("AI Error, activating backup brain", err);
        
        // --- BACKUP BRAIN ACTIVATION ---
        const fallback = await activateBackupBrain(textToSend);
        addMessage(fallback.message, 'bot', fallback.options);
    }
  };

  return (
    <div className="chat-layout" ref={chatContainerRef}>
      {/* Modern Header */}
      <div className="chat-header-modern">
        <button onClick={() => onNavigate('home')} className="chat-back-btn">
          <ChevronLeft size={24} />
        </button>
        
        <div className="chat-header-info">
          <div className="chat-avatar-ring">
             <img 
                src={botAvatarSrc} 
                className="bot-avatar-img" 
                alt="Bot" 
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=AI&background=FF8C42&color=fff'; }}
             />
          </div>
          <div className="chat-title-group">
            <h3>Assistente IA</h3>
            <div className="chat-status">
              <span className={`status-indicator ${fallbackState !== 'IDLE' ? 'bg-yellow-500' : ''}`}></span>
              {fallbackState !== 'IDLE' ? 'Modo Manual' : (currentUserId ? 'Conectado' : 'Visitante')}
            </div>
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="chat-messages-area">
        <div className="chat-date-divider"><span>Hoje</span></div>
        
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-row ${msg.sender === 'user' ? 'row-user' : 'row-bot'}`}>
            {msg.sender === 'bot' && (
                <div className="chat-msg-avatar">
                   <img src={botAvatarSrc} alt="bot" onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=AI&background=FF8C42&color=fff'; }} />
                </div>
            )}
            
            <div style={{maxWidth: '100%'}}>
                <div className={`chat-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
                  <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
                </div>
                
                {msg.sender === 'bot' && msg.options && (
                  <div className="chat-options-grid delay-options">
                    {msg.options.map((opt, idx) => (
                      <button key={idx} className="chat-chip-btn" onClick={() => handleOption(opt)}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </div>
        ))}

        {isTyping && (
           <div className="chat-row row-bot">
             <div className="chat-msg-avatar"><img src={botAvatarSrc} alt="bot" /></div>
             <div className="chat-bubble bubble-bot typing-bubble">
               <span className="dot"></span><span className="dot"></span><span className="dot"></span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} style={{ height: 1 }} />
      </div>

      {/* Input Area */}
      <form onSubmit={(e) => handleInputSubmit(e)} className="chat-footer-modern">
         <div className="input-wrapper">
             <input 
               ref={inputRef}
               type={inputType === 'password' ? 'password' : 'text'}
               className="chat-input-modern" 
               value={inputValue} 
               onChange={e => setInputValue(e.target.value)}
               placeholder={fallbackState !== 'IDLE' ? "Responda aqui..." : "Digite aqui..."}
               autoFocus
             />
         </div>
         <button type="submit" className="chat-send-btn" disabled={!inputValue.trim()}>
            <Send size={20} />
         </button>
      </form>
    </div>
  );
};