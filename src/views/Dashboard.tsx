
import React from 'react';
import { Appointment, Pet, Profile, Route } from '../types';
import { getAvatarUrl, getPetAvatarUrl } from '../utils/ui';
import { LayoutDashboard } from 'lucide-react';

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
    return (
      <div className="container dashboard-grid page-enter" style={{paddingTop: 24}}>
         {/* Left Column: User Context */}
         <div className="dash-col-left">
            
            {/* Admin Quick Access */}
            {profile?.role === 'admin' && (
                <div 
                    className="card clickable-card reveal-on-scroll" 
                    onClick={() => onNavigate('admin')}
                    style={{
                        marginBottom: 16, 
                        background: 'linear-gradient(135deg, #2d3436 0%, #000000 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <div style={{background:'rgba(255,255,255,0.15)', padding:8, borderRadius:8, display:'flex'}}>
                        <LayoutDashboard size={20} color="white" />
                    </div>
                    <div>
                        <strong style={{display:'block', fontSize:'0.95rem'}}>Painel Admin</strong>
                        <span style={{fontSize:'0.75rem', color:'rgba(255,255,255,0.7)'}}>Métricas & Kanban</span>
                    </div>
                </div>
            )}

            <div className="card dashboard-header-card clickable-card reveal-on-scroll" onClick={() => onNavigate('user-profile')}>
               <div className="dashboard-welcome"><h3>Olá, {profile?.full_name?.split(' ')[0]}!</h3><p>Ver meu perfil</p></div>
               <div className="dashboard-icon">
                  <img 
                    src={getAvatarUrl(profile?.full_name || 'User')} 
                    alt="Avatar" 
                    style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%'}} 
                  />
               </div>
            </div>
            
            <div className="card reveal-on-scroll" style={{marginTop: 16}}>
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
                   <h3 style={{margin:0}}>Meus Pets</h3>
                   <span style={{fontSize:'0.8rem', color:'var(--primary)'}} onClick={() => onNavigate('user-profile')}>Gerenciar</span>
               </div>
               {pets.length === 0 ? <button className="btn btn-secondary btn-sm full-width" onClick={() => onNavigate('user-profile')}>Cadastrar Pet</button> : (
                 <div className="pet-grid">
                   {pets.slice(0,4).map(p => (
                      <div key={p.id} className="card pet-card clickable-card" onClick={() => { setSelectedPet(p); onNavigate('pet-details'); }}>
                         <img src={getPetAvatarUrl(p.name)} className="pet-avatar-3d" alt={p.name} />
                         <strong style={{fontSize:'0.9rem'}}>{p.name}</strong>
                      </div>
                   ))}
                 </div>
               )}
            </div>
         </div>

         {/* Right Column: Actions & History */}
         <div className="dash-col-right">
            {/* Call to Action - Booking */}
            <div className="card cta-card-gradient reveal-on-scroll">
                <div>
                   <h3 style={{color:'white'}}>Hora do Banho?</h3>
                   <p style={{color:'rgba(255,255,255,0.9)'}}>Agende um horário para seu melhor amigo em poucos cliques.</p>
                </div>
                <button className="btn btn-white" onClick={onOpenBooking}>
                    Agendar Agora
                </button>
            </div>

            <div className="card reveal-on-scroll" style={{marginTop: 20}}>
               <h3>Últimos Agendamentos</h3>
               {apps.length === 0 ? <p style={{color:'#999', padding:'20px 0', textAlign:'center'}}>Nenhum histórico recente.</p> : apps.slice(0, 5).map(a => (
                 <div key={a.id} className="history-item clickable-card" onClick={() => { setSelectedAppointment(a); onNavigate('appointment-details'); }}>
                    <div><strong>{a.services?.name}</strong><br/><small>{new Date(a.start_time).toLocaleDateString()}</small></div>
                    <span className={`status-badge tag-${a.status}`}>{a.status}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>
    );
};
