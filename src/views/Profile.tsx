
import React, { useMemo } from 'react';
import { 
  ChevronRight, Plus, LayoutDashboard, Clock, 
  TrendingUp, Sparkles, Award, Crown, 
  LogOut, Settings, HelpCircle, User, 
  ShieldCheck, Wallet, ChevronLeft
} from 'lucide-react';
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
    
    const stats = useMemo(() => {
        const completedApps = apps.filter(a => a.status === 'completed');
        const totalInvested = completedApps.reduce((acc, curr) => acc + (curr.services?.price || 0), 0);
        const totalCount = completedApps.length;
        
        let loyaltyTier = 'Bronze';
        let tierColor = '#CD7F32';
        let nextTierCount = 5;

        if (totalCount >= 20) {
            loyaltyTier = 'Diamante';
            tierColor = '#74B9FF';
            nextTierCount = 50;
        } else if (totalCount >= 10) {
            loyaltyTier = 'Ouro';
            tierColor = '#F1C40F';
            nextTierCount = 20;
        } else if (totalCount >= 5) {
            loyaltyTier = 'Prata';
            tierColor = '#95A5A6';
            nextTierCount = 10;
        }

        const progressPercent = Math.min(100, Math.round((totalCount / nextTierCount) * 100));

        return { totalInvested, loyaltyTier, totalCount, nextTierCount, progressPercent, tierColor };
    }, [apps]);

    return (
    <div className="container page-enter profile-view-container">
       
       {/* HEADER: Identidade e Logout */}
       <div className="profile-hero-section reveal-on-scroll">
           <div className="profile-main-info">
               <div className="profile-avatar-wrapper">
                  <img src={getAvatarUrl(profile?.full_name || 'User')} alt="Avatar" className="profile-img" />
                  <div className="status-dot-online"></div>
               </div>
               <div className="profile-text-content">
                   <h2 className="user-name">{profile?.full_name?.split(' ')[0]}</h2>
                   <p className="user-email">{profile?.email}</p>
               </div>
           </div>
           <button className="logout-circle-btn" onClick={handleLogout} title="Sair">
               <LogOut size={20} />
           </button>
       </div>

       {/* ADMIN ACCESS (Contextual) */}
       {profile?.role === 'admin' && (
           <div className="card admin-quick-access reveal-on-scroll" onClick={() => onNavigate('admin')}>
                <div className="admin-icon-box"><ShieldCheck size={24} /></div>
                <div className="admin-text">
                    <strong>Modo Administrativo</strong>
                    <span>Gerenciar loja e agendamentos</span>
                </div>
                <ChevronRight size={20} className="ml-auto opacity-50" />
           </div>
       )}

       {/* CARD FIDELIDADE: Estilo Wallet/Cartão de Crédito Premium */}
       <div className="loyalty-wallet-card reveal-on-scroll" style={{ '--tier-color': stats.tierColor } as any}>
            <div className="wallet-content">
                <div className="wallet-header">
                    <div className="brand-logo-mini"><Award size={18} /> PetSpa Rewards</div>
                    <div className="tier-tag">{stats.loyaltyTier}</div>
                </div>
                <div className="wallet-balance">
                    <span className="balance-label">Visitas Acumuladas</span>
                    <h4 className="balance-value">{stats.totalCount}</h4>
                </div>
                <div className="wallet-progress-container">
                    <div className="progress-label-row">
                        <span>Progresso para o próximo nível</span>
                        <span>{stats.progressPercent}%</span>
                    </div>
                    <div className="wallet-progress-bar">
                        <div className="progress-fill" style={{ width: `${stats.progressPercent}%` }}></div>
                    </div>
                </div>
            </div>
            <div className="wallet-bg-decoration">
                <Award size={140} className="deco-icon" />
            </div>
       </div>

       {/* ACTIONS GRID: Grid 2x2 de ações frequentes */}
       <div className="actions-grid-modern reveal-on-scroll">
            <div className="action-card-item" onClick={() => onNavigate('dashboard')}>
                <div className="action-icon purple"><Clock size={22} /></div>
                <span>Histórico</span>
            </div>
            <div className="action-card-item" onClick={() => onNavigate('packages')}>
                <div className="action-icon gold"><Crown size={22} /></div>
                <span>Clube VIP</span>
            </div>
            <div className="action-card-item">
                <div className="action-icon blue"><User size={22} /></div>
                <span>Meus Dados</span>
            </div>
            <div className="action-card-item">
                <div className="action-icon gray"><Settings size={22} /></div>
                <span>Ajustes</span>
            </div>
       </div>

       {/* SEÇÃO PETS: Horizontal com visual de "Stories" ou cards limpos */}
       <div className="section-header-modern reveal-on-scroll">
            <h3>Meus Pets</h3>
            <button className="add-pet-inline-btn" onClick={() => onAddPet?.()}>
                <Plus size={16} /> Novo Pet
            </button>
       </div>

       <div className="pets-scroll-container reveal-on-scroll">
           {pets.length === 0 ? (
               <div className="pet-empty-state" onClick={() => onAddPet?.()}>
                   <div className="plus-icon-circle"><Plus size={24} /></div>
                   <span>Adicionar primeiro pet</span>
               </div>
           ) : (
               <div className="pets-flex-row">
                    {pets.map(p => (
                        <div key={p.id} className="pet-mini-card" onClick={() => { setSelectedPet(p); onNavigate('pet-details'); }}>
                            <div className="pet-img-ring">
                                <img src={getPetAvatarUrl(p.name)} alt={p.name} />
                            </div>
                            <strong>{p.name}</strong>
                        </div>
                    ))}
               </div>
           )}
       </div>

       {/* TOTAL INVESTED MINI BANNER */}
       <div className="invested-mini-card reveal-on-scroll">
           <div className="invested-icon"><Wallet size={20} /></div>
           <div className="invested-info">
               <span>Total investido em bem-estar</span>
               <strong>{formatCurrency(stats.totalInvested)}</strong>
           </div>
       </div>

    </div>
  );
};
