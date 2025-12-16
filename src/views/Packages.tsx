

import React, { useEffect, useState } from 'react';
import { ChevronLeft, Check, Crown, Star, ShieldCheck, Dog, X, Plus, Trash2, Settings } from 'lucide-react';
import { Package, Route, Subscription, Pet } from '../types';
import { api } from '../services/api';
import { formatCurrency, getPetAvatarUrl } from '../utils/ui';
import { useToast } from '../context/ToastContext';

interface PackagesViewProps {
    onNavigate: (route: Route) => void;
    session: any;
}

export const PackagesView: React.FC<PackagesViewProps> = ({ onNavigate, session }) => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [activeSubscriptions, setActiveSubscriptions] = useState<Subscription[]>([]);
    const [myPets, setMyPets] = useState<Pet[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    
    // Modais
    const [showPetSelector, setShowPetSelector] = useState<{pkg: Package} | null>(null);
    const [showManageModal, setShowManageModal] = useState<{pkg: Package} | null>(null);
    
    const toast = useToast();

    // Função para carregar dados
    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Carrega Pacotes
            try {
                const dataPackages = await api.packages.getPackages();
                setPackages(dataPackages || []);
            } catch (pkgError) {
                console.error("Erro ao buscar pacotes:", pkgError);
                toast.error("Erro ao carregar catálogo de planos.");
            }
            
            // 2. Carrega Dados do Usuário
            if (session) {
                try {
                    const petsData = await api.booking.getMyPets(session.user.id);
                    setMyPets(petsData || []);
                } catch (e) { console.error("Erro ao carregar pets", e); }

                try {
                    const subData = await api.packages.getMySubscriptions(session.user.id);
                    setActiveSubscriptions(subData || []);
                } catch (e: any) {
                    console.warn("Aviso tabela subscriptions:", e.message);
                }
            }

        } catch (e: any) {
            console.error('Erro crítico na view Packages:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [session]);

    // --- LÓGICA DE SELEÇÃO E ESTADO ---

    // Pets que NÃO tem nenhuma assinatura ativa
    const getUnsubscribedPets = () => {
        const subscribedPetIds = activeSubscriptions.map(s => s.pet_id);
        return myPets.filter(p => !subscribedPetIds.includes(p.id));
    };

    // Pets que tem assinatura DESTE pacote específico
    const getPetsOnPackage = (pkgId: number) => {
        return activeSubscriptions.filter(s => s.package_id === pkgId);
    };

    // --- AÇÕES ---

    const handleInitiateSubscribe = (pkg: Package) => {
        if (!session) {
            toast.info('Faça login para assinar um pacote.');
            onNavigate('login');
            return;
        }

        const availablePets = getUnsubscribedPets();

        if (myPets.length === 0) {
            toast.info('Você precisa cadastrar um pet primeiro!');
            onNavigate('user-profile');
            return;
        }

        if (availablePets.length === 0) {
            toast.warning('Todos os seus pets já possuem um plano ativo! 🐶');
            return;
        }

        setShowPetSelector({ pkg });
    };

    const confirmSubscription = async (petId: string) => {
        if (!showPetSelector) return;
        const pkg = showPetSelector.pkg;

        setProcessingId(pkg.id);
        setShowPetSelector(null);

        try {
            await api.packages.subscribe(session.user.id, pkg.id, petId);
            toast.success(`Parabéns! Plano ${pkg.title} ativado! 🎉`);
            await loadData(); 
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || 'Erro ao processar assinatura.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancelSubscription = async (subId: number) => {
        if (!window.confirm("Tem certeza que deseja cancelar esta assinatura? Os benefícios serão encerrados imediatamente.")) return;
        
        try {
            // Loading visual local se quisesse, mas vamos usar toast
            toast.info("Processando cancelamento...");
            await api.packages.cancelSubscription(subId);
            toast.success("Assinatura cancelada com sucesso.");
            setShowManageModal(null);
            loadData();
        } catch (e) {
            toast.error("Erro ao cancelar assinatura.");
        }
    };

    // --- RENDERIZADORES ---

    const renderButton = (pkg: Package) => {
        const availablePets = getUnsubscribedPets();
        const petsOnThisPlan = getPetsOnPackage(pkg.id);
        const hasSomePetOnThisPlan = petsOnThisPlan.length > 0;
        
        // Se todos os meus pets já tem planos (qualquer plano)
        const allPetsProtected = myPets.length > 0 && availablePets.length === 0;

        if (allPetsProtected) {
            // Se todos os meus pets estão neste plano específico
            if (hasSomePetOnThisPlan && petsOnThisPlan.length === myPets.length) {
                return (
                    <button className="btn full-width btn-secondary" disabled style={{opacity: 0.8}}>
                        Todos Protegidos <Check size={16} />
                    </button>
                );
            }
             // Se estão protegidos mas nem todos neste plano
            return (
                <button className="btn full-width btn-secondary" disabled style={{opacity: 0.8}}>
                   Seus pets já possuem planos
                </button>
            );
        }

        return (
            <button 
                className={`btn full-width ${processingId === pkg.id ? 'loading' : ''}`}
                style={pkg.highlight ? { 
                    background: 'linear-gradient(135deg, var(--primary), #8E44AD)',
                    color: 'white'
                } : {}}
                onClick={() => handleInitiateSubscribe(pkg)}
                disabled={processingId !== null}
            >
                {processingId === pkg.id ? 'Processando...' : 'Assinar Agora'}
            </button>
        );
    };

    return (
        <div className="container page-enter" style={{ paddingTop: 20 }}>
            {/* Header */}
            <div className="nav-header">
                <button className="btn-icon-sm" onClick={() => onNavigate('home')}>
                    <ChevronLeft size={22} />
                </button>
                <h3>Clube de Assinatura</h3>
                <div style={{ width: 44 }}></div>
            </div>

            <div className="text-center mb-4 reveal-on-scroll">
                <p style={{ maxWidth: 500, margin: '0 auto', color: '#666' }}>
                    Saúde e higiene recorrente para seu pet. <br/>
                    <strong>Cada pet precisa de sua própria assinatura.</strong>
                </p>
            </div>

            {/* Packages Grid */}
            <div className="packages-grid">
                {loading ? (
                    <div className="spinner-center"><div className="spinner"></div></div>
                ) : (
                    packages.length === 0 ? (
                         <div className="text-center w-full" style={{gridColumn: '1/-1', padding: 60, background: '#f8f9fa', borderRadius: 16}}>
                            <ShieldCheck size={48} color="#999" style={{marginBottom:16, opacity: 0.5}}/>
                            <h3 style={{color: '#666'}}>Nenhum plano disponível</h3>
                            <p style={{color: '#999'}}>O catálogo de assinaturas está vazio no momento.</p>
                            {session?.user?.email?.includes('admin') && (
                                <button className="btn btn-secondary btn-sm mt-4" onClick={() => onNavigate('admin')}>Cadastrar no Admin</button>
                            )}
                         </div>
                    ) :
                    packages.map((pkg, idx) => {
                        const price = Number(pkg.price);
                        const originalPrice = pkg.original_price ? Number(pkg.original_price) : null;
                        const petsOnThisPlan = getPetsOnPackage(pkg.id);
                        const hasSubs = petsOnThisPlan.length > 0;
                        
                        return (
                        <div 
                            key={pkg.id} 
                            className={`card package-card reveal-on-scroll ${pkg.highlight ? 'highlight-pkg' : ''} ${hasSubs ? 'active-plan-card' : ''}`}
                            style={{ transitionDelay: `${idx * 0.1}s` }}
                        >
                            {/* Badges */}
                            {pkg.highlight && (
                                <div className="pkg-badge">
                                    <Crown size={14} fill="white" /> POPULAR
                                </div>
                            )}
                            
                            {/* Cabeçalho */}
                            <div className="pkg-header" style={{ borderBottomColor: pkg.color_theme || 'var(--primary)' }}>
                                <h3 style={{ color: pkg.highlight ? 'var(--primary)' : 'var(--secondary)' }}>
                                    {pkg.title}
                                </h3>
                                <p className="pkg-desc">{pkg.description}</p>
                            </div>
                            
                            {/* Pets Ativos neste Plano */}
                            {hasSubs && (
                                <div className="subscribed-section fade-in">
                                    <div className="subscribed-avatars-row">
                                        {petsOnThisPlan.map(s => (
                                            <img 
                                                key={s.id} 
                                                src={getPetAvatarUrl(s.pets?.name || '')} 
                                                alt={s.pets?.name} 
                                                title={`${s.pets?.name} tem este plano`}
                                                className="sub-avatar-mini"
                                            />
                                        ))}
                                    </div>
                                    <button className="btn-manage-link" onClick={() => setShowManageModal({pkg})}>
                                        <Settings size={12} /> Gerenciar
                                    </button>
                                </div>
                            )}

                            {/* Preço */}
                            <div className="pkg-price-area">
                                {originalPrice && originalPrice > price && (
                                    <span className="pkg-old-price">de {formatCurrency(originalPrice)}</span>
                                )}
                                <div className="pkg-current-price">
                                    <small>R$</small>
                                    <strong>{price.toFixed(0)}</strong>
                                    <small>,00 /mês</small>
                                </div>
                            </div>

                            {/* Lista de Features */}
                            <ul className="pkg-features">
                                {(pkg.features || []).map((feat, i) => (
                                    <li key={i}>
                                        <div className="check-icon" style={{ background: pkg.color_theme || 'var(--primary)' }}>
                                            <Check size={12} color="white" strokeWidth={3} />
                                        </div>
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            {/* Botão de Ação */}
                            <div style={{marginTop: 'auto'}}>
                                {renderButton(pkg)}
                            </div>
                        </div>
                    )})
                )}
            </div>
            
            <div className="card mt-4 reveal-on-scroll" style={{background: '#FFF8E1', border: '1px solid #FFE082'}}>
                <div style={{display:'flex', gap: 12}}>
                    <Star color="#FBC02D" fill="#FBC02D" />
                    <div>
                        <strong style={{color: '#F57F17'}}>Benefício Exclusivo</strong>
                        <p style={{fontSize:'0.9rem', margin:0, color:'#5d4037'}}>
                            Assinantes têm prioridade na agenda de finais de semana e feriados!
                        </p>
                    </div>
                </div>
            </div>

            {/* --- MODAL: SELEÇÃO DE PET PARA ASSINAR --- */}
            {showPetSelector && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth: 400}}>
                        <div className="modal-header">
                            <h3>Vincular Pet</h3>
                            <button onClick={() => setShowPetSelector(null)} className="btn-icon-sm"><X size={20}/></button>
                        </div>
                        <div className="wizard-body" style={{padding: '24px 20px'}}>
                            <div className="text-center mb-4">
                                <div style={{background: showPetSelector.pkg.color_theme || 'var(--primary)', color:'white', display:'inline-block', padding:'4px 12px', borderRadius:20, fontSize:'0.8rem', fontWeight:700, marginBottom:12}}>
                                    {showPetSelector.pkg.title}
                                </div>
                                <p>Quem será o sortudo que vai ganhar este plano?</p>
                            </div>
                            
                            <div className="pet-selection-list">
                                {getUnsubscribedPets().map(p => (
                                    <div 
                                        key={p.id} 
                                        className="pet-select-item clickable-card"
                                        onClick={() => confirmSubscription(p.id)}
                                    >
                                        <img src={getPetAvatarUrl(p.name)} alt={p.name} />
                                        <div style={{flex:1}}>
                                            <strong>{p.name}</strong>
                                            <small style={{display:'block', color:'#666'}}>{p.breed || 'Pet Amado'}</small>
                                        </div>
                                        <div className="select-arrow" style={{background: 'var(--brand-green)', border:'none'}}>
                                            <Check size={18} color="white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL: GERENCIAR ASSINATURA --- */}
            {showManageModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth: 400}}>
                        <div className="modal-header">
                            <h3>Gerenciar: {showManageModal.pkg.title}</h3>
                            <button onClick={() => setShowManageModal(null)} className="btn-icon-sm"><X size={20}/></button>
                        </div>
                        <div className="wizard-body" style={{padding: '20px'}}>
                            <p style={{fontSize:'0.9rem', color:'#666', marginBottom: 16}}>
                                Abaixo estão os pets inscritos neste plano. Você pode cancelar a assinatura individualmente.
                            </p>
                            
                            <div style={{display:'flex', flexDirection:'column', gap: 10}}>
                                {getPetsOnPackage(showManageModal.pkg.id).map(sub => (
                                    <div key={sub.id} className="card" style={{padding: 12, display:'flex', alignItems:'center', justifyContent:'space-between', border:'1px solid #eee', marginBottom:0}}>
                                        <div style={{display:'flex', alignItems:'center', gap: 10}}>
                                            <img src={getPetAvatarUrl(sub.pets?.name || '')} style={{width:40, height:40, borderRadius:'50%', objectFit:'cover'}} />
                                            <div>
                                                <strong style={{display:'block', lineHeight:1.2}}>{sub.pets?.name}</strong>
                                                <span className="status-badge tag-confirmed">Ativo</span>
                                            </div>
                                        </div>
                                        <button 
                                            className="btn btn-sm btn-ghost" 
                                            style={{color:'#D63031', borderColor:'#D63031', height: 32, padding: '0 10px'}}
                                            onClick={() => handleCancelSubscription(sub.id)}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};