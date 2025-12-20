
import React, { useMemo } from 'react';
import { 
  ChevronLeft, Clock, CheckCircle, Droplet, Sparkles, X, 
  Calendar, DollarSign, Scissors, CalendarClock, AlertCircle, 
  ChevronRight, Activity, CalendarCheck, Crown, Hourglass,
  FileText, Heart, Shield, Share2, Settings, Weight
} from 'lucide-react';
import { Appointment, Pet, Route, Subscription } from '../types';
import { formatCurrency, formatDate, getPetAvatarUrl } from '../utils/ui';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ActiveTrackingCard } from '../components/ActiveTrackingCard';

interface PetDetailsProps {
    selectedPet: Pet | null;
    apps: Appointment[];
    subscriptions?: Subscription[];
    onNavigate: (route: Route) => void;
    setSelectedAppointment: (app: Appointment) => void;
}

export const PetDetailsView: React.FC<PetDetailsProps> = ({ selectedPet, apps, subscriptions = [], onNavigate, setSelectedAppointment }) => {
     if (!selectedPet) return null;
     
     const petHistory = apps.filter(a => a.pet_id === selectedPet.id);
     const activeSub = subscriptions.find(s => s.pet_id === selectedPet.id && s.status === 'active');

     const renderServiceIcon = (name: string) => {
        const n = (name || '').toLowerCase();
        if (n.includes('tosa')) return <Scissors size={18} />;
        if (n.includes('banho')) return <Droplet size={18} />;
        return <Sparkles size={18} />;
     };

     const subMetrics = useMemo(() => {
         if (!activeSub || !activeSub.packages) return null;
         const createdAt = new Date(activeSub.created_at);
         const expiresAt = new Date(createdAt);
         expiresAt.setDate(expiresAt.getDate() + 30);
         const now = new Date();
         const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 3600 * 24)));
         const totalBaths = activeSub.packages.bath_count;
         const subAppointments = apps.filter(a => a.pet_id === selectedPet.id && a.status !== 'cancelled' && new Date(a.created_at) >= createdAt);
         const usedCount = subAppointments.filter(a => a.status === 'completed' || a.status === 'in_progress').length;
         const scheduledCount = subAppointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length;
         const totalUsedOrScheduled = usedCount + scheduledCount;
         const remaining = Math.max(0, totalBaths - totalUsedOrScheduled);
         const progressPct = Math.min(100, (totalUsedOrScheduled / totalBaths) * 100);
         // Adicionando totalUsedOrScheduled ao retorno para que possa ser lido no JSX (Fix line 116 error)
         return { daysLeft, totalBaths, usedCount, scheduledCount, remaining, progressPct, expiresAt, totalUsedOrScheduled };
     }, [activeSub, apps, selectedPet]);

     return (
        <div className="container page-enter pet-profile-container">
           <div className="nav-header-modern">
               <button className="btn-icon-back" onClick={() => onNavigate('dashboard')}>
                  <ChevronLeft size={24} />
               </button>
               <div className="header-actions">
                  <button className="btn-icon-ghost"><Share2 size={20} /></button>
                  <button className="btn-icon-ghost" onClick={() => onNavigate('user-profile')}><Settings size={20} /></button>
               </div>
           </div>

           {/* PET PASSPORT CARD */}
           <div className="pet-passport-card reveal-on-scroll">
               <div className="passport-pattern"></div>
               <div className="passport-content">
                    <div className="pet-photo-section">
                        <div className="photo-ring">
                            <img src={getPetAvatarUrl(selectedPet.name)} alt={selectedPet.name} />
                        </div>
                        <div className="pet-species-icon">
                            {selectedPet.breed?.toLowerCase().includes('gato') ? '🐱' : '🐶'}
                        </div>
                    </div>
                    
                    <div className="pet-info-section">
                        <h2 className="pet-identity-name">{selectedPet.name}</h2>
                        <p className="pet-identity-breed">{selectedPet.breed || 'Raça não definida'}</p>
                        
                        <div className="pet-vital-stats-row">
                            <div className="vital-stat">
                                <Weight size={14} className="vital-icon" />
                                <span>{selectedPet.weight ? `${selectedPet.weight}kg` : '--'}</span>
                            </div>
                            <div className="vital-stat">
                                <Calendar size={14} className="vital-icon" />
                                <span>{selectedPet.birth_date ? new Date(selectedPet.birth_date).getFullYear() : '--'}</span>
                            </div>
                            <div className="vital-stat status-active">
                                <Activity size={14} className="vital-icon" />
                                <span>Ativo</span>
                            </div>
                        </div>
                    </div>
               </div>
           </div>

           {/* WELLNESS / SUBSCRIPTION TRACKER */}
           {activeSub && subMetrics ? (
               <div className="wellness-dashboard-card reveal-on-scroll">
                   <div className="wellness-header">
                       <div className="wellness-tag">
                           <Shield size={16} /> CLUBE VIP
                       </div>
                       <div className="wellness-title">{activeSub.packages?.title}</div>
                   </div>
                   
                   <div className="wellness-progress-area">
                        <div className="progress-ring-container">
                             <div className="progress-bar-bg">
                                 <div className="progress-bar-fill" style={{ width: `${subMetrics.progressPct}%` }}></div>
                             </div>
                             <div className="progress-info-row">
                                 <span>{subMetrics.totalUsedOrScheduled} de {subMetrics.totalBaths} banhos</span>
                                 <span>{subMetrics.daysLeft} dias restantes</span>
                             </div>
                        </div>
                   </div>
               </div>
           ) : (
                <div className="upsell-mini-banner reveal-on-scroll" onClick={() => onNavigate('packages')}>
                    <div className="upsell-icon"><Crown size={20} /></div>
                    <div className="upsell-text">
                        <strong>Faça parte do Clube VIP</strong>
                        <span>O {selectedPet.name} merece mimos exclusivos</span>
                    </div>
                    <ChevronRight size={20} className="opacity-50" />
                </div>
           )}

           {/* TRACKING ATIVO (INTEGRADO) */}
           <ActiveTrackingCard 
                appointments={apps} 
                filterPetId={selectedPet.id}
                onNavigate={onNavigate}
                setSelectedAppointment={setSelectedAppointment}
           />

           {/* TIMELINE DE SERVIÇOS */}
           <div className="timeline-section reveal-on-scroll">
               <div className="section-header-modern">
                   <h3>Linha do Tempo</h3>
                   <span className="count-badge">{petHistory.length}</span>
               </div>

               {petHistory.length === 0 ? (
                   <div className="empty-timeline-state">
                       <div className="empty-circle"><CalendarClock size={32} /></div>
                       <p>Ainda não há registros de cuidados.</p>
                       <button className="btn btn-primary btn-sm" onClick={() => onNavigate('home')}>Agendar Agora</button>
                   </div>
               ) : (
                   <div className="modern-timeline">
                       {petHistory.map((app, idx) => (
                           <div key={app.id} className="timeline-node" onClick={() => { setSelectedAppointment(app); onNavigate('appointment-details'); }}>
                               <div className="node-sidebar">
                                   <div className={`node-dot dot-${app.status}`}>
                                       {app.status === 'completed' && <CheckCircle size={12} />}
                                   </div>
                                   {idx !== petHistory.length - 1 && <div className="node-line"></div>}
                               </div>
                               <div className="node-card card">
                                   <div className="node-service-icon">
                                       {renderServiceIcon(app.services?.name || '')}
                                   </div>
                                   <div className="node-content">
                                       <div className="node-top">
                                           <strong>{app.services?.name}</strong>
                                           <span className="node-price">{formatCurrency(app.services?.price || 0)}</span>
                                       </div>
                                       <div className="node-bottom">
                                           <span>{formatDate(app.start_time)}</span>
                                           <span className={`status-pill pill-${app.status}`}>{app.status}</span>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
               )}
           </div>

           {/* TUTOR NOTES */}
           {selectedPet.notes && (
               <div className="notes-display-card reveal-on-scroll">
                   <div className="notes-title">
                       <FileText size={18} /> Observações Importantes
                   </div>
                   <p>{selectedPet.notes}</p>
               </div>
           )}
        </div>
     );
};

export const AppointmentDetailsView = ({ selectedAppointment, onNavigate }: any) => {
    const toast = useToast();
    if (!selectedAppointment) return null;

    const handleBack = () => onNavigate('pet-details');

    return (
        <div className="container page-enter appointment-details-view">
            <div className="nav-header-modern">
                <button className="btn-icon-back" onClick={handleBack}><ChevronLeft size={24} /></button>
                <h3>Detalhes do Serviço</h3>
                <div style={{width: 44}}></div>
            </div>

            <div className="card detailed-app-card">
                 <div className={`status-banner banner-${selectedAppointment.status}`}>
                     {selectedAppointment.status === 'completed' ? <CheckCircle size={20} /> : <Clock size={20} />}
                     <span>Este agendamento está {selectedAppointment.status}</span>
                 </div>

                 <div className="app-main-info">
                     <div className="app-pet-snapshot">
                         <img src={getPetAvatarUrl(selectedAppointment.pets?.name || '')} alt="Pet" />
                         <h4>{selectedAppointment.pets?.name}</h4>
                     </div>
                     <div className="app-service-snapshot">
                         <strong>{selectedAppointment.services?.name}</strong>
                         <p>{formatCurrency(selectedAppointment.services?.price || 0)}</p>
                     </div>
                 </div>

                 <div className="app-time-location">
                     <div className="info-row">
                         <Calendar size={18} />
                         <div>
                             <span>Data</span>
                             <strong>{new Date(selectedAppointment.start_time).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
                         </div>
                     </div>
                     <div className="info-row">
                         <Clock size={18} />
                         <div>
                             <span>Horário</span>
                             <strong>{new Date(selectedAppointment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                         </div>
                     </div>
                 </div>
            </div>

            {selectedAppointment.status === 'pending' || selectedAppointment.status === 'confirmed' ? (
                <div className="details-actions">
                    <button className="btn btn-ghost full-width" onClick={() => toast.info("Funcionalidade de reagendamento em breve!")}>Reagendar</button>
                    <button className="btn btn-outline-danger full-width mt-2">Cancelar Agendamento</button>
                </div>
            ) : (
                <button className="btn btn-primary full-width" onClick={() => onNavigate('home')}>Agendar Novo Serviço</button>
            )}
        </div>
    );
};
