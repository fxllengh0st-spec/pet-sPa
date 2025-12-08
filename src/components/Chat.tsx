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

  // --- Mobile Keyboard Fix ---
  useEffect(() => {
    // This ensures the chat container resizes to the VISUAL viewport (what's visible above keyboard)
    // rather than the layout viewport (which often stays full height on iOS)
    const handleResize = () => {
        if (chatContainerRef.current && window.visualViewport) {
            chatContainerRef.current.style.height = `${window.visualViewport.height}px`;
            chatContainerRef.current.style.top = `${window.visualViewport.offsetTop}px`; // Handle scroll offset if any
            scrollToBottom();
        }
    };

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleResize);
        window.visualViewport.addEventListener('scroll', handleResize);
        handleResize(); // Initial set
    }

    return () => {
        if (window.visualViewport) {
            window.visualViewport.removeEventListener('resize', handleResize);
            window.visualViewport.removeEventListener('scroll', handleResize);
        }
    };
  }, []);

  const scrollToBottom = () => {
    // Small timeout to allow DOM update
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

  // --- Logic Flow (Hybrid: Structured + AI) ---
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
                message: `Olá, ${userName}! 🐶 Sou o assistente inteligente da PetSpa. Posso agendar banhos, cadastrar seus pets e tirar dúvidas. Como ajudo?`,
                options: [
                    { label: '📅 Agendar Banho', action: 'triggerAI_Appointment' },
                    { label: '🐶 Cadastrar Pet', action: 'triggerAI_NewPet' },
                    { label: '🏠 Menu Principal', action: 'navHome' }
                ]
            };
        } else {
            node = {
                message: 'Olá! Sou o mascote da PetSpa 🐶. Para agendamentos inteligentes e suporte completo, preciso que você entre na sua conta.',
                options: [
                    { label: '🔐 Entrar / Cadastrar', action: 'navLogin' },
                    { label: '📍 Apenas ver endereço', nextNode: 'CONTACT' }
                ]
            };
        }
        break;

      case 'CONTACT':
        node = {
           message: 'Estamos na Av. Pet, 123.\n📞 (11) 99999-9999',
           options: [{ label: 'Voltar', nextNode: 'START' }]
        };
        break;

      default:
        // Se cair aqui, deixa o usuário falar com a AI
        break;
    }

    if (node.message) addMessage(node.message, 'bot', node.options);
  };

  const handleOption = (opt: any) => {
    if (opt.nextNode) processNode(opt.nextNode);
    
    // Navigation Actions
    if (opt.action === 'navLogin') onNavigate('login');
    else if (opt.action === 'navHome') onNavigate('home');
    else if (opt.action === 'navServices') onNavigate('services');
    else if (opt.action === 'navProfile') onNavigate('user-profile');
    else if (opt.action === 'navMarket') onNavigate('market');
    
    // Quick actions that just paste text for the AI to process
    else if (opt.action === 'triggerAI_Appointment') {
        handleInputSubmit(null, "Quero agendar um serviço");
    }
    else if (opt.action === 'triggerAI_NewPet') {
        handleInputSubmit(null, "Quero cadastrar um novo pet");
    }
  };

  // --- BACKUP BRAIN (Decision Tree) ---
  const activateBackupBrain = (text: string) => {
    const t = text.toLowerCase();
    
    // 1. Agendamento
    if (t.includes('agenda') || t.includes('marca') || t.includes('banho') || t.includes('tosa')) {
       return {
         message: "Estou com uma instabilidade momentânea na minha conexão neural 🔌. Mas não se preocupe! Você pode agendar agora mesmo pelo nosso sistema manual.",
         options: [
           { label: '📅 Ir para Agendamento', action: 'navServices' },
           { label: '🏠 Menu Principal', action: 'navHome' }
         ]
       };
    }
    
    // 2. Preços
    if (t.includes('preço') || t.includes('valor') || t.includes('custa') || t.includes('serviço')) {
        return {
          message: "No momento não consigo consultar o banco de dados de preços detalhado. Por favor, veja nossa lista completa na aba Serviços.",
          options: [
            { label: '💲 Ver Tabela de Preços', action: 'navServices' }
          ]
        };
    }

    // 3. Cadastro / Pets
    if (t.includes('pet') || t.includes('cadastra') || t.includes('novo')) {
         return {
          message: "Para cadastrar um novo amiguinho, acesse seu perfil.",
          options: [
            { label: '🐶 Meu Perfil', action: 'navProfile' }
          ]
        };
    }

    // Default Backup Fallback
    return {
      message: "Ops! Meu cérebro principal está fora do ar (manutenção programada). 🛠️\n\nMas o app continua funcionando! O que deseja fazer?",
      options: [
         { label: '📅 Agendar', action: 'navServices' },
         { label: '🛍️ Loja', action: 'navMarket' },
         { label: '👤 Meu Perfil', action: 'navProfile' }
      ]
    };
  };

  const handleInputSubmit = async (e: React.FormEvent | null, textOverride?: string) => {
    if (e) e.preventDefault();
    
    const textToSend = textOverride || inputValue;
    if (!textToSend.trim()) return;

    // 1. User Message
    addMessage(textToSend, 'user');
    setInputValue('');
    setIsTyping(true);

    // 2. AI Processing (Action Capable)
    try {
        // Map history to simple text format or structured format for Gemini
        // Using the last 10 messages for context
        const historyContext = messages.slice(-10).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        })) as { role: 'user' | 'model', parts: [{ text: string }] }[];

        const responseText = await geminiService.sendMessage(
            historyContext, 
            textToSend, 
            currentUserId // Pass User ID so AI can execute CRUD operations
        );

        setIsTyping(false);
        addMessage(responseText, 'bot');

    } catch (err) {
        setIsTyping(false);
        console.error("AI Error, activating backup brain", err);
        
        // --- BACKUP BRAIN ACTIVATION ---
        const fallback = activateBackupBrain(textToSend);
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
              <span className="status-indicator"></span>
              {currentUserId ? 'Conectado & Habilitado' : 'Visitante'}
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
               placeholder="Digite aqui..."
             />
         </div>
         <button type="submit" className="chat-send-btn" disabled={!inputValue.trim()}>
            <Send size={20} />
         </button>
      </form>
    </div>
  );
};