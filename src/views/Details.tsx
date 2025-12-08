
import React from 'react';
import { ChevronLeft, Clock, CheckCircle, Droplet, Sparkles, X, Calendar, DollarSign, Scissors } from 'lucide-react';
import { Appointment, Pet, Route } from '../types';
import { formatCurrency, formatDate, getPetAvatarUrl } from '../utils/ui';

interface PetDetailsProps {
    selectedPet: Pet | null;
    apps: Appointment[];
    onNavigate: (route: Route) => void;
    setSelectedAppointment: (app: Appointment) => void;
}

export const PetDetailsView: React.FC<PetDetailsProps> = ({ selectedPet, apps, onNavigate, setSelectedAppointment }) => {
     if (!selectedPet) return null;
     const petHistory = apps.filter(a => a.pet_id === selectedPet.id);

     return (
        <div className="container page-enter" style={{ paddingTop: 20 }}>
           <div className="nav-header">
               <button className="btn-icon-sm" onClick={() => onNavigate('user-profile')}><ChevronLeft /></button>
               <h3>Detalhes do Pet</h3>
               <div style={{width: 44}}></div>
           </div>

           <div className="card reveal-on-scroll" style={{textAlign:'center', padding: '40px 20px'}}>
               <img src={getPetAvatarUrl(selectedPet.name)} alt={selectedPet.name} style={{width: 80, height: 80, margin: '0 auto 16px', display: 'block'}} className="pet-avatar-3d" />
               <h2>{selectedPet.name}</h2>
               <p>{selectedPet.breed || 'Sem raça definida'}</p>
               <div style={{display:'flex', justifyContent:'center', gap: 12, marginTop: 16}}>
                   {selectedPet.weight && <span className="status-badge tag-confirmed">{selectedPet.weight} kg</span>}
                   {selectedPet.notes && <span className="status-badge tag-in_progress">📝 Observações</span>}
               </div>
               {selectedPet.notes && (
                   <div style={{marginTop: 20, background: '#FFF9C4', padding: 12, borderRadius: 12, color: '#FBC02D', fontSize: '0.9rem', textAlign: 'left'}}>
                      <strong>Notas:</strong> {selectedPet.notes}
                   </div>
               )}
           </div>

           <h3 style={{margin: '24px 0 16px'}} className="reveal-on-scroll">Histórico de {selectedPet.name}</h3>
           <div className="card reveal-on-scroll" style={{padding: 0, overflow:'hidden'}}>
               {petHistory.length === 0 ? (
                   <div style={{padding:24, textAlign:'center', color:'#999'}}>Nenhum banho registrado ainda.</div>
               ) : (
                   petHistory.map(a => (
                     <div key={a.id} className="history-item clickable-card" onClick={() => { setSelectedAppointment(a); onNavigate('appointment-details'); }} style={{padding: '16px 20px'}}>
                        <div>
                            <strong>{a.services?.name}</strong>
                            <div className="history-meta">{formatDate(a.start_time)}</div>
                        </div>
                        <span className={`status-badge tag-${a.status}`}>{a.status}</span>
                     </div>
                   ))
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
               <h3 style={{marginBottom:20}}>Detalhes do Serviço</h3>
               
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
        </div>
      );
};
