
import React, { useMemo } from 'react';
import { Appointment, Pet, Profile, Route } from '../types';
import { getAvatarUrl, getPetAvatarUrl } from '../utils/ui';
import { LayoutDashboard, Calendar, Plus, ChevronRight, Sparkles } from 'lucide-react';
import { ActiveTrackingCard } from '../components/ActiveTrackingCard';

interface DashboardProps {
    profile: Profile | null;
    pets: Pet[];
    apps: Appointment[];
    onNavigate: (route: Route) => void;
    setSelectedPet: (pet: Pet) => void;
    setSelectedAppointment: (app: Appointment) => void;
    onOpenBooking: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    profile, 
    pets, 
    apps, 
    onNavigate, 
    setSelectedPet, 
    setSelectedAppointment, 
    onOpenBooking 
}) => {
    // Encontrar o agendamento mais próximo que não seja passado
    const nextApp = useMemo(() => {
        const now = new Date();
        return apps
            .filter(a => a.status !== 'cancelled' && a.status !== 'completed' && new Date(a.start_time) > now)
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];
    }, [apps]);

    return (
      <div className="container dashboard-modern page-enter" style={{paddingTop: 24, paddingBottom: 100}}>
         
         {/* Welcome Header */}
         <div className="dash-welcome-header reveal-on-scroll">
            <div className="welcome-text">
                <h1>Olá, {profile?.full_name?.split(' ')[0]}! ✨</h1>
                <p>Como estão os pequenos hoje?</p>
            </div>
            <div className="profile-trigger" onClick={() => onNavigate('user-profile')}>
                <img src={getAvatarUrl(profile?.full_name || 'User')} alt="Profile" />
            </div>
         </div>

         {/* Próximo Agendamento - Card de Destaque */}
         {nextApp ? (
             <div className="next-event-card reveal-on-scroll" onClick={() => { setSelectedAppointment(nextApp); onNavigate('appointment-details'); }}>
                 <div className="event-info">
                    <span className="event-tag">Próximo Agendamento</span>
                    <h3>{nextApp.services?.name}</h3>
                    <div className="event-time">
                        <Calendar size={14} />
                        <span>{new Date(nextApp.start_time).toLocaleDateString('pt-BR', { day:'numeric', month:'short' })} às {new Date(nextApp.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                 </div>
                 <div className="event-pet">
                    <img src={getPetAvatarUrl(nextApp.pets?.name || '')} alt="Pet" />
                    <span>{nextApp.pets?.name}</span>
                 </div>
                 <ChevronRight className="arrow-icon" />
             </div>
         ) : (
             <div className="card empty-next-event reveal-on-scroll" onClick={onOpenBooking}>
                 <div className="empty-icon-circle">
                    <Calendar size={24} color="var(--primary)" />
                 </div>
                 <div>
                    <strong>Nenhum banho marcado</strong>
                    <p>Que tal agendar um horário?</p>
                 </div>
                 <button className="btn btn-primary btn-sm">Agendar</button>
             </div>
         )}

         {/* Active Tracking Section */}
         <ActiveTrackingCard 
            appointments={apps} 
            onNavigate={onNavigate} 
            setSelectedAppointment={setSelectedAppointment}
         />

         {/* Meus Pets - Carrossel Horizontal */}
         <div className="section-header-row reveal-on-scroll">
            <h3>Meus Pets</h3>
            <button className="btn-text-action" onClick={() => onNavigate('user-profile')}>Ver Todos</button>
         </div>
         <div className="pets-horizontal-scroll no-scrollbar reveal-on-scroll">
            {pets.length === 0 ? (
                <div className="add-pet-card-dash" onClick={() => onNavigate('user-profile')}>
                    <Plus size={24} />
                    <span>Novo Pet</span>
                </div>
            ) : (
                <>
                    {pets.map(p => (
                        <div key={p.id} className="pet-dash-card" onClick={() => { setSelectedPet(p); onNavigate('pet-details'); }}>
                            <img src={getPetAvatarUrl(p.name)} alt={p.name} />
                            <strong>{p.name}</strong>
                        </div>
                    ))}
                    <div className="add-pet-card-dash mini" onClick={() => onNavigate('user-profile')}>
                        <Plus size={20} />
                    </div>
                </>
            )}
         </div>

         {/* Promo / Credits Section */}
         <div className="card promo-card-dash reveal-on-scroll">
            <div className="promo-content">
                <div className="promo-badge"><Sparkles size={14} /> CLUBE VIP</div>
                <h3>Economize em pacotes</h3>
                <p>Assine e ganhe banhos grátis todo mês.</p>
                <button className="btn btn-white btn-sm" onClick={() => onNavigate('packages')}>Ver Planos</button>
            </div>
            <img src="https://vfryefavzurwoiuznkwv.supabase.co/storage/v1/object/public/site-assets/random.png" alt="Promo" className="promo-img" />
         </div>

         {/* History Quick Access */}
         <div className="section-header-row reveal-on-scroll" style={{marginTop: 32}}>
            <h3>Histórico Recente</h3>
            <button className="btn-text-action" onClick={() => onNavigate('user-profile')}>Ver Tudo</button>
         </div>
         <div className="card reveal-on-scroll" style={{padding: 0, overflow:'hidden'}}>
            {apps.length === 0 ? (
                <div style={{padding:24, textAlign:'center', color:'#999'}}>Nenhum serviço anterior.</div>
            ) : (
                apps.slice(0, 3).map(a => (
                    <div key={a.id} className="history-list-item" onClick={() => { setSelectedAppointment(a); onNavigate('appointment-details'); }}>
                        <div style={{display:'flex', gap: 12, alignItems:'center'}}>
                            <div className="history-icon-box" style={{width: 40, height: 40, marginRight: 0}}>
                                <Calendar size={18} />
                            </div>
                            <div>
                                <strong style={{fontSize:'0.9rem'}}>{a.services?.name}</strong>
                                <span style={{display:'block', fontSize:'0.75rem', color:'#666'}}>{new Date(a.start_time).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <span className={`status-pill pill-${a.status}`}>{a.status === 'completed' ? 'Concluído' : a.status}</span>
                    </div>
                ))
            )}
         </div>
      </div>
    );
};
