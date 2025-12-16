
import React, { useMemo } from 'react';
import { ChevronLeft, Plus, LayoutDashboard, Clock, TrendingUp, Sparkles, Award, Crown, Calendar } from 'lucide-react';
import { Profile, Pet, Route, Subscription } from '../types';
import { useToast } from '../context/ToastContext';
import { getAvatarUrl, getPetAvatarUrl, formatCurrency } from '../utils/ui';

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
    
    // --- CÁLCULO DE ESTATÍSTICAS RICAS ---
    const stats = useMemo(() => {
        // Filtrar apenas agendamentos realizados (Concluídos)
        const completedApps = apps.filter(a => a.status === 'completed');
        
        // 1. Total Investido (Soma dos preços dos serviços concluídos)
        const totalInvested = completedApps.reduce((acc, curr) => acc + (curr.services?.price || 0), 0);
        
        // 2. Tempo de Mimo (Soma da duração em minutos -> Converter para horas)
        const totalMinutes = completedApps.reduce((acc, curr) => acc + (curr.services?.duration_minutes || 0), 0);
        const totalHours = Math.max(0, Math.round(totalMinutes / 60)); // Arredonda
        
        // 3. Serviço Favorito
        const serviceCounts: Record<string, number> = {};
        completedApps.forEach(a => {
            const name = a.services?.name || 'Outro';
            serviceCounts[name] = (serviceCounts[name] || 0) + 1;
        });
        
        let favoriteService = 'Nenhum ainda';
        let maxCount = 0;
        
        Object.entries(serviceCounts).forEach(([name, count]) => {
            if (count > maxCount) {
                maxCount = count;
                favoriteService = name;
            }
        });

        // 4. Nível de Fidelidade (Gamificação)
        const totalCount = completedApps.length;
        let loyaltyTier = 'Bronze';
        let nextTierCount = 5;
        
        if (totalCount >= 20) {
            loyaltyTier = 'Diamante';
            nextTierCount = 50;
        } else if (totalCount >= 10) {
            loyaltyTier = 'Ouro';
            nextTierCount = 20;
        } else if (totalCount >= 5) {
            loyaltyTier = 'Prata';
            nextTierCount = 10;
        }

        const progressPercent = Math.min(100, Math.round((totalCount / nextTierCount) * 100));

        return {
            totalInvested,
            totalHours,
            favoriteService,
            loyaltyTier,
            totalCount,
            nextTierCount,
            progressPercent
        };
    }, [apps]);

    return (
    <div className="container page-enter" style={{ paddingTop: 20 }}>
       <div className="nav-header">
           <button className="btn-icon-sm" onClick={() => onNavigate('dashboard')}><ChevronLeft /></button>
           <h3>Meu Perfil</h3>
           <div style={{width: 44}}></div>
       </div>

       <div className="profile-header reveal-on-scroll">
           <div className="profile-avatar">
              <img 
                src={getAvatarUrl(profile?.full_name || 'User')} 
                alt="Avatar" 
                style={{width:'100%', height:'100%', objectFit:'cover'}} 
              />
           </div>
           <div>
               <h2 style={{color:'white', marginBottom:4}}>{profile?.full_name}</h2>
               <p style={{color:'rgba(255,255,255,0.8)', margin:0}}>{session?.user.email}</p>
               <span className="status-badge" style={{background:'rgba(255,255,255,0.2)', color:'white', marginTop:8}}>
                  {profile?.role === 'admin' ? 'Administrador' : 'Cliente Vip'}
               </span>
           </div>
       </div>

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
                 gap: 16
             }}
           >
                <div style={{width: 40, height: 40, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <LayoutDashboard size={20} color="white" />
                </div>
                <div>
                    <h3 style={{color:'white', fontSize:'1rem', margin:0}}>Painel de Administrador</h3>
                    <p style={{color:'rgba(255,255,255,0.7)', margin:0, fontSize:'0.8rem'}}>Acessar Métricas e Kanban</p>
                </div>
           </div>
       )}

       {/* --- SECTION: STATS & GAMIFICATION --- */}
       <div className="reveal-on-scroll" style={{marginBottom: 32}}>
          <h3 style={{marginBottom:16}}>Minhas Conquistas</h3>
          
          <div className="stat-grid-rich">
              {/* Card Fidelidade - Full Width */}
              <div className="loyalty-card">
                  <div className="loyalty-header">
                      <div style={{display:'flex', alignItems:'center', gap:10}}>
                          <Award size={24} color="#FDCB6E" />
                          <div>
                              <strong style={{display:'block', lineHeight:1.2}}>Nível Fidelidade</strong>
                              <span style={{fontSize:'0.75rem', opacity:0.8}}>Continue agendando para subir!</span>
                          </div>
                      </div>
                      <div className="loyalty-badge">{stats.loyaltyTier}</div>
                  </div>
                  <div className="loyalty-progress-container">
                      <div className="loyalty-progress-labels">
                          <span>{stats.totalCount} Banhos</span>
                          <span>Próximo Nível: {stats.nextTierCount}</span>
                      </div>
                      <div className="loyalty-progress-track">
                          <div className="loyalty-progress-fill" style={{width: `${stats.progressPercent}%`}}></div>
                      </div>
                  </div>
              </div>

              {/* Stat 1: Tempo de Mimo */}
              <div className="stat-card-rich">
                  <div className="stat-card-rich-icon icon-bg-purple">
                      <Clock size={18} />
                  </div>
                  <span className="stat-rich-label">Tempo de Mimo</span>
                  <span className="stat-rich-value">{stats.totalHours} horas</span>
              </div>

              {/* Stat 2: Investimento */}
              <div className="stat-card-rich">
                  <div className="stat-card-rich-icon icon-bg-green">
                      <TrendingUp size={18} />
                  </div>
                  <span className="stat-rich-label">Investido em Cuidado</span>
                  <span className="stat-rich-value" style={{fontSize:'1rem'}}>{formatCurrency(stats.totalInvested)}</span>
              </div>

              {/* Stat 3: Serviço Favorito (Full Width na 2a linha se tiver pouco espaço, ou manter grid) */}
              <div className="stat-card-rich" style={{gridColumn: '1 / -1'}}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                      <div>
                          <span className="stat-rich-label" style={{display:'block', marginBottom:4}}>Serviço Favorito</span>
                          <span className="stat-rich-value">{stats.favoriteService}</span>
                      </div>
                      <div className="stat-card-rich-icon icon-bg-orange" style={{marginBottom:0}}>
                          <Sparkles size={18} />
                      </div>
                  </div>
              </div>
          </div>
       </div>

       {/* --- NEW SECTION: ACTIVE SUBSCRIPTIONS --- */}
       {subscriptions.length > 0 && (
           <div className="reveal-on-scroll" style={{marginBottom: 32}}>
               <h3 style={{marginBottom:16}}>Planos Ativos ({subscriptions.length})</h3>
               <div style={{display:'flex', flexDirection:'column', gap: 12}}>
                   {subscriptions.map(sub => {
                       const pet = pets.find(p => p.id === sub.pet_id);
                       const expireDate = new Date(sub.created_at);
                       expireDate.setDate(expireDate.getDate() + 30);
                       const daysLeft = Math.ceil((expireDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                       
                       return (
                           <div key={sub.id} className="card clickable-card" style={{margin:0, padding: 16, display:'flex', alignItems:'center', gap: 16}} onClick={() => { if(pet) { setSelectedPet(pet); onNavigate('pet-details'); } }}>
                               <div style={{width: 50, height: 50, background: 'linear-gradient(135deg, #00B894 0%, #00CEC9 100%)', borderRadius: 12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                                   <Crown size={24} color="white" fill="rgba(255,255,255,0.3)" />
                               </div>
                               <div style={{flex:1}}>
                                   <strong style={{display:'block', fontSize:'0.95rem'}}>{sub.packages?.title}</strong>
                                   <div style={{display:'flex', alignItems:'center', gap: 6, fontSize:'0.8rem', color:'var(--text-muted)'}}>
                                      <span>Pet: {pet?.name || 'Desconhecido'}</span>
                                      <span>•</span>
                                      <span style={{color: daysLeft < 5 ? 'var(--brand-yellow)' : 'inherit'}}>Expira em {daysLeft} dias</span>
                                   </div>
                               </div>
                           </div>
                       );
                   })}
               </div>
           </div>
       )}

       <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}} className="reveal-on-scroll">
            <h3>Meus Pets</h3>
            <button 
                className="btn-icon-sm" 
                style={{width:32, height:32}} 
                onClick={() => onAddPet ? onAddPet() : toast.info('Funcionalidade indisponível')}
            >
                <Plus size={16}/>
            </button>
       </div>
       
       {pets.length === 0 ? <p className="text-center text-gray-500 py-4">Nenhum pet cadastrado.</p> : (
         <div className="pet-grid">
           {pets.map(p => (
              <div key={p.id} className="card pet-card clickable-card reveal-on-scroll" onClick={() => { setSelectedPet(p); onNavigate('pet-details'); }}>
                 <img src={getPetAvatarUrl(p.name)} className="pet-avatar-3d" alt={p.name} />
                 <strong>{p.name}</strong>
                 <span className="pet-breed">{p.breed || 'SRD'}</span>
              </div>
           ))}
         </div>
       )}
    </div>
  );
};
