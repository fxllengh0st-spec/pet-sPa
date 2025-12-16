
import React, { useState, useMemo } from 'react';
import { ChevronLeft, Clock, CheckCircle, Droplet, Sparkles, X, Calendar, DollarSign, Scissors, CalendarClock, AlertCircle, ChevronRight, Activity, CalendarCheck, Crown, Hourglass, MessageCircle, MapPin, ShieldCheck, Phone } from 'lucide-react';
import { Appointment, Pet, Route, Subscription } from '../types';
import { formatCurrency, formatDate, getPetAvatarUrl } from '../utils/ui';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ActiveTrackingCard } from '../components/ActiveTrackingCard';

// Config (Duplicated for simplicity in this file scope)
const BUSINESS_CONFIG = {
    OPEN_HOUR: 9, CLOSE_HOUR: 18, WORK_DAYS: [1, 2, 3, 4, 5, 6], SLOT_INTERVAL: 30
};

interface PetDetailsProps {
    selectedPet: Pet | null;
    apps: Appointment[];
    subscriptions?: Subscription[];
    onNavigate: (route: Route) => void;
    setSelectedAppointment: (app: Appointment) => void;
}

export const PetDetailsView: React.FC<PetDetailsProps> = ({ selectedPet, apps, subscriptions = [], onNavigate, setSelectedAppointment }) => {
     if (!selectedPet) return null;
     
     // Filtrar histórico
     const petHistory = apps.filter(a => a.pet_id === selectedPet.id);
     
     // Buscar assinatura ativa
     const activeSub = subscriptions.find(s => s.pet_id === selectedPet.id && s.status === 'active');

     const renderServiceIcon = (name: string) => {
        const n = (name || '').toLowerCase();
        if (n.includes('tosa')) return <Scissors size={18} />;
        if (n.includes('banho')) return <Droplet size={18} />;
        return <Sparkles size={18} />;
     };

     // Subscription Metrics
     const subMetrics = useMemo(() => {
         if (!activeSub || !activeSub.packages) return null;
         
         const createdAt = new Date(activeSub.created_at);
         const expiresAt = new Date(createdAt);
         expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias de validade
         
         const now = new Date();
         const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 3600 * 24)));
         const totalBaths = activeSub.packages.bath_count;
         
         // Contar agendamentos realizados/agendados APÓS a criação da assinatura
         // Lógica simples: Considerar agendamentos com data > created_at
         // Em produção, idealmente teríamos um vínculo ID.
         const subAppointments = apps.filter(a => 
             a.pet_id === selectedPet.id && 
             a.status !== 'cancelled' &&
             new Date(a.created_at) >= createdAt
         );
         
         const usedCount = subAppointments.filter(a => a.status === 'completed' || a.status === 'in_progress').length;
         const scheduledCount = subAppointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length;
         
         // Total "Usado/Comprometido"
         const totalUsedOrScheduled = usedCount + scheduledCount;
         const remaining = Math.max(0, totalBaths - totalUsedOrScheduled);
         const progressPct = Math.min(100, (totalUsedOrScheduled / totalBaths) * 100);

         return { daysLeft, totalBaths, usedCount, scheduledCount, remaining, progressPct, expiresAt };
     }, [activeSub, apps, selectedPet]);

     return (
        <div className="container page-enter" style={{ paddingTop: 20 }}>
           <div className="nav-header">
               <button className="btn-icon-sm" onClick={() => onNavigate('user-profile')}><ChevronLeft /></button>
               <h3>Detalhes do Pet</h3>
               <div style={{width: 44}}></div>
           </div>

           {/* HEADER DO PET */}
           <div className="card reveal-on-scroll" style={{textAlign:'center', padding: '30px 20px', marginBottom: 24}}>
               <div style={{position:'relative', display:'inline-block'}}>
                   <img src={getPetAvatarUrl(selectedPet.name)} alt={selectedPet.name} style={{width: 100, height: 100, margin: '0 auto 16px', display: 'block', border:'4px solid white', boxShadow:'0 8px 20px rgba(0,0,0,0.1)'}} className="pet-avatar-3d" />
                   <div style={{position:'absolute', bottom: 16, right: 0, background: 'var(--surface)', borderRadius:'50%', padding: 6, boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
                       {selectedPet.breed?.toLowerCase().includes('gato') ? '🐱' : '🐶'}
                   </div>
               </div>
               
               <h2 style={{fontSize:'1.8rem', marginBottom: 4}}>{selectedPet.name}</h2>
               <p style={{color:'#666', fontSize:'0.95rem'}}>{selectedPet.breed || 'Sem raça definida'}</p>
               
               <div style={{display:'flex', justifyContent:'center', gap: 12, marginTop: 16}}>
                   {selectedPet.weight && <span className="tag-pill">⚖️ {selectedPet.weight} kg</span>}
                   {selectedPet.birth_date && <span className="tag-pill">🎂 {new Date(selectedPet.birth_date).getFullYear()}</span>}
               </div>

               {selectedPet.notes && (
                   <div style={{marginTop: 20, background: '#FFF9C4', padding: '12px 16px', borderRadius: 12, color: '#FBC02D', fontSize: '0.85rem', textAlign: 'left', border: '1px solid #FFF59D'}}>
                      <strong>📝 Observações:</strong> {selectedPet.notes}
                   </div>
               )}
           </div>

           {/* --- NOVO: CARTÃO DE ASSINATURA ATIVA --- */}
           {activeSub && subMetrics && (
               <div className="card reveal-on-scroll" style={{background: 'linear-gradient(135deg, #00B894 0%, #00CEC9 100%)', color: 'white', border:'none', overflow:'hidden', position:'relative', marginBottom: 24}}>
                   <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 16}}>
                       <div style={{display:'flex', gap: 12, alignItems:'center'}}>
                           <div style={{background:'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12}}>
                               <Crown size={24} fill="white" />
                           </div>
                           <div>
                               <h3 style={{color:'white', margin:0, fontSize:'1.1rem'}}>{activeSub.packages?.title}</h3>
                               <p style={{color:'rgba(255,255,255,0.9)', margin:0, fontSize:'0.85rem'}}>Assinatura Ativa</p>
                           </div>
                       </div>
                       <div className="tag-pill" style={{background:'rgba(255,255,255,0.2)', color:'white', border:'none', fontWeight: 700}}>
                           {subMetrics.daysLeft} dias rest.
                       </div>
                   </div>

                   <div style={{marginBottom: 8, display:'flex', justifyContent:'space-between', fontSize:'0.85rem', fontWeight: 600}}>
                       <span>Utilizado: {subMetrics.usedCount + subMetrics.scheduledCount}/{subMetrics.totalBaths}</span>
                       <span>Restam: {subMetrics.remaining}</span>
                   </div>
                   
                   <div style={{background:'rgba(0,0,0,0.1)', height: 8, borderRadius: 4, overflow:'hidden', marginBottom: 16}}>
                       <div style={{background:'white', height:'100%', width: `${subMetrics.progressPct}%`}}></div>
                   </div>

                   <div style={{display:'flex', alignItems:'center', gap: 8, fontSize: '0.8rem', color:'rgba(255,255,255,0.85)'}}>
                       <Hourglass size={14} />
                       Válido até {subMetrics.expiresAt.toLocaleDateString()}
                   </div>

                   {/* Background Decor */}
                   <div style={{position:'absolute', right: -20, bottom: -30, opacity: 0.15, transform: 'rotate(-15deg)'}}>
                       <Crown size={120} fill="white" />
                   </div>
               </div>
           )}

           {/* CARD DE STATUS ATIVO (TRACKING) USANDO O COMPONENTE REUTILIZÁVEL */}
           <ActiveTrackingCard 
                appointments={apps} 
                filterPetId={selectedPet.id}
                onNavigate={onNavigate}
                setSelectedAppointment={setSelectedAppointment}
           />

           <h3 className="section-title reveal-on-scroll" style={{marginTop: 32}}>Histórico Completo</h3>
           <div className="card reveal-on-scroll" style={{padding: 0, overflow:'hidden'}}>
               {petHistory.length === 0 ? (
                   <div style={{padding:40, textAlign:'center', color:'#999'}}>
                       <div style={{fontSize:'2rem', marginBottom:10}}>📅</div>
                       Nenhum serviço realizado ainda.<br/>Que tal agendar o primeiro?
                   </div>
               ) : (
                   <div>
                       {petHistory.map(a => (
                         <div key={a.id} className="history-list-item clickable-card" onClick={() => { setSelectedAppointment(a); onNavigate('appointment-details'); }}>
                            <div style={{display:'flex', alignItems:'center'}}>
                                <div className="history-icon-box">
                                    {renderServiceIcon(a.services?.name || '')}
                                </div>
                                <div>
                                    <strong style={{fontSize:'0.95rem', display:'block'}}>{a.services?.name}</strong>
                                    <span style={{fontSize:'0.8rem', color:'#666'}}>{formatDate(a.start_time)}</span>
                                </div>
                            </div>
                            <div style={{textAlign:'right'}}>
                                <div style={{fontWeight:700, fontSize:'0.9rem', color:'var(--primary)'}}>{formatCurrency(a.services?.price || 0)}</div>
                                <span className={`status-badge tag-${a.status}`} style={{marginTop:4, fontSize:'0.65rem'}}>{a.status}</span>
                            </div>
                         </div>
                       ))}
                   </div>
               )}
           </div>
        </div>
     );
};

interface AppointmentDetailsProps {
    selectedAppointment: Appointment | null;
    onNavigate: (route: Route) => void;
}

export const AppointmentDetailsView: React.FC<AppointmentDetailsProps> = ({ selectedAppointment, onNavigate }) => {
      const [showReschedule, setShowReschedule] = useState(false);
      const [newDate, setNewDate] = useState('');
      const [newTime, setNewTime] = useState<string|null>(null);
      const [isProcessing, setIsProcessing] = useState(false);
      
      const toast = useToast();

      if (!selectedAppointment) return null;
      const app = selectedAppointment;
      
      // Definição dos passos da Timeline
      const steps = [
          { status: 'pending', label: 'Solicitado', desc: 'Aguardando confirmação da loja.' },
          { status: 'confirmed', label: 'Confirmado', desc: 'Tudo certo! Aguardamos vocês.' },
          { status: 'in_progress', label: 'Em Andamento', desc: `${app.pets?.name} está relaxando no banho.` },
          { status: 'completed', label: 'Pronto', desc: 'Seu pet já pode ser retirado!' }
      ];
      
      const currentStepIdx = steps.findIndex(s => s.status === app.status);
      const isCancelled = app.status === 'cancelled';
      
      // Validação de 24h para reagendamento
      const canReschedule = useMemo(() => {
          if (isCancelled || app.status === 'completed') return false;
          const now = new Date();
          const appDate = new Date(app.start_time);
          const diffHours = (appDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          return diffHours >= 24;
      }, [app]);

      // --- LOGICA DE SLOTS REAGENDAMENTO ---
      const timeSlots = useMemo(() => {
        if (!newDate) return [];
        const slots: string[] = [];
        const now = new Date();
        const isToday = newDate === now.toLocaleDateString('en-CA');
        let currentHour = BUSINESS_CONFIG.OPEN_HOUR;
        let currentMinute = 0;
        const duration = app.services?.duration_minutes || 60;
        const lastStartHour = BUSINESS_CONFIG.CLOSE_HOUR - (duration/60);

        while (currentHour < BUSINESS_CONFIG.CLOSE_HOUR) {
            const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            const decimalTime = currentHour + (currentMinute / 60);

            if (decimalTime > lastStartHour + 0.001) break;

            let isValid = true;
            if (isToday) {
                const slotDate = new Date(`${newDate}T${timeStr}:00`);
                if (slotDate < new Date(now.getTime() + 30*60000)) isValid = false;
            }
            if (isValid) slots.push(timeStr);
            currentMinute += BUSINESS_CONFIG.SLOT_INTERVAL;
            if (currentMinute >= 60) { currentHour++; currentMinute = 0; }
        }
        return slots;
      }, [newDate, app]);

      const handleReschedule = async () => {
          if(!newDate || !newTime) return;
          setIsProcessing(true);
          try {
              const startIso = `${newDate}T${newTime}:00`;
              const duration = app.services?.duration_minutes || 60;
              const endIso = new Date(new Date(startIso).getTime() + duration * 60000).toISOString();
              
              await api.booking.rescheduleAppointment(app.id, new Date(startIso).toISOString(), endIso);
              toast.success("Agendamento atualizado com sucesso!");
              setShowReschedule(false);
              onNavigate('dashboard'); // Força refresh ao voltar
          } catch (e) {
              toast.error("Erro ao reagendar. Tente outro horário.");
          } finally {
              setIsProcessing(false);
          }
      };

      // Helper Text for Hero
      const getHeroText = () => {
          if(isCancelled) return "Serviço Cancelado";
          switch(app.status) {
              case 'pending': return "Aguardando Loja";
              case 'confirmed': return "Confirmado!";
              case 'in_progress': return "Em Atendimento";
              case 'completed': return "Serviço Finalizado";
              default: return "Processando";
          }
      };

      const getHeroSubtext = () => {
          if(isCancelled) return "Este agendamento foi cancelado.";
          switch(app.status) {
              case 'pending': return "Estamos verificando a disponibilidade.";
              case 'confirmed': return `Te esperamos dia ${new Date(app.start_time).toLocaleDateString()}!`;
              case 'in_progress': return `${app.pets?.name} está ficando lindo(a)! 🛁`;
              case 'completed': return "Tudo pronto! Pode vir buscar.";
              default: return "";
          }
      };

      return (
        <div className="container page-enter" style={{ paddingTop: 20, paddingBottom: 40 }}>
            {/* Nav Header */}
            <div className="nav-header">
               <button className="btn-icon-sm" onClick={() => onNavigate('dashboard')}><ChevronLeft /></button>
               <h3>Acompanhamento</h3>
               <div style={{width: 44}}></div>
           </div>

           {/* --- HERO STATUS CARD (VISUAL) --- */}
           <div className={`tracker-hero tracker-bg-${app.status} reveal-on-scroll`}>
                <div className="hero-icon-lg pulse-animation">
                    {app.status === 'pending' && <Clock size={40} color="white"/>}
                    {app.status === 'confirmed' && <CalendarCheck size={40} color="white"/>}
                    {app.status === 'in_progress' && <Droplet size={40} color="white"/>}
                    {app.status === 'completed' && <Sparkles size={40} color="white"/>}
                    {app.status === 'cancelled' && <X size={40} color="white"/>}
                </div>
                <h2 style={{color:'white', margin:0, fontSize:'1.8rem'}}>{getHeroText()}</h2>
                <p style={{color:'rgba(255,255,255,0.9)', margin:0}}>{getHeroSubtext()}</p>
           </div>

           {/* --- INFO PRINCIPAL GRID --- */}
           <div className="stats-row-mini reveal-on-scroll" style={{gridTemplateColumns: '1fr 1fr'}}>
               <div className="detail-info-card">
                   <div className="detail-icon-box"><CalendarClock size={24}/></div>
                   <div>
                       <span style={{fontSize:'0.75rem', color:'#999', display:'block'}}>Data & Hora</span>
                       <strong>{new Date(app.start_time).toLocaleDateString()}</strong>
                       <div style={{fontSize:'0.85rem'}}>{new Date(app.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                   </div>
               </div>
               
               <div className="detail-info-card">
                   <div className="detail-icon-box"><DollarSign size={24}/></div>
                   <div>
                       <span style={{fontSize:'0.75rem', color:'#999', display:'block'}}>Valor Total</span>
                       <strong>{formatCurrency(app.services?.price || 0)}</strong>
                       <div style={{fontSize:'0.75rem', color:'var(--primary)'}}>Pagamento na loja</div>
                   </div>
               </div>
           </div>

           {/* --- VERTICAL TIMELINE --- */}
           {!isCancelled && (
               <div className="card reveal-on-scroll" style={{padding: '24px 20px'}}>
                   <h3 style={{fontSize:'1.1rem', marginBottom: 4}}>Linha do Tempo</h3>
                   <p style={{fontSize:'0.85rem', color:'#999'}}>Acompanhe cada etapa do processo</p>
                   
                   <div className="timeline-container">
                       <div className="timeline-track"></div>
                       {steps.map((step, idx) => {
                           const isCompleted = idx < currentStepIdx;
                           const isCurrent = idx === currentStepIdx;
                           const isPending = idx > currentStepIdx;
                           
                           return (
                               <div key={step.status} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''} ${isCurrent ? 'active-text' : 'inactive-text'}`}>
                                   <div className="step-dot">
                                       {isCompleted ? <CheckCircle size={16} /> : (idx + 1)}
                                   </div>
                                   <div className="step-content">
                                       <strong>{step.label}</strong>
                                       <p>{step.desc}</p>
                                   </div>
                               </div>
                           );
                       })}
                   </div>
               </div>
           )}

           {/* --- PET & SERVICE INFO --- */}
           <div className="card reveal-on-scroll" style={{display:'flex', gap: 16, alignItems:'center'}}>
                <img src={getPetAvatarUrl(app.pets?.name || '')} style={{width: 60, height: 60, borderRadius: '50%', objectFit:'cover'}} />
                <div style={{flex:1}}>
                    <strong style={{fontSize:'1.1rem', color:'var(--secondary)'}}>{app.pets?.name}</strong>
                    <div style={{display:'flex', alignItems:'center', gap: 6, fontSize:'0.9rem', color:'#666', marginTop: 2}}>
                        <Scissors size={14} /> {app.services?.name}
                    </div>
                </div>
           </div>

           {/* --- ACTIONS FOOTER --- */}
           <div style={{marginTop: 24, paddingBottom: 24}}>
                {/* BOTÃO REAGENDAR */}
                {!isCancelled && app.status !== 'completed' && app.status !== 'in_progress' && (
                    <button 
                        className={`btn full-width mb-4 ${canReschedule ? 'btn-white' : 'btn-secondary'}`} 
                        disabled={!canReschedule}
                        style={{border:'1px solid #ddd'}}
                        onClick={() => setShowReschedule(true)}
                    >
                        {canReschedule ? <><CalendarClock size={18} style={{marginRight:8}}/> Alterar Data/Horário</> : 'Reagendamento Bloqueado (<24h)'}
                    </button>
                )}

                <button 
                    className="btn btn-ghost full-width"
                    onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                >
                    <MessageCircle size={18} style={{marginRight: 8}}/> Preciso de Ajuda
                </button>
           </div>

           {/* MODAL REAGENDAR */}
           {showReschedule && (
               <div className="modal-overlay">
                   <div className="modal-content">
                       <div className="modal-header">
                           <h3>Alterar Data</h3>
                           <button onClick={() => setShowReschedule(false)} className="btn-icon-sm"><X size={20}/></button>
                       </div>
                       <div className="wizard-body" style={{padding:20}}>
                            <div className="form-group">
                                <label>Nova Data</label>
                                <input type="date" className="input-lg" value={newDate} min={new Date(Date.now() + 86400000).toLocaleDateString('en-CA')} onChange={e => { setNewDate(e.target.value); setNewTime(null); }} />
                                <small style={{color:'#666'}}>Mínimo 24h de antecedência.</small>
                            </div>
                            
                            {newDate && (
                                <>
                                    <label style={{display:'block', marginBottom:8, fontWeight:700, fontSize:'0.85rem', color:'var(--secondary)'}}>Horários Disponíveis</label>
                                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, maxHeight: 180, overflowY: 'auto', paddingRight: 4, marginBottom:16}}>
                                        {timeSlots.map(time => (
                                            <button key={time} onClick={() => setNewTime(time)} className={`py-2 px-1 rounded-lg text-sm font-bold border transition-all ${newTime === time ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 hover:border-purple-300'}`}>{time}</button>
                                        ))}
                                    </div>
                                </>
                            )}

                            <button className={`btn btn-primary full-width ${isProcessing ? 'loading' : ''}`} disabled={!newDate || !newTime || isProcessing} onClick={handleReschedule}>
                                {isProcessing ? 'Confirmando...' : 'Confirmar Mudança'}
                            </button>
                       </div>
                   </div>
               </div>
           )}
        </div>
      );
};
