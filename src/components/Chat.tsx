import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { geminiService } from '../services/gemini';
import { Send, ChevronLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';

// URL base do Bucket
const BASE_STORAGE_URL = 'https://vfryefavzurwoiuznkwv.supabase.co/storage/v1/object/public/site-assets';

interface ChatProps {
  onNavigate: (route: string) => void;
  onActionSuccess?: () => void; // Call this when AI creates data to refresh App state
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

export const Chat: React.FC<ChatProps> = ({ onNavigate, onActionSuccess }) => {
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
  const [fallbackData, setFallbackData] = useState<any>({}); 
  
  const toast = useToast();

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
    
    // Quick actions
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

  // --- BACKUP BRAIN (Fallback) ---
  const activateBackupBrain = async (text: string) => {
    const t = text.toLowerCase();
    
    if (t.includes('pet') || t.includes('cadastra') || t.includes('novo')) {
         setFallbackState('CREATE_PET_NAME');
         setFallbackData({});
         return {
          message: "Minha conexão com a nuvem oscilou, mas eu mesmo faço isso pra você! 🐶\n\nQual é o **nome** do pet?",
          options: []
        };
    }
    
    if (t.includes('agenda') || t.includes('marca') || t.includes('banho')) {
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
       return {
         message: "Estou com dificuldade de acessar minha inteligência avançada. 🧠🔌\nPor favor, use o botão abaixo para agendar visualmente:",
         options: [
           { label: '📅 Abrir Assistente de Agendamento', action: 'navServices' }
         ]
       };
    }

    return {
      message: "Minha inteligência principal está fora do ar momentaneamente. 🛠️\nComo posso ajudar?",
      options: [
         { label: '📅 Agendar', action: 'triggerAI_Appointment' },
         { label: '🐶 Cadastrar Pet', action: 'triggerAI_NewPet' }
      ]
    };
  };

  const handleFallbackFlowInput = async (input: any) => {
      const textInput = typeof input === 'string' ? input : '';
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 500));
      setIsTyping(false);

      if (fallbackState === 'CREATE_PET_NAME') {
          setFallbackData({ ...fallbackData, name: textInput });
          addMessage(textInput, 'user');
          setFallbackState('CREATE_PET_BREED');
          addMessage(`Ótimo nome! E qual é a raça dx ${textInput}? (Ou digite "não sei")`, 'bot');
          return;
      }

      if (fallbackState === 'CREATE_PET_BREED') {
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
              if (onActionSuccess) onActionSuccess(); // Trigger App Refresh
          } catch (e) {
              setIsTyping(false);
              addMessage("Ops, tive um erro ao salvar no banco de dados.", 'bot');
          }
          setFallbackState('IDLE');
          setFallbackData({});
          return;
      }
      
      // ... Outros estados do fallback (simplificado para brevity)
      if (fallbackState !== 'IDLE') {
          addMessage("Desculpe, o modo manual está limitado no momento. Vamos tentar o automático?", 'bot');
          setFallbackState('IDLE');
      }
  };

  const handleInputSubmit = async (e: React.FormEvent | null, textOverride?: string) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || inputValue;
    if (!textToSend.trim()) return;

    if (fallbackState !== 'IDLE') {
        handleFallbackFlowInput(textToSend);
        setInputValue('');
        return;
    }

    addMessage(textToSend, 'user');
    setInputValue('');
    setIsTyping(true);

    try {
        const historyContext = messages.slice(-10).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        })) as { role: 'user' | 'model', parts: [{ text: string }] }[];

        // CALL GEMINI
        const { text, refreshRequired } = await geminiService.sendMessage(
            historyContext, 
            textToSend, 
            currentUserId 
        );

        setIsTyping(false);
        addMessage(text, 'bot');

        // STATE SYNC MAGIC
        if (refreshRequired) {
            toast.success("Dados atualizados com sucesso!");
            if (onActionSuccess) {
                console.log("Refreshing App Data from Chat...");
                onActionSuccess();
            }
        }

    } catch (err) {
        setIsTyping(false);
        console.error("AI Error", err);
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