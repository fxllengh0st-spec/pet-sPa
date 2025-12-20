
import React, { useMemo } from 'react';
import { ChevronLeft, Plus, LayoutDashboard, Clock, TrendingUp, Sparkles, Award, Crown, Calendar, LogOut, Settings, HelpCircle, User, History, ShieldCheck } from 'lucide-react';
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
    
    // --- CÁLCULO DE ESTATÍSTICAS ---
    const stats = useMemo(() => {
        const completedApps = apps.filter(a => a.status === 'completed');
        const totalInvested = completedApps.reduce((acc, curr) => acc + (curr.services?.price || 0), 0);
        const totalCount = completedApps.length;
        
        let loyaltyTier = 'Bronze';
        let nextTierCount = 5;
        let tierColor = '#CD7F32';
        let tierGradient = 'linear-gradient(135deg, #a87932 0%, #CD7F32 100%)';
        
        if (totalCount >= 20) {
            loyaltyTier = 'Diamante';
            nextTierCount = 50;
            tierColor = '#00CEC9';
            tierGradient = 'linear-gradient(135deg, #00CEC9 0%, #0984E3 100%)';
        } else if (totalCount >= 10) {
            loyaltyTier = 'Ouro';
            nextTierCount = 20;
            tierColor = '#F1C40F';
            tierGradient = 'linear-gradient(135deg, #F1C40F 0%, #D4AC0D 100%)';
        } else if (totalCount >= 5) {
            loyaltyTier = 'Prata';
            nextTierCount = 10;
            tierColor = '#95A5A6';
            tierGradient = 'linear-gradient(135deg, #BDC3C7 0%, #95A5A6 100%)';
        }

        const progressPercent = Math.min(100, Math.round((totalCount / nextTierCount) * 100));

        return { totalInvested, loyaltyTier, totalCount, nextTierCount, progressPercent, tierColor, tierGradient };
    }, [apps]);

    return (
    <div className="container profile-page-modern page-enter" style={{ paddingTop: 20, paddingBottom: 100 }}>
       
       <div className="nav-header" style={{marginBottom: 10}}>
           <button className="btn-icon-sm" onClick={() => onNavigate('dashboard')}><ChevronLeft /></button>
           <h3>Meu Perfil</h3>
           <div style={{width: 44}}></div>
       </div>

       {/* VIP MEMBER CARD */}
       <div className="vip-member-card reveal-on-scroll" style={{ background: stats.tierGradient }}>
           <div className="card-glass-effect"></div>
           <div className="card-top">
               <div className="user-info-box">
                   <div className="avatar-wrapper">
                       <img src={getAvatarUrl(profile?.full_name || 'User')} alt="Avatar" />
                       <div className="verified-badge"><ShieldCheck size={12} fill="white" /></div>
                   </div>
                   <div>
                       <h2 className="user-name">{profile?.full_name}</h2>
                       <span className="member-since">Membro desde {new Date(profile?.id ? 2024 : 2024).getFullYear()}</span>
                   </div>
               </div>
               <div className="tier-icon">
                   <Crown size={32} fill="rgba(255,255,255,0.4)" color="rgba(255,255,255,0.8)" />
               </div>
           </div>

           <div className="card-stats-row">
               <div className="stat-box">
                   <span className="stat-val">{stats.totalCount}</span>
                   <span className="stat-lbl">Visitas</span>
               </div>
               <div className="stat-divider"></div>
               <div className="stat-box">
                   <span className="stat-val">{pets.length}</span>
                   <span className="stat-lbl">Pets</span>
               </div>
               <div className="stat-divider"></div>
               <div className="stat-box">
                   <span className="stat-val">{stats.loyaltyTier}</span>
                   <span className="stat-lbl">Nível</span>
               </div>
           </div>

           <div className="loyalty-progress-area">
               <div className="progress-labels">
                   <span>Progresso para {stats.loyaltyTier === 'Diamante' ? 'Elite' : 'Próximo Nível'}</span>
                   <span>{stats.progressPercent}%</span>
               </div>
               <div className="progress-bar-bg">
                   <div className="progress-bar-fill" style={{ width: `${stats.progressPercent}%` }}></div>
               </div>
           </div>
       </div>

       {/* QUICK ACTIONS */}
       <div className="profile-actions-grid reveal-on-scroll">
           <div className="action-card" onClick={() => onNavigate('dashboard')}>
               <div className="action-icon bg-blue-soft"><History size={20}/></div>
               <span>Histórico</span>
           </div>
           <div className="action-card" onClick={() => onAddPet?.()}>
               <div className="action-icon bg-purple-soft"><Plus size={20}/></div>
               <span>Novo Pet</span>
           </div>
           <div className="action-card" onClick={() => onNavigate('packages')}>
               <div className="action-icon bg-green-soft"><Crown size={20}/></div>
               <span>VIP Club</span>
           </div>
           <div className="action-card" onClick={() => toast.info('Configurações em breve')}>
               <div className="action-icon bg-gray-soft"><Settings size={20}/></div>
               <span>Ajustes</span>
           </div>
       </div>

       {/* MEUS PETS SECTION */}
       <div className="section-header-row reveal-on-scroll" style={{marginTop: 32}}>
            <h3>Meus Filhotes</h3>
            <button className="btn-text-action" onClick={onAddPet}><Plus size={16}/> Adicionar</button>
       </div>
       
       <div className="pets-vertical-list reveal-on-scroll">
           {pets.length === 0 ? (
               <div className="card empty-state-simple" onClick={onAddPet}>
                   <Plus size={24} color="var(--primary)" />
                   <span>Cadastrar meu primeiro pet</span>
               </div>
           ) : (
               pets.map(p => (
                   <div key={p.id} className="card pet-item-card clickable-card" onClick={() => { setSelectedPet(p); onNavigate('pet-details'); }}>
                       <img src={getPetAvatarUrl(p.name)} alt={p.name} />
                       <div className="pet-info">
                           <strong>{p.name}</strong>
                           <span>{p.breed || 'Pet Amado'}</span>
                       </div>
                       <ChevronRight size={18} color="#CCC" />
                   </div>
               ))
           )}
       </div>

       {/* ACCOUNT SETTINGS */}
       <div className="section-header-row reveal-on-scroll" style={{marginTop: 32}}>
            <h3>Conta</h3>
       </div>
       <div className="card reveal-on-scroll" style={{padding: 0, overflow:'hidden'}}>
           <div className="menu-item-row" onClick={() => toast.info('Recurso em desenvolvimento')}>
               <User size={18} />
               <span>Editar Informações Pessoais</span>
               <ChevronRight size={16} />
           </div>
           <div className="menu-item-row" onClick={() => onNavigate('about')}>
               <HelpCircle size={18} />
               <span>Sobre a PetSpa</span>
               <ChevronRight size={16} />
           </div>
           <div className="menu-item-row logout-row" onClick={handleLogout}>
               <LogOut size={18} />
               <span>Sair da Conta</span>
           </div>
       </div>

       <p className="text-center text-muted" style={{marginTop: 32, fontSize: '0.75rem'}}>
           Versão 2.4.0 • Pet-S-PA Oficial
       </p>
    </div>
  );
};

const ChevronRight = ({ size, color }: { size: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);
