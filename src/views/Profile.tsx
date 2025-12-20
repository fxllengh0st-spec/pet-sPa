
import React, { useMemo } from 'react';
import { ChevronLeft, Plus, LayoutDashboard, Clock, TrendingUp, Sparkles, Award, Crown, Calendar, LogOut, Settings, HelpCircle, User, History } from 'lucide-react';
import { Profile, Pet, Route, Subscription } from '../types';
import { useToast } from '../context/ToastContext';
import { getAvatarUrl, getPetAvatarUrl, formatCurrency } from '../utils/ui';
import { api } from '../services/api';

interface UserProfileProps {
    profile: Profile | null;
    session: any;
    pets: Pet[];
    apps: any[];
    subscriptions?: Subscription[];
    onNavigate: (route: Route) => void;
    setSelectedPet: (pet: Pet) => void;
    onAddPet?: () => void;
}

export const UserProfileView: React.FC<UserProfileProps> = ({ 
    profile, 
    session, 
    pets, 
    apps, 
    subscriptions = [],
    onNavigate, 
    setSelectedPet,
    onAddPet
}) => {
    const toast = useToast();

    const handleLogout = async () => {
        await api.auth.signOut();
        onNavigate('login');
    };
    
    // --- CÁLCULO DE ESTATÍSTICAS RICAS ---
    const stats = useMemo(() => {
        const completedApps = apps.filter(a => a.status === 'completed');
        const totalInvested = completedApps.reduce((acc, curr) => acc + (curr.services?.price || 0), 0);
        const totalMinutes = completedApps.reduce((acc, curr) => acc + (curr.services?.duration_minutes || 0), 0);
        const totalHours = Math.max(0, Math.round(totalMinutes / 60));
        
        const serviceCounts: Record<string, number> = {};
        completedApps.forEach(a => {
            const name = a.services?.name || 'Outro';
            serviceCounts[name] = (serviceCounts[name] || 0) + 1;
        });
        
        let favoriteService = '—';
        let maxCount = 0;
        
        Object.entries(serviceCounts).forEach(([name, count]) => {
            if (count > maxCount) {
                maxCount = count;
                favoriteService = name;
            }
        });

        const totalCount = completedApps.length;
        let loyaltyTier = 'Bronze';
        let nextTierCount = 5;
        let tierColor = '#CD7F32';
        
        if (totalCount >= 20) {
            loyaltyTier = 'Diamante';
            nextTierCount = 50;
            tierColor = '#b9f2ff';
        } else if (totalCount >= 10) {
            loyaltyTier = 'Ouro';
            nextTierCount = 20;
            tierColor = '#FFD700';
        } else if (totalCount >= 5) {
            loyaltyTier = 'Prata';
            nextTierCount = 10;
            tierColor = '#C0C0C0';
        }

        const progressPercent = Math.min(100, Math.round((totalCount / nextTierCount) * 100));

        return { totalInvested, totalHours, favoriteService, loyaltyTier, totalCount, nextTierCount, progressPercent, tierColor };
    }, [apps]);

    return (
    <div className="container page-enter" style={{ paddingTop: 20, paddingBottom: 100 }}>
       
       {/* HEADER TRANSPARENTE COM AÇÕES */}
       <div className="profile-header-modern reveal-on-scroll">
           <div style={{display:'flex', alignItems:'center', gap: 16}}>
               <div className="profile-avatar-lg">
                  <img 
                    src={getAvatarUrl(profile?.full_name || 'User')} 
                    alt="Avatar" 
                  />
               </div>
               <div>
                   <h2 style={{color:'var(--secondary)', marginBottom: 2, fontSize:'1.4rem'}}>{profile?.full_name?.split(' ')[0]}</h2>
                   <div style={{display:'flex', alignItems:'center', gap: 6}}>
                       <span className="tier-badge" style={{backgroundColor: stats.tierColor + '30', color: 'var(--secondary)', borderColor: stats.tierColor}}>
                           {stats.loyaltyTier}
                       </span>
                       {profile?.role === 'admin' && <span className="status-badge tag-confirmed">Admin</span>}
                   </div>
               </div>
           </div>
           <button className="btn-icon-sm" onClick={handleLogout} title="Sair">
               <LogOut size={18} color="#FF7675" />
           </button>
       </div>

       {/* ADMIN ACCESS CARD */}
       {profile?.role === 'admin' && (
           <div 
             className="card clickable-card reveal-on-scroll" 
             onClick={() => onNavigate('admin')}
             style={{
                 marginTop: 0, 
                 marginBottom: 24, 
                 background: 'var(--secondary)', 
                 color: 'white', 
                 display:'flex', 
                 alignItems:'center', 
                 gap: 16,
                 border: 'none',
                 position: 'relative',
                 overflow: 'hidden'
             }}
           >
                <div style={{width: 44, height: 44, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 2}}>
                    <LayoutDashboard size={22} color="white" />
                </div>
                <div style={{zIndex: 2}}>
                    <h3 style={{color:'white', fontSize:'1rem', margin:0}}>Painel de Controle</h3>
                    <p style={{color:'rgba(255,255,255,0.7)', margin:0, fontSize:'0.8rem'}}>Gestão de Loja & Agendamentos</p>
                </div>
                <LayoutDashboard size={100} color="white" style={{position:'absolute', right: -20, bottom: -30, opacity: 0.05}} />
           </div>
       )}

       {/* QUICK ACTIONS ROW */}
       <div className="quick-actions-grid reveal-on-scroll">
           <button className="quick-action-btn" onClick={() => onNavigate('dashboard')}>
               <div className="qa-icon" style={{background:'#E3F2FD', color:'#2196F3'}}><History size={20}/></div>
               <span>Histórico</span>
           </button>
           <button className="quick-action-btn">
               <div className="qa-icon" style={{background:'#F3E5F5', color:'#9C27B0'}}><User size={20}/></div>
               <span>Dados</span>
           </button>
           <button className="quick-action-btn">
               <div className="qa-icon" style={{background:'#E0F2F1', color:'#009688'}}><HelpCircle size={20}/></div>
               <span>Ajuda</span>
           </button>
           <button className="quick-action-btn" onClick={handleLogout}>
               <div className="qa-icon" style={{background:'#FFEBEE', color:'#F44336'}}><Settings size={20}/></div>
               <span>Config</span>
           </button>
       </div>

       {/* PETS SECTION (HORIZONTAL SCROLL / GRID) */}
       <div className="section-header-row reveal-on-scroll">
            <h3>Meus Pets</h3>
            <button className="btn-text-action" onClick={() => onAddPet ? onAddPet() : toast.info('Funcionalidade indisponível')}>
                <Plus size={16}/> Adicionar
            </button>
       </div>
       
       {pets.length === 0 ? (
           <div className="empty-state-card reveal-on-scroll" onClick={() => onAddPet && onAddPet()}>
               <div className="empty-icon-bg"><Plus size={32} color="var(--primary)"/></div>
               <p>Cadastre seu primeiro pet</p>
           </div>
       ) : (
         <div className="pets-grid-modern reveal-on-scroll">
           {pets.map(p => (
              <div key={p.id} className="pet-modern-card clickable-card" onClick={() => { setSelectedPet(p); onNavigate('pet-details'); }}>
                 <img src={getPetAvatarUrl(p.name)} className="pet-img-cover" alt={p.name} />
                 <div className="pet-card-info">
                     <strong>{p.name}</strong>
                     <span>{p.breed || 'Pet Amado'}</span>
                 </div>
              </div>
           ))}
         </div>
       )}

       {/* SUBSCRIPTIONS */}
       {subscriptions.length > 0 && (
           <div className="reveal-on-scroll mt-4">
               <h3 className="section-title-sm">Assinaturas Ativas</h3>
               <div style={{display:'flex', flexDirection:'column', gap: 12}}>
                   {subscriptions.map(sub => {
                       const pet = pets.find(p => p.id === sub.pet_id);
                       const expireDate = new Date(sub.created_at);
                       expireDate.setDate(expireDate.getDate() + 30);
                       const daysLeft = Math.ceil((expireDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                       
                       return (
                           <div key={sub.id} className="card sub-compact-card clickable-card" onClick={() => { if(pet) { setSelectedPet(pet); onNavigate('pet-details'); } }}>
                               <div className="sub-icon-box">
                                   <Crown size={20} color="white" />
                               </div>
                               <div style={{flex:1}}>
                                   <strong style={{display:'block', fontSize:'0.9rem', color:'var(--secondary)'}}>{sub.packages?.title}</strong>
                                   <div style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>Pet: {pet?.name}</div>
                               </div>
                               <div className="sub-status-tag" style={{color: daysLeft < 5 ? '#e17055' : '#00b894', background: daysLeft < 5 ? '#fab1a030' : '#55efc420'}}>
                                   {daysLeft} dias
                               </div>
                           </div>
                       );
                   })}
               </div>
           </div>
       )}

       {/* FIDELITY CARD */}
       <div className="reveal-on-scroll mt-4">
          <h3 className="section-title-sm">Clube de Fidelidade</h3>
          <div className="loyalty-card-modern">
              <div className="loyalty-bg-pattern"></div>
              <div className="loyalty-content">
                  <div className="loyalty-top">
                      <div className="loyalty-brand">
                          <Award size={20} color={stats.tierColor} />
                          <span>PetSpa Rewards</span>
                      </div>
                      <span className="loyalty-tier-text" style={{color: stats.tierColor}}>{stats.loyaltyTier}</span>
                  </div>
                  
                  <div className="loyalty-middle">
                      <div className="big-stat">
                          <span className="label">Banhos Realizados</span>
                          <span className="value">{stats.totalCount}</span>
                      </div>
                      <div className="big-stat right">
                          <span className="label">Próximo Nível</span>
                          <span className="value">{stats.nextTierCount}</span>
                      </div>
                  </div>

                  <div className="loyalty-bar-container">
                      <div className="loyalty-bar-fill" style={{width: `${stats.progressPercent}%`, background: stats.tierColor}}></div>
                  </div>
                  <div className="loyalty-footer">
                      <span>Faltam {Math.max(0, stats.nextTierCount - stats.totalCount)} visitas para subir de nível</span>
                  </div>
              </div>
          </div>
       </div>

       {/* FUN STATS */}
       <div className="stats-row-mini reveal-on-scroll">
           <div className="mini-stat">
               <Clock size={16} className="text-purple-500 mb-1"/>
               <strong>{stats.totalHours}h</strong>
               <span>de Mimo</span>
           </div>
           <div className="mini-stat">
               <TrendingUp size={16} className="text-green-500 mb-1"/>
               <strong>{formatCurrency(stats.totalInvested)}</strong>
               <span>Investidos</span>
           </div>
           <div className="mini-stat">
               <Sparkles size={16} className="text-orange-500 mb-1"/>
               <strong>{stats.favoriteService}</strong>
               <span>Favorito</span>
           </div>
       </div>

    </div>
  );
};
