import React, { useState, useMemo } from 'react';
import { ChevronLeft, Clock, CheckCircle, Droplet, Sparkles, X, Calendar, DollarSign, Scissors, CalendarClock, AlertCircle, ChevronRight, Activity, CalendarCheck } from 'lucide-react';
import { Appointment, Pet, Route } from '../types';
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
    onNavigate: (route: Route) => void;
    setSelectedAppointment: (app: Appointment) => void;
}

export const PetDetailsView: React.FC<PetDetailsProps> = ({ selectedPet, apps, onNavigate, setSelectedAppointment }) => {
     if (!selectedPet) return null;
     
     // Filtrar histórico
     const petHistory = apps.filter(a => a.pet_id === selectedPet.id);
     
     const renderServiceIcon = (name: string) => {
        const n = (name || '').toLowerCase();
        if (n.includes('tosa')) return <Scissors size={18} />;
        if (n.includes('banho')) return <Droplet size={18} />;
        return <Sparkles size={18} />;
     };

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
      const steps = [
          { status: 'pending', label: 'Solicitado' },
          { status: 'confirmed', label: 'Confirmado' },
          { status: 'in_progress', label: 'Em Andamento' },
          { status: 'completed', label: 'Pronto' }
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

      return (
        <div className="container page-enter" style={{ paddingTop: 20 }}>
            <div className="nav-header">
               <button className="btn-icon-sm" onClick={() => onNavigate('dashboard')}><ChevronLeft /></button>
               <h3>Acompanhamento</h3>
               <div style={{width: 44}}></div>
           </div>

           <div className="card status-card reveal-on-scroll">
               <div className="status-icon-lg pulse-animation">
                   {app.status === 'pending' && <Clock size={40}/>}
                   {app.status === 'confirmed' && <CheckCircle size={40}/>}
                   {app.status === 'in_progress' && <Droplet size={40}/>}
                   {app.status === 'completed' && <Sparkles size={40}/>}
                   {app.status === 'cancelled' && <X size={40}/>}
               </div>
               <div className="status-title">
                   {isCancelled ? 'Cancelado' : steps[currentStepIdx]?.label || 'Status Desconhecido'}
               </div>
               <p style={{margin:0}}>Pedido #{app.id}</p>

               {!isCancelled && (
                   <div className="progress-track" style={{marginTop: 32}}>
                       {steps.map((step, idx) => {
                           const isActive = idx <= currentStepIdx;
                           return (
                               <div key={step.status} className={`step ${isActive ? 'active' : ''}`}>
                                   <div className={`step-circle ${isActive ? 'active' : ''}`}>
                                       {idx + 1}
                                   </div>
                                   <div className="step-label">{step.label}</div>
                               </div>
                           );
                       })}
                   </div>
               )}
           </div>

           <div className="card reveal-on-scroll">
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                   <h3 style={{margin:0}}>Detalhes do Serviço</h3>
                   
                   {/* BOTÃO REAGENDAR */}
                   {!isCancelled && app.status !== 'completed' && app.status !== 'in_progress' && (
                       <button 
                         className={`btn btn-sm ${canReschedule ? 'btn-ghost' : 'btn-secondary'}`} 
                         disabled={!canReschedule}
                         style={{border:'1px solid #ddd'}}
                         onClick={() => setShowReschedule(true)}
                       >
                           {canReschedule ? <><CalendarClock size={16} style={{marginRight:6}}/> Reagendar</> : 'Bloqueado (<24h)'}
                       </button>
                   )}
               </div>
               
               <div style={{display:'flex', alignItems:'center', gap:16, marginBottom: 16}}>
                   <div className="service-preview-icon" style={{width: 48, height: 48, margin:0, fontSize:'1.2rem'}}><Scissors size={20}/></div>
                   <div>
                       <strong style={{display:'block', fontSize:'1.1rem'}}>{app.services?.name}</strong>
                       <span style={{color:'#666'}}>{app.services?.duration_minutes} min • {formatCurrency(app.services?.price || 0)}</span>
                   </div>
               </div>

               <hr style={{border:'none', borderTop:'1px solid #eee', margin: '16px 0'}} />

               <div style={{display:'grid', gap: 16}}>
                   <div style={{display:'flex', alignItems:'center', gap: 12}}>
                       <Calendar size={20} color="#FF8C42" />
                       <div>
                           <small style={{display:'block', color:'#999'}}>Data</small>
                           <strong>{new Date(app.start_time).toLocaleDateString()}</strong>
                       </div>
                   </div>
                   <div style={{display:'flex', alignItems:'center', gap: 12}}>
                       <Clock size={20} color="#FF8C42" />
                       <div>
                           <small style={{display:'block', color:'#999'}}>Horário</small>
                           <strong>{new Date(app.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
                       </div>
                   </div>
                   <div style={{display:'flex', alignItems:'center', gap: 12}}>
                       <div style={{width:20, textAlign:'center'}}>🐶</div>
                       <div>
                           <small style={{display:'block', color:'#999'}}>Pet</small>
                           <strong>{app.pets?.name}</strong>
                       </div>
                   </div>
                   <div style={{display:'flex', alignItems:'center', gap: 12}}>
                       <DollarSign size={20} color="#00B894" />
                       <div>
                           <small style={{display:'block', color:'#999'}}>Total</small>
                           <strong style={{color:'#00B894', fontSize:'1.1rem'}}>{formatCurrency(app.services?.price || 0)}</strong>
                       </div>
                   </div>
               </div>
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