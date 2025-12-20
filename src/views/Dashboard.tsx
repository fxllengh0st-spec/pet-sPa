
import React, { useMemo } from 'react';
import { Appointment, Pet, Profile, Route, Subscription } from '../types';
import { getAvatarUrl, getPetAvatarUrl, formatCurrency } from '../utils/ui';
import { 
  LayoutDashboard, LogOut, Plus, Award, History, 
  Settings, HelpCircle, User as UserIcon, Clock, 
  TrendingUp, Sparkles, Crown, ChevronRight, ShieldCheck, CreditCard
} from 'lucide-react';
import { ActiveTrackingCard } from '../components/ActiveTrackingCard';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

interface DashboardProps {
    profile: Profile | null;
    pets: Pet[];
    apps: Appointment[];
    subscriptions?: Subscription[];
    onNavigate: (route: Route) => void;
    setSelectedPet: (pet: Pet) => void;
    setSelectedAppointment: (app: Appointment) => void;
    onOpenBooking: () => void;
    onAddPet: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    profile, 
    pets, 
    apps, 
    subscriptions = [],
    onNavigate, 
    setSelectedPet, 
    setSelectedAppointment, 
    onOpenBooking,
    onAddPet
}) => {
    const toast = useToast();

    const handleLogout = async () => {
        await api.auth.signOut();
        onNavigate('home');
        toast.info('Até logo! 👋');
    };

    // --- CÁLCULO DE ESTATÍSTICAS (Lógica unificada do Perfil + Dash) ---
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

    // Caso o perfil ainda não tenha carregado (Race condition safety)
    if (!profile) {
        return (
            <div className="container spinner-center" style={{paddingTop: 100}}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
      <div className="container unified-dashboard page-enter">
         
         {/* SEÇÃO 1: HEADER DE PERFIL (Estilo Profile.tsx) */}
         <div className="profile-header-modern reveal-on-scroll">
            <div className="profile-info-group">
                <div className="profile-avatar-lg">
                    <img src={getAvatarUrl(profile?.full_name || 'User')} alt="Avatar" />
                </div>
                <div className="profile-text-group">
                    <h2>Olá, {profile?.full_name?.split(' ')[0]}!</h2>
                    <div className="profile-badges">
                        <span className="tier-badge" style={{backgroundColor: stats.tierColor + '30', color: 'var(--secondary)', borderColor: stats.tierColor}}>
                            {stats.loyaltyTier}
                        </span>
                        {profile?.role === 'admin' && <span className="status-badge tag-confirmed">Equipe PetSpa</span>}
                    </div>
                </div>
            </div>
            <div className="header-actions">
                <button className="btn-icon-sm" onClick={() => toast.info("Configurações em breve!")}>
                    <Settings size={18} />
                </button>
                <button className="btn-icon-sm" onClick={handleLogout} title="Sair">
                    <LogOut size={18} color="#FF7675" />
                </button>
            </div>
         </div>

         {/* ACESSO RÁPIDO ADMIN */}
         {profile?.role === 'admin' && (
             <div className="card admin-shortcut-card reveal-on-scroll" onClick={() => onNavigate('admin')}>
                <div className="admin-icon-box">
                    <LayoutDashboard size={22} color="white" />
                </div>
                <div className="admin-text">
                    <h3>Painel Operacional</h3>
                    <p>Gerencie o fluxo de banhos e o financeiro da loja.</p>
                </div>
                <div className="chevron-icon">
                   <ChevronRight size={16} />
                </div>
             </div>
         )}

         <div className="dashboard-layout-grid">
            
            {/* COLUNA ESQUERDA: TRACKING, FIDELIDADE E HISTÓRICO */}
            <div className="dash-main-col">
                
                {/* Acompanhamento Ativo */}
                <ActiveTrackingCard 
                    appointments={apps} 
                    onNavigate={onNavigate} 
                    setSelectedAppointment={setSelectedAppointment}
                />

                {/* Cartão de Fidelidade Moderno */}
                <div className="loyalty-card-modern reveal-on-scroll">
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
                            <span>Faltam {Math.max(0, stats.nextTierCount - stats.totalCount)} visitas para o nível {stats.totalCount >= 10 ? 'Diamante' : stats.totalCount >= 5 ? 'Ouro' : 'Prata'}</span>
                        </div>
                    </div>
                </div>

                {/* Stats Rápidos Row */}
                <div className="stats-row-mini reveal-on-scroll">
                    <div className="mini-stat">
                        <div className="stat-icon-bg" style={{background: '#F3E5F5'}}><Clock size={16} color="#9C27B0"/></div>
                        <strong>{stats.totalHours}h</strong>
                        <span>Tempo de Spa</span>
                    </div>
                    <div className="mini-stat">
                        <div className="stat-icon-bg" style={{background: '#E0F2F1'}}><TrendingUp size={16} color="#009688"/></div>
                        <strong>{formatCurrency(stats.totalInvested)}</strong>
                        <span>Investimento</span>
                    </div>
                    <div className="mini-stat">
                        <div className="stat-icon-bg" style={{background: '#FFF3E0'}}><Sparkles size={16} color="#FB8C00"/></div>
                        <strong>{stats.favoriteService}</strong>
                        <span>Favorito</span>
                    </div>
                </div>

                {/* Últimos Agendamentos */}
                <div className="section-header-row reveal-on-scroll">
                    <h3>Últimos Agendamentos</h3>
                </div>
                <div className="card reveal-on-scroll" style={{padding: 0, overflow: 'hidden'}}>
                    {apps.length === 0 ? (
                        <div className="empty-state">Nenhum histórico recente.</div>
                    ) : (
                        apps.slice(0, 3).map(a => (
                            <div key={a.id} className="history-list-item clickable-card" onClick={() => { setSelectedAppointment(a); onNavigate('appointment-details'); }}>
                                <div className="history-item-left">
                                    <div className="service-mini-icon">
                                        <History size={16} />
                                    </div>
                                    <div>
                                        <strong>{a.services?.name}</strong>
                                        <small>{new Date(a.start_time).toLocaleDateString()}</small>
                                    </div>
                                </div>
                                <span className={`status-badge tag-${a.status}`}>{a.status}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* COLUNA DIREITA: PETS, PLANOS E MENU DA CONTA */}
            <div className="dash-side-col">
                
                {/* Meus Pets */}
                <div className="section-header-row reveal-on-scroll">
                    <h3>Meus Pets</h3>
                    <button className="btn-icon-plus" onClick={onAddPet}>
                        <Plus size={16} />
                    </button>
                </div>
                <div className="pets-grid-vertical reveal-on-scroll">
                    {pets.length === 0 ? (
                        <div className="card empty-pet-card" onClick={onAddPet}>
                            <Plus size={24} color="var(--primary)" />
                            <p>Cadastrar Pet</p>
                        </div>
                    ) : (
                        pets.map(p => (
                            <div key={p.id} className="card pet-item-horizontal clickable-card" onClick={() => { setSelectedPet(p); onNavigate('pet-details'); }}>
                                <img src={getPetAvatarUrl(p.name)} alt={p.name} className="pet-mini-avatar" />
                                <div className="pet-item-info">
                                    <strong>{p.name}</strong>
                                    <span>{p.breed || 'Pet Amado'}</span>
                                </div>
                                <ChevronRight size={16} color="#ccc" />
                            </div>
                        ))
                    )}
                </div>

                {/* Planos VIP */}
                {subscriptions.length > 0 && (
                    <div className="reveal-on-scroll" style={{marginTop: 24}}>
                        <h3 className="section-title-sm">Planos VIP Ativos</h3>
                        <div className="subscriptions-list">
                            {subscriptions.map(sub => {
                                const pet = pets.find(p => p.id === sub.pet_id);
                                return (
                                    <div key={sub.id} className="card sub-compact-card clickable-card" onClick={() => onNavigate('packages')}>
                                        <div className="sub-icon-box" style={{background: sub.packages?.color_theme || 'var(--primary)'}}>
                                            <Crown size={18} color="white" />
                                        </div>
                                        <div className="sub-text">
                                            <strong>{sub.packages?.title}</strong>
                                            <span>Pet: {pet?.name || 'Vários'}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Menu de Conta (Funcionalidades do Profile.tsx) */}
                <div className="account-menu-group reveal-on-scroll" style={{marginTop: 32}}>
                    <h3 className="section-title-sm">Menu da Conta</h3>
                    <div className="settings-list">
                        <button className="settings-item"><UserIcon size={18} /> Meus Dados Pessoais</button>
                        <button className="settings-item"><CreditCard size={18} /> Formas de Pagamento</button>
                        <button className="settings-item"><ShieldCheck size={18} /> Privacidade e Segurança</button>
                        <button className="settings-item"><HelpCircle size={18} /> Central de Ajuda</button>
                        <button className="settings-item logout-item" onClick={handleLogout}><LogOut size={18} /> Sair da Conta</button>
                    </div>
                </div>

                {/* Card CTA Booking */}
                <div className="card cta-card-dashboard reveal-on-scroll">
                    <div className="cta-content">
                        <h3>Hora do Spa?</h3>
                        <p>Agende em segundos com nosso assistente inteligente.</p>
                    </div>
                    <button className="btn btn-white full-width" onClick={onOpenBooking}>
                        Agendar Banho
                    </button>
                </div>
            </div>
         </div>
      </div>
    );
};
