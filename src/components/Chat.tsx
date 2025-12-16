
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { botEngine, BotState, BotContext, BotOption } from '../services/bot-engine';
import { Send, X, RefreshCw, Bot } from 'lucide-react';

// URL base do Bucket
const BASE_STORAGE_URL = 'https://vfryefavzurwoiuznkwv.supabase.co/storage/v1/object/public/site-assets';
// Fallback confiável para o avatar do bot
const BOT_FALLBACK_IMG = 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png';

interface ChatProps {
  onNavigate: (route: string) => void;
  onActionSuccess?: () => void;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  options?: BotOption[];
}

export const Chat: React.FC<ChatProps> = ({ onNavigate, onActionSuccess, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [botAvatarSrc, setBotAvatarSrc] = useState(`${BASE_STORAGE_URL}/bt.webp`);
  
  // Layout Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Inputs
  const [inputValue, setInputValue] = useState('');
  
  // Bot Engine State
  const [botState, setBotState] = useState<BotState>('START');
  const [botContext, setBotContext] = useState<BotContext>({});

  const scrollToBottom = () => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initial Load & Session
  useEffect(() => {
      const initBot = async () => {
          const session = await api.auth.getSession();
          const initialContext: BotContext = {};
          
          if (session) {
              initialContext.userId = session.user.id;
              initialContext.userName = session.user.user_metadata.full_name?.split(' ')[0];
          }

          setBotContext(initialContext);
          
          // Trigger first message
          await processBotTurn('START', '', initialContext);
      };
      initBot();
  }, []);

  const addMessage = (text: string, sender: 'bot' | 'user', options: BotOption[] = []) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), text, sender, options }]);
  };

  const processBotTurn = async (currentState: BotState, input: string, context: BotContext, isOption: boolean = false) => {
      if (currentState !== 'START') setIsTyping(true);
      
      // Simulate "Thinking" time for UX
      await new Promise(r => setTimeout(r, 600));

      try {
          const response = await botEngine.processMessage(currentState, input, context, isOption);
          
          setIsTyping(false);
          addMessage(response.text, 'bot', response.options);
          
          setBotState(response.nextState);
          setBotContext(response.updatedContext);

          if (response.shouldRefreshApp && onActionSuccess) {
              onActionSuccess();
          }

      } catch (error) {
          setIsTyping(false);
          console.error("Bot Error:", error);
          addMessage("Desculpe, tive um erro interno. Podemos recomeçar?", 'bot', [{ label: 'Reiniciar', value: 'menu' }]);
          setBotState('MAIN_MENU');
      }
  };

  const handleOptionClick = (opt: BotOption) => {
      if (opt.action === 'link' && opt.value === 'login') {
          onNavigate('login');
          return;
      }
      
      // Add user selection as a message
      addMessage(opt.label, 'user');
      processBotTurn(botState, opt.value, botContext, true);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    addMessage(inputValue, 'user');
    const textToSend = inputValue;
    setInputValue('');
    
    processBotTurn(botState, textToSend, botContext, false);
  };

  const handleRestart = () => {
      setMessages([]);
      setBotState('START');
      const initBot = async () => {
        const session = await api.auth.getSession();
        const ctx: BotContext = session ? { userId: session.user.id, userName: session.user.user_metadata.full_name?.split(' ')[0] } : {};
        setBotContext(ctx);
        processBotTurn('START', '', ctx);
      };
      initBot();
  };

  return (
    <div className="chat-layout widget-mode pop-in" ref={chatContainerRef}>
      {/* Header with Close Button */}
      <div className="chat-header-modern">
        <div className="chat-header-info">
          <div className="chat-avatar-ring">
             <img 
                src={botAvatarSrc} 
                className="bot-avatar-img" 
                alt="Bot"
                onError={(e) => {
                    e.currentTarget.onerror = null; // Previne loop
                    e.currentTarget.src = BOT_FALLBACK_IMG;
                }}
             />
          </div>
          <div className="chat-title-group">
            <h3>Assistente PetSpa</h3>
            <div className="chat-status">
              <span className="status-indicator"></span>
              Online
            </div>
          </div>
        </div>
        
        <div style={{display:'flex', gap: 4}}>
            <button onClick={handleRestart} className="chat-icon-btn" title="Reiniciar Conversa">
                <RefreshCw size={20} />
            </button>
            <button onClick={onClose} className="chat-icon-btn close-btn" title="Fechar">
                <X size={24} />
            </button>
        </div>
      </div>
      
      <div className="chat-messages-area">
        <div className="chat-date-divider"><span>Hoje</span></div>
        
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-row ${msg.sender === 'user' ? 'row-user' : 'row-bot'}`}>
            {msg.sender === 'bot' && (
                <div className="chat-msg-avatar">
                   <img 
                    src={botAvatarSrc} 
                    alt="bot"
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = BOT_FALLBACK_IMG;
                    }} 
                   />
                </div>
            )}
            
            <div style={{maxWidth: '100%'}}>
                <div className={`chat-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
                  {/* Markdown-like simple bold parsing */}
                  <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
                </div>
                
                {msg.sender === 'bot' && msg.options && msg.options.length > 0 && (
                  <div className="chat-options-grid">
                    {msg.options.map((opt, idx) => (
                      <button key={idx} className="chat-chip-btn" onClick={() => handleOptionClick(opt)}>
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
             <div className="chat-msg-avatar"><img src={botAvatarSrc} alt="bot" onError={(e) => { e.currentTarget.src = BOT_FALLBACK_IMG; }}/></div>
             <div className="chat-bubble bubble-bot typing-bubble">
               <span className="dot"></span><span className="dot"></span><span className="dot"></span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} style={{ height: 1 }} />
      </div>

      <form onSubmit={handleInputSubmit} className="chat-footer-modern">
         <div className="input-wrapper">
             <input 
               ref={inputRef}
               type="text"
               className="chat-input-modern" 
               value={inputValue} 
               onChange={e => setInputValue(e.target.value)}
               placeholder={botState.includes('SELECT') ? "Selecione uma opção..." : "Digite aqui..."}
               autoFocus
               disabled={isTyping}
             />
         </div>
         <button type="submit" className="chat-send-btn" disabled={!inputValue.trim() || isTyping}>
            <Send size={20} />
         </button>
      </form>
    </div>
  );
};
