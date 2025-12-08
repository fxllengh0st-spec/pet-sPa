
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { geminiService } from '../services/gemini';
import { Send, ChevronLeft, User, Loader2, Lock } from 'lucide-react';
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
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [flowContext, setFlowContext] = useState<any>({});
  
  // Mascote Avatar
  const [botAvatarSrc, setBotAvatarSrc] = useState(`${BASE_STORAGE_URL}/bt.webp`);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Controle de Input (null = botões apenas, 'text'/'password' = livre)
  const [inputType, setInputType] = useState<'text' | 'number' | 'datetime-local' | 'password' | null>('text');
  const [inputValue, setInputValue] = useState('');
  
  // Handler específico para fluxos rígidos (ex: capturar senha, email)
  // Se null, o input cai na IA (Gemini)
  const [inputHandler, setInputHandler] = useState<((val: string) => Promise<string>) | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, inputType]);

  const addMessage = (text: string, sender: 'bot' | 'user', options: any[] = []) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), text, sender, options }]);
  };

  // Opções padrão para devolver o usuário ao fluxo estruturado após conversa livre
  const getDefaultOptions = () => [
     { label: '📅 Agendar Banho', nextNode: 'FLOW_SCHEDULE_INIT' },
     { label: '🏠 Menu Inicial', nextNode: 'START' }
  ];

  const processNode = async (nodeId: string) => {
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 500)); 
    setIsTyping(false);
    setIsProcessingAction(false);

    let node: any = {};
    const userSession = await api.auth.getSession();

    switch (nodeId) {
      case 'START':
        setInputType('text'); // Deixa o usuário livre para digitar também
        setInputHandler(null); // Limpa handlers rígidos, libera IA
        
        if (userSession) {
            const userName = userSession.user.user_metadata.full_name?.split(' ')[0] || 'Tutor';
            node = {
                message: `Olá, ${userName}! 🐶 Tudo bem?`,
                options: [
                    { label: '📅 Novo Agendamento', nextNode: 'FLOW_SCHEDULE_INIT' },
                    { label: '🐾 Meus Pets', nextNode: 'CHECK_AUTH_PETS' },
                    { label: '💡 Dicas de Cuidado', action: 'triggerAIHint' }
                ]
            };
        } else {
            node = {
                message: 'Olá! Sou o mascote da PetSpa 🐶. Como posso ajudar seu melhor amigo hoje?',
                options: [
                    { label: '📅 Quero Agendar', nextNode: 'FLOW_SCHEDULE_INIT' },
                    { label: '🔐 Entrar / Cadastrar', nextNode: 'FLOW_AUTH_CHOICE' },
                    { label: '📍 Localização', nextNode: 'CONTACT' }
                ]
            };
        }
        break;

      // --- AUTHENTICATION FLOWS (Rígidos) ---
      case 'FLOW_AUTH_CHOICE':
        setInputType(null); // Trava input, força escolha
        node = {
            message: 'Para acessar essa área, preciso que você se identifique.',
            options: [
                { label: 'Já tenho conta', nextNode: 'FLOW_LOGIN_EMAIL' },
                { label: 'Criar conta nova', nextNode: 'FLOW_REGISTER_NAME' },
                { label: 'Cancelar', nextNode: 'START' }
            ]
        };
        break;

      // LOGIN
      case 'FLOW_LOGIN_EMAIL':
        node = { message: 'Qual seu **e-mail** cadastrado?' };
        setInputType('text');
        setInputHandler(() => async (val) => {
            setFlowContext((p:any) => ({ ...p, loginEmail: val }));
            return 'FLOW_LOGIN_PASS';
        });
        break;
      
      case 'FLOW_LOGIN_PASS':
        node = { message: 'Agora a **senha**, por favor:' };
        setInputType('password');
        setInputHandler(() => async (val) => {
            const { loginEmail } = flowContext;
            setIsProcessingAction(true);
            try {
                const { error } = await api.auth.signIn(loginEmail, val);
                if (error) {
                    addMessage('❌ Ops: ' + error.message, 'bot');
                    return 'FLOW_AUTH_CHOICE';
                }
                return 'AUTH_SUCCESS';
            } catch (e) {
                addMessage('Erro técnico no login.', 'bot');
                return 'START';
            }
        });
        break;

      // REGISTER
      case 'FLOW_REGISTER_NAME':
        node = { message: 'Oba, gente nova! Qual seu **nome completo**?' };
        setInputType('text');
        setInputHandler(() => async (val) => {
             setFlowContext((p:any) => ({ ...p, regName: val }));
             return 'FLOW_REGISTER_EMAIL';
        });
        break;

      case 'FLOW_REGISTER_EMAIL':
        node = { message: `Prazer, ${flowContext.regName}! Qual seu melhor **e-mail**?` };
        setInputType('text');
        setInputHandler(() => async (val) => {
             setFlowContext((p:any) => ({ ...p, regEmail: val }));
             return 'FLOW_REGISTER_PHONE';
        });
        break;
      
      case 'FLOW_REGISTER_PHONE':
        node = { message: 'Seu **celular** com DDD (pra gente avisar quando o banho acabar):' };
        setInputType('number');
        setInputHandler(() => async (val) => {
             setFlowContext((p:any) => ({ ...p, regPhone: val }));
             return 'FLOW_REGISTER_PASS';
        });
        break;

      case 'FLOW_REGISTER_PASS':
        node = { message: 'Crie uma **senha** segura:' };
        setInputType('password');
        setInputHandler(() => async (val) => {
             const { regName, regEmail, regPhone } = flowContext;
             setIsProcessingAction(true);
             try {
                const { error } = await api.auth.signUp(regEmail, val, regName, regPhone);
                if (error) {
                    addMessage('❌ Erro: ' + error.message, 'bot');
                    return 'FLOW_AUTH_CHOICE';
                }
                return 'AUTH_SUCCESS_REGISTER';
             } catch (e) {
                return 'START';
             }
        });
        break;

      case 'AUTH_SUCCESS':
        node = {
            message: 'Tudo certo! Você está logado. 🎉',
            options: [
                { label: '👤 Ver meu Perfil', action: 'navProfile' },
                { label: '📅 Agendar', nextNode: 'FLOW_SCHEDULE_INIT' }
            ]
        };
        setInputType('text');
        setInputHandler(null);
        break;

      case 'AUTH_SUCCESS_REGISTER':
        node = {
            message: 'Conta criada! Bem-vindo(a) à matilha. 🐾',
            options: [
                { label: '🐶 Cadastrar Pet', action: 'navProfile' },
                { label: '🏠 Menu Principal', nextNode: 'START' }
            ]
        };
        setInputType('text');
        setInputHandler(null);
        break;
      
      // --- SCHEDULING FLOW ---
      case 'FLOW_SCHEDULE_INIT':
        setInputType(null); // Trava para forçar botões
        if (!userSession) {
          node = { message: 'Para agendar, preciso saber quem é você.', options: [{ label: '🔐 Fazer Login', nextNode: 'FLOW_AUTH_CHOICE' }, { label: 'Cancelar', nextNode: 'START' }] };
        } else {
          const pets = await api.booking.getMyPets(userSession.user.id);
          if (pets.length === 0) {
            node = { message: 'Você ainda não cadastrou nenhum pet.', options: [{ label: 'Cadastrar Agora', action: 'navProfile' }, { label: 'Voltar', nextNode: 'START' }] };
          } else {
            node = {
              message: 'Para qual fofura é o banho hoje?',
              options: pets.map(p => ({
                label: p.name,
                action: 'setFlowData',
                payload: { petId: p.id, petName: p.name },
                nextNode: 'FLOW_SCHEDULE_SERVICE'
              }))
            };
          }
        }
        break;

      case 'FLOW_SCHEDULE_SERVICE':
        const services = await api.booking.getServices();
        node = {
          message: 'Beleza! Qual serviço?',
          options: services.map(s => ({
            label: `${s.name} (${formatCurrency(s.price)})`,
            action: 'setFlowData',
            payload: { 
              serviceId: s.id, 
              serviceName: s.name, 
              servicePrice: s.price, 
              serviceDuration: s.duration_minutes 
            },
            nextNode: 'FLOW_SCHEDULE_DATE'
          }))
        };
        break;

      case 'FLOW_SCHEDULE_DATE':
        const { petName, serviceName, servicePrice } = flowContext;
        node = { 
          message: `Combinado: **${serviceName}** para o(a) **${petName}** (${formatCurrency(servicePrice)}).\n\nQuando fica bom pra você?`,
          options: [
             { label: 'Mudar Serviço', nextNode: 'FLOW_SCHEDULE_SERVICE' }
          ]
        };
        setInputType('datetime-local');
        setInputHandler(() => async (val: string) => {
          setFlowContext((prev: any) => ({ ...prev, appointmentTime: val }));
          return 'FLOW_SCHEDULE_CONFIRM';
        });
        break;

      case 'FLOW_SCHEDULE_CONFIRM':
        setInputType(null);
        const dateStr = new Date(flowContext.appointmentTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        node = {
          message: `Resumindo: **${flowContext.serviceName}** dia **${dateStr}**.\nPosso confirmar?`,
          options: [
            { label: '✅ Confirmar', action: 'finalizeSchedule', nextNode: 'END_SUCCESS' },
            { label: '❌ Cancelar', nextNode: 'START' }
          ]
        };
        break;

      case 'END_SUCCESS':
        node = { 
          message: 'Agendado com sucesso! Já avisei a equipe. 🐾', 
          options: [{ label: 'Ver meus Agendamentos', action: 'navTracker' }, { label: 'Obrigado', nextNode: 'START' }] 
        };
        setInputType('text');
        setInputHandler(null);
        break;

      case 'CONTACT':
        node = {
           message: 'Estamos na Av. Pet, 123.\n📞 (11) 99999-9999\n⏰ Seg-Sex: 09h às 18h',
           options: [{ label: 'Voltar ao Início', nextNode: 'START' }]
        };
        break;
      
      case 'CHECK_AUTH_PETS':
         if(!userSession) {
            node = { message: 'Você precisa estar logado para ver seus pets.', options: [{label: 'Fazer Login', nextNode: 'FLOW_AUTH_CHOICE'}] };
         } else {
            const myPets = await api.booking.getMyPets(userSession.user.id);
            const petsList = myPets.length ? myPets.map(p => p.name).join(', ') : 'Nenhum pet encontrado.';
            node = { 
                message: `Seus pets: ${petsList}.`, 
                options: [
                    {label: 'Gerenciar Perfil', action: 'navProfile'},
                    {label: 'Menu', nextNode: 'START'}
                ] 
            };
         }
         break;

      default:
        node = { message: 'Algo mais?', options: [{ label: 'Voltar ao Início', nextNode: 'START' }] };
        setInputType('text'); 
        setInputHandler(null);
    }

    if (node.message) addMessage(node.message, 'bot', node.options);
  };

  const handleOption = async (opt: any) => {
    setIsProcessingAction(true);
    addMessage(opt.label, 'user');
    await new Promise(r => setTimeout(r, 300));

    if (opt.action === 'triggerAIHint') {
        // Apenas um atalho visual, mas libera botões para o usuário não ficar preso
        addMessage('Pode perguntar! Entendo de raças, saúde e cuidados. 🧠', 'bot', getDefaultOptions());
        setIsProcessingAction(false);
        setInputType('text');
        setInputHandler(null);
        return;
    }
    
    if (opt.action === 'setFlowData') {
      setFlowContext((prev: any) => ({ ...prev, ...opt.payload }));
    }

    if (opt.action === 'finalizeSchedule') {
      try {
         const { petId, serviceId, appointmentTime, serviceDuration } = flowContext;
         const start = new Date(appointmentTime);
         const end = new Date(start.getTime() + (serviceDuration || 60) * 60000);
         const session = await api.auth.getSession();
         if(session) await api.booking.createAppointment(session.user.id, petId, serviceId, start.toISOString(), end.toISOString());
      } catch (e) { console.error(e); addMessage("Tive um probleminha técnico...", 'bot', getDefaultOptions()); }
    }

    if (opt.action === 'navLogin') onNavigate('login');
    if (opt.action === 'navTracker') onNavigate('dashboard');
    if (opt.action === 'navProfile') onNavigate('user-profile');

    if (opt.nextNode) processNode(opt.nextNode);
    else setIsProcessingAction(false);
  };

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // UI Feedback
    const isPassword = inputType === 'password';
    const displayValue = isPassword ? '••••••' : (inputType === 'datetime-local' ? new Date(inputValue).toLocaleString() : inputValue);
    const rawVal = inputValue;

    addMessage(displayValue, 'user');
    setInputValue('');
    setIsProcessingAction(true);

    // 1. Lógica de Flow Rígido (Captura de dados específicos: senha, email, data)
    if (inputHandler) {
        setInputType(null); 
        await new Promise(r => setTimeout(r, 500));
        const nextNode = await inputHandler(rawVal);
        processNode(nextNode);
        return;
    }

    // 2. IA - O Cérebro do Mascote
    // Se não tem handler específico, é conversa natural com o Gemini
    setIsTyping(true);
    setIsProcessingAction(false); 
    
    // Envia contexto das últimas msgs para a IA não ficar perdida
    // Mapeia estritamente para o tipo esperado: role 'user' | 'model' e parts [{text: string}]
    const history = messages.slice(-10).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
    })) as { role: 'user' | 'model', parts: [{ text: string }] }[];

    const aiResponse = await geminiService.sendMessage(history, rawVal);
    
    setIsTyping(false);
    // A IA responde e devolve os botões principais para o usuário voltar ao fluxo
    addMessage(aiResponse, 'bot', getDefaultOptions());
  };

  useEffect(() => {
    // Inicia o chat automaticamente
    processNode('START');
  }, []);

  return (
    <div className="chat-layout">
      {isProcessingAction && (
        <div className="chat-processing-overlay">
          <Loader2 className="spinner" />
          <span>Processando...</span>
        </div>
      )}

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
                onError={() => setBotAvatarSrc(getPetAvatarUrl('PetSpa Bot'))}
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
      </div>
      
      {/* Messages Area */}
      <div className="chat-messages-area">
        <div className="chat-date-divider"><span>Hoje</span></div>
        
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-row ${msg.sender === 'user' ? 'row-user' : 'row-bot'}`}>
            
            {/* Avatarzinho na linha da mensagem */}
            {msg.sender === 'bot' && (
                <div className="chat-msg-avatar">
                   <img src={botAvatarSrc} alt="bot" />
                </div>
            )}
            
            <div style={{maxWidth: '100%'}}>
                <div className={`chat-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
                  {/* Renderização segura de HTML (para negritos e quebras de linha) */}
                  <div dangerouslySetInnerHTML={{ __html: (typeof msg.text === 'string' ? msg.text : '').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
                </div>
                
                {/* Opções (Botões) */}
                {msg.sender === 'bot' && msg.options && msg.options.length > 0 && (
                  <div className="chat-options-grid delay-options">
                    {msg.options.map((opt, idx) => (
                      <button key={idx} className="chat-chip-btn" onClick={() => handleOption(opt)} disabled={isProcessingAction}>
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
      {inputType && (
          <form onSubmit={handleInputSubmit} className="chat-footer-modern">
             <div className="input-wrapper">
                 <input 
                   ref={inputRef}
                   type={inputType === 'password' ? 'password' : (inputType || 'text')} 
                   className="chat-input-modern" 
                   value={inputValue} 
                   onChange={e => setInputValue(e.target.value)}
                   placeholder={
                        inputType === 'password' ? 'Digite sua senha...' : 
                        inputType === 'datetime-local' ? '' : 
                        'Digite aqui...'
                   }
                   min={inputType === 'datetime-local' ? toLocalISOString(new Date()) : undefined}
                   autoFocus
                 />
                 {inputType === 'password' && (
                     <Lock className="absolute right-4 text-gray-400" size={16} />
                 )}
             </div>
             <button type="submit" className="chat-send-btn" disabled={!inputValue.trim()}>
                <Send size={20} />
             </button>
          </form>
      )}
    </div>
  );
};
