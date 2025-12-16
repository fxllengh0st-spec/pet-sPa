

import React, { useEffect, useState } from 'react';
import { ChevronLeft, Check, Crown, Star, ShieldCheck, Dog, X, Plus } from 'lucide-react';
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
    const [subscribingId, setSubscribingId] = useState<number | null>(null);
    const [showPetSelector, setShowPetSelector] = useState<{pkg: Package} | null>(null);
    
    const toast = useToast();

    // Função para carregar dados de forma resiliente
    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Carrega PACOTES (Tabela 'packages' que existe)
            try {
                const dataPackages = await api.packages.getPackages();
                setPackages(dataPackages || []);
            } catch (pkgError) {
                console.error("Erro ao buscar pacotes:", pkgError);
                toast.error("Erro ao carregar catálogo de planos.");
            }
            
            // 2. Carrega DADOS DO USUÁRIO (Pets e Assinaturas)
            // Fazemos isso separadamente para que, se a tabela 'subscriptions' não existir,
            // o resto da página ainda funcione.
            if (session) {
                // Carrega Pets
                try {
                    const petsData = await api.booking.getMyPets(session.user.id);
                    setMyPets(petsData || []);
                } catch (e) { console.error("Erro ao carregar pets", e); }

                // Carrega Assinaturas (Pode falhar se tabela não existir)
                try {
                    const subData = await api.packages.getMySubscriptions(session.user.id);
                    setActiveSubscriptions(subData || []);
                } catch (e: any) {
                    // Silencioso na UI para não assustar o usuário, mas loga para o dev
                    console.warn("Aviso: Não foi possível carregar assinaturas. Verifique se a tabela 'subscriptions' existe no Supabase.", e.message);
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

    // Inicia fluxo de assinatura
    const initiateSubscribe = (pkg: Package) => {
        if (!session) {
            toast.info('Faça login para assinar um pacote.');
            onNavigate('login');
            return;
        }

        // Filtra pets que JÁ tem assinatura ativa (qualquer plano)
        const subscribedPetIds = activeSubscriptions.map(s => s.pet_id);
        const availablePets = myPets.filter(p => !subscribedPetIds.includes(p.id));

        if (myPets.length === 0) {
            toast.info('Você precisa cadastrar um pet primeiro!');
            onNavigate('user-profile');
            return;
        }

        if (availablePets.length === 0) {
            toast.warning('Todos os seus pets já possuem um plano ativo! 🎉');
            return;
        }

        // Abre modal para escolher qual pet
        setShowPetSelector({ pkg });
    };

    const confirmSubscription = async (petId: string) => {
        if (!showPetSelector) return;
        const pkg = showPetSelector.pkg;

        setSubscribingId(pkg.id);
        setShowPetSelector(null); // Fecha modal

        try {
            await api.packages.subscribe(session.user.id, pkg.id, petId);
            
            toast.success(`Sucesso! O plano ${pkg.title} foi ativado. 🎉`);
            await loadData(); // Recarrega para atualizar a UI

        } catch (e: any) {
            console.error(e);
            if (e.message?.includes('subscriptions')) {
                toast.error('Erro de configuração no servidor (Tabela ausente).');
            } else {
                toast.error(e.message || 'Erro ao processar assinatura.');
            }
        } finally {
            setSubscribingId(null);
        }
    };

    // Renderiza badge com as fotos dos pets que tem esse plano
    const renderSubscribedPets = (pkgId: number) => {
        const subs = activeSubscriptions.filter(s => s.package_id === pkgId);
        if (subs.length === 0) return null;

        return (
            <div className="subscribed-pets-avatars fade-in">
                {subs.map(s => {
                    const petName = s.pets?.name || 'Pet';
                    return (
                        <div key={s.id} className="sub-pet-chip" title={`${petName} tem este plano`}>
                            <img src={getPetAvatarUrl(petName)} alt={petName} />
                            <span>{petName}</span>
                        </div>
                    );
                })}
            </div>
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
                    Assinaturas individuais por pet. Garanta banhos e cuidados o mês todo com desconto.
                </p>
            </div>

            {/* Packages Grid */}
            <div className="packages-grid">
                {loading ? (
                    <div className="spinner-center"><div className="spinner"></div></div>
                ) : (
                    packages.length === 0 ? (
                         <div className="text-center w-full" style={{gridColumn: '1/-1', padding: 60, background: '#f8f9fa', borderRadius: 16}}>
                            <div style={{marginBottom:16, opacity: 0.5}}><ShieldCheck size={48} color="#999"/></div>
                            <h3 style={{color: '#666', fontSize:'1.1rem'}}>Nenhum plano disponível</h3>
                            <p style={{color: '#999', fontSize:'0.9rem'}}>O administrador ainda não cadastrou pacotes de assinatura na tabela 'packages'.</p>
                            {session?.user?.email?.includes('admin') && (
                                <button className="btn btn-secondary btn-sm mt-4" onClick={() => onNavigate('admin')}>Cadastrar no Admin</button>
                            )}
                         </div>
                    ) :
                    packages.map((pkg, idx) => {
                        const price = Number(pkg.price);
                        const originalPrice = pkg.original_price ? Number(pkg.original_price) : null;
                        
                        // Verifica se este usuário tem alguma assinatura neste plano
                        const hasThisPlan = activeSubscriptions.some(s => s.package_id === pkg.id);
                        
                        return (
                        <div 
                            key={pkg.id} 
                            className={`card package-card reveal-on-scroll ${pkg.highlight ? 'highlight-pkg' : ''} ${hasThisPlan ? 'active-plan-card' : ''}`}
                            style={{ transitionDelay: `${idx * 0.1}s` }}
                        >
                            {pkg.highlight && (
                                <div className="pkg-badge">
                                    <Crown size={14} fill="white" /> MAIS POPULAR
                                </div>
                            )}

                            <div className="pkg-header" style={{ borderBottomColor: pkg.color_theme || 'var(--primary)' }}>
                                <h3 style={{ color: pkg.highlight ? 'var(--primary)' : 'var(--secondary)' }}>
                                    {pkg.title}
                                </h3>
                                <p className="pkg-desc">{pkg.description}</p>
                            </div>
                            
                            {/* Lista de pets inscritos neste plano */}
                            {renderSubscribedPets(pkg.id)}

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

                            <button 
                                className={`btn full-width ${subscribingId === pkg.id ? 'loading' : ''}`}
                                style={pkg.highlight ? { 
                                    background: 'linear-gradient(135deg, var(--primary), #8E44AD)',
                                    color: 'white',
                                    marginTop: 'auto'
                                } : { marginTop: 'auto' }}
                                onClick={() => initiateSubscribe(pkg)}
                            >
                                {subscribingId === pkg.id ? 'Processando...' : 'Assinar'}
                            </button>
                        </div>
                    )})
                )}
            </div>
            
            <div className="card mt-4 reveal-on-scroll" style={{background: '#FFF8E1', border: '1px solid #FFE082'}}>
                <div style={{display:'flex', gap: 12}}>
                    <Star color="#FBC02D" fill="#FBC02D" />
                    <div>
                        <strong style={{color: '#F57F17'}}>Assinatura por Pet</strong>
                        <p style={{fontSize:'0.9rem', margin:0, color:'#5d4037'}}>
                            Cada animalzinho precisa de sua própria assinatura. Você pode misturar planos diferentes para cada pet!
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal de Seleção de Pet */}
            {showPetSelector && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth: 400}}>
                        <div className="modal-header">
                            <h3>Escolha o Pet</h3>
                            <button onClick={() => setShowPetSelector(null)} className="btn-icon-sm"><X size={20}/></button>
                        </div>
                        <div className="wizard-body" style={{padding: '24px 20px'}}>
                            <p className="text-center mb-4">
                                Quem vai aproveitar o plano <strong>{showPetSelector.pkg.title}</strong>?
                            </p>
                            
                            <div className="pet-selection-list">
                                {myPets
                                    // Mostra apenas pets que NÃO tem assinatura
                                    .filter(p => !activeSubscriptions.some(s => s.pet_id === p.id))
                                    .map(p => (
                                    <div 
                                        key={p.id} 
                                        className="pet-select-item clickable-card"
                                        onClick={() => confirmSubscription(p.id)}
                                    >
                                        <img src={getPetAvatarUrl(p.name)} alt={p.name} />
                                        <div>
                                            <strong>{p.name}</strong>
                                            <small>{p.breed || 'Pet Amado'}</small>
                                        </div>
                                        <div className="select-arrow"><Plus size={18} /></div>
                                    </div>
                                ))}
                            </div>
                            
                            {myPets.filter(p => !activeSubscriptions.some(s => s.pet_id === p.id)).length === 0 && (
                                <div className="empty-state text-center">
                                    <p>Todos os seus pets já têm planos!</p>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setShowPetSelector(null)}>Voltar</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};