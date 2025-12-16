import React, { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, Check, Crown, Star, ShieldCheck, Dog, X, Settings, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Package, Route, Subscription, Pet } from '../types';
import { api } from '../services/api';
import { formatCurrency, getPetAvatarUrl } from '../utils/ui';
import { useToast } from '../context/ToastContext';

interface PackagesViewProps {
    onNavigate: (route: Route) => void;
    session: any;
}

// Configuração de Negócio (Duplicada para UI)
const BUSINESS_CONFIG = {
    OPEN_HOUR: 9, 
    CLOSE_HOUR: 18,
    WORK_DAYS: [1, 2, 3, 4, 5, 6], 
    SLOT_INTERVAL: 30
};

export const PackagesView: React.FC<PackagesViewProps> = ({ onNavigate, session }) => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [activeSubscriptions, setActiveSubscriptions] = useState<Subscription[]>([]);
    const [myPets, setMyPets] = useState<Pet[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    
    // Modais
    const [showSubscribeWizard, setShowSubscribeWizard] = useState<{pkg: Package} | null>(null);
    const [showManageModal, setShowManageModal] = useState<{pkg: Package} | null>(null);
    
    const toast = useToast();

    // --- STATE DO WIZARD DE ASSINATURA ---
    const [wizStep, setWizStep] = useState(1);
    const [wizPetId, setWizPetId] = useState<string | null>(null);
    const [wizDate, setWizDate] = useState('');
    const [wizTime, setWizTime] = useState<string | null>(null);

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

    // --- LÓGICA DE SLOTS (Mini version) ---
    const timeSlots = useMemo(() => {
        if (!wizDate) return [];
        const slots: string[] = [];
        const now = new Date();
        const isToday = wizDate === now.toLocaleDateString('en-CA');
        
        let currentHour = BUSINESS_CONFIG.OPEN_HOUR;
        let currentMinute = 0;
        // Assumindo banho médio de 60min para o primeiro agendamento
        const lastStartHour = BUSINESS_CONFIG.CLOSE_HOUR - 1; 

        while (currentHour < BUSINESS_CONFIG.CLOSE_HOUR) {
            const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            const decimalTime = currentHour + (currentMinute / 60);

            if (decimalTime > lastStartHour + 0.001) break;

            let isValid = true;
            if (isToday) {
                const slotDate = new Date(`${wizDate}T${timeStr}:00`);
                if (slotDate < new Date(now.getTime() + 30*60000)) isValid = false;
            }

            if (isValid) slots.push(timeStr);

            currentMinute += BUSINESS_CONFIG.SLOT_INTERVAL;
            if (currentMinute >= 60) {
                currentHour++;
                currentMinute = 0;
            }
        }
        return slots;
    }, [wizDate]);

    // Data de validade calculada
    const expirationDate = useMemo(() => {
        if (!wizDate) return null;
        const d = new Date(wizDate);
        d.setDate(d.getDate() + 30);
        return d.toLocaleDateString('pt-BR');
    }, [wizDate]);

    const isDayValid = useMemo(() => {
        if (!wizDate) return false;
        const dayOfWeek = new Date(`${wizDate}T12:00:00`).getDay();
        return BUSINESS_CONFIG.WORK_DAYS.includes(dayOfWeek);
    }, [wizDate]);

    // --- SELEÇÃO E ESTADO ---

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

        // Reset Wizard
        setWizStep(1);
        setWizPetId(null);
        setWizDate('');
        setWizTime(null);
        
        setShowSubscribeWizard({ pkg });
    };

    const confirmSubscription = async () => {
        if (!showSubscribeWizard || !wizPetId || !wizDate || !wizTime) return;
        const pkg = showSubscribeWizard.pkg;

        setProcessingId(pkg.id);
        const wizardStateCopy = { ...showSubscribeWizard }; // Keep reference
        setShowSubscribeWizard(null); // Close modal visual

        try {
            const startIso = `${wizDate}T${wizTime}:00`;
            const result = await api.packages.subscribe(session.user.id, pkg, wizPetId, startIso);
            
            if (result.warning) toast.warning(result.warning);
            else toast.success(result.message || 'Assinatura confirmada!');
            
            await loadData(); 
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || 'Erro ao processar assinatura.');
            // Reopen if error? For now, user has to retry.
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancelSubscription = async (subId: number) => {
        if (!window.confirm("Tem certeza que deseja cancelar esta assinatura? Os benefícios serão encerrados imediatamente.")) return;
        
        try {
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
            if (hasSomePetOnThisPlan && petsOnThisPlan.length === myPets.length) {
                return <button className="btn full-width btn-secondary" disabled style={{opacity: 0.8}}>Todos Protegidos <Check size={16} /></button>;
            }
            return <button className="btn full-width btn-secondary" disabled style={{opacity: 0.8}}>Seus pets já possuem planos</button>;
        }

        return (
            <button 
                className={`btn full-width ${processingId === pkg.id ? 'loading' : ''}`}
                style={pkg.highlight ? { background: 'linear-gradient(135deg, var(--primary), #8E44AD)', color: 'white' } : {}}
                onClick={() => handleInitiateSubscribe(pkg)}
                disabled={processingId !== null}
            >
                {processingId === pkg.id ? 'Processando...' : 'Assinar Agora'}
            </button>
        );
    };

    return (
        <div className="container page-enter" style={{ paddingTop: 20 }}>
            <div className="nav-header">
                <button className="btn-icon-sm" onClick={() => onNavigate('home')}><ChevronLeft size={22} /></button>
                <h3>Clube de Assinatura</h3>
                <div style={{ width: 44 }}></div>
            </div>

            <div className="text-center mb-4 fade-in-up">
                <p style={{ maxWidth: 500, margin: '0 auto', color: '#666' }}>
                    Saúde e higiene recorrente para seu pet. <br/>
                    <strong>Cada pet precisa de sua própria assinatura.</strong>
                </p>
            </div>

            <div className="packages-grid">
                {loading ? (
                    <div className="spinner-center"><div className="spinner"></div></div>
                ) : (
                    packages.length === 0 ? (
                         <div className="text-center w-full fade-in-up" style={{gridColumn: '1/-1', padding: 60, background: '#f8f9fa', borderRadius: 16}}>
                            <ShieldCheck size={48} color="#999" style={{marginBottom:16, opacity: 0.5}}/>
                            <h3 style={{color: '#666'}}>Nenhum plano disponível</h3>
                        </div>
                    ) :
                    packages.map((pkg, idx) => {
                        const price = Number(pkg.price);
                        const originalPrice = pkg.original_price ? Number(pkg.original_price) : null;
                        const petsOnThisPlan = getPetsOnPackage(pkg.id);
                        const hasSubs = petsOnThisPlan.length > 0;
                        
                        return (
                        <div key={pkg.id} className={`card package-card fade-in-up ${pkg.highlight ? 'highlight-pkg' : ''} ${hasSubs ? 'active-plan-card' : ''}`} style={{ transitionDelay: `${idx * 0.1}s` }}>
                            {pkg.highlight && <div className="pkg-badge"><Crown size={14} fill="white" /> POPULAR</div>}
                            
                            <div className="pkg-header" style={{ borderBottomColor: pkg.color_theme || 'var(--primary)' }}>
                                <h3 style={{ color: pkg.highlight ? 'var(--primary)' : 'var(--secondary)' }}>{pkg.title}</h3>
                                <p className="pkg-desc">{pkg.description}</p>
                            </div>
                            
                            {hasSubs && (
                                <div className="subscribed-section fade-in">
                                    <div className="subscribed-avatars-row">
                                        {petsOnThisPlan.map(s => (
                                            <img key={s.id} src={getPetAvatarUrl(s.pets?.name || '')} className="sub-avatar-mini" title={`${s.pets?.name} tem este plano`}/>
                                        ))}
                                    </div>
                                    <button className="btn-manage-link" onClick={() => setShowManageModal({pkg})}><Settings size={12} /> Gerenciar</button>
                                </div>
                            )}

                            <div className="pkg-price-area">
                                {originalPrice && originalPrice > price && <span className="pkg-old-price">de {formatCurrency(originalPrice)}</span>}
                                <div className="pkg-current-price">
                                    <small>R$</small><strong>{price.toFixed(0)}</strong><small>,00 /mês</small>
                                </div>
                            </div>

                            <ul className="pkg-features">
                                {(pkg.features || []).map((feat, i) => (
                                    <li key={i}>
                                        <div className="check-icon" style={{ background: pkg.color_theme || 'var(--primary)' }}><Check size={12} color="white" strokeWidth={3} /></div>
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            <div style={{marginTop: 'auto'}}>{renderButton(pkg)}</div>
                        </div>
                    )})
                )}
            </div>
            
            {/* --- WIZARD: SELEÇÃO DE PET + DATA --- */}
            {showSubscribeWizard && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth: 400}}>
                        <div className="modal-header">
                            <h3>Assinar {showSubscribeWizard.pkg.title}</h3>
                            <button onClick={() => setShowSubscribeWizard(null)} className="btn-icon-sm"><X size={20}/></button>
                        </div>

                        {/* STEP PROGRESS */}
                        <div className="wizard-steps">
                            <div className={`wizard-step-dot ${wizStep >= 1 ? 'active' : ''}`}>1</div>
                            <div className="wizard-line"></div>
                            <div className={`wizard-step-dot ${wizStep >= 2 ? 'active' : ''}`}>2</div>
                        </div>

                        <div className="wizard-body" style={{padding: '20px'}}>
                            
                            {/* STEP 1: PET */}
                            {wizStep === 1 && (
                                <div className="fade-in-up">
                                    <h4 className="text-center mb-4">Quem vai ganhar o pacote?</h4>
                                    <div className="pet-selection-list">
                                        {getUnsubscribedPets().map(p => (
                                            <div key={p.id} 
                                                 className={`pet-select-item clickable-card ${wizPetId === p.id ? 'selected' : ''}`}
                                                 style={wizPetId === p.id ? {borderColor:'var(--primary)', background:'var(--accent)'} : {}}
                                                 onClick={() => setWizPetId(p.id)}
                                            >
                                                <img src={getPetAvatarUrl(p.name)} alt={p.name} />
                                                <div style={{flex:1}}>
                                                    <strong>{p.name}</strong>
                                                    <small style={{display:'block', color:'#666'}}>{p.breed || 'Pet Amado'}</small>
                                                </div>
                                                {wizPetId === p.id && <div className="select-arrow" style={{background: 'var(--brand-green)'}}><Check size={18} color="white" /></div>}
                                            </div>
                                        ))}
                                    </div>
                                    <button className="btn btn-primary full-width mt-4" disabled={!wizPetId} onClick={() => setWizStep(2)}>
                                        Continuar
                                    </button>
                                </div>
                            )}

                            {/* STEP 2: DATE & AUTO SCHEDULE */}
                            {wizStep === 2 && (
                                <div className="fade-in-up">
                                    <h4 className="text-center mb-2">Agendar 1º Banho</h4>
                                    <p className="text-center text-sm text-gray-500 mb-4">
                                        Os demais {showSubscribeWizard.pkg.bath_count - 1} banhos serão agendados automaticamente nos próximos dias/semanas.
                                    </p>

                                    <div className="form-group">
                                        <label>Data de Início</label>
                                        <input type="date" className="input-lg" value={wizDate} min={new Date().toLocaleDateString('en-CA')} onChange={(e) => { setWizDate(e.target.value); setWizTime(null); }} />
                                    </div>

                                    {!isDayValid && wizDate && <div className="text-red-500 text-sm flex items-center gap-2 mb-2"><AlertCircle size={14}/> Fechado aos domingos!</div>}

                                    {isDayValid && wizDate && (
                                        <>
                                            <label style={{display:'block', marginBottom:8, fontWeight:700, fontSize:'0.85rem', color:'var(--secondary)'}}>Horários Disponíveis</label>
                                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, maxHeight: 150, overflowY: 'auto', paddingRight: 4, marginBottom:16}}>
                                                {timeSlots.map(time => (
                                                    <button key={time} onClick={() => setWizTime(time)} className={`py-2 px-1 rounded-lg text-sm font-bold border transition-all ${wizTime === time ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 hover:border-purple-300'}`}>{time}</button>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {wizDate && wizTime && (
                                        <div className="summary-card pop-in">
                                            <div className="summary-row"><span>Validade:</span> <strong>{new Date(wizDate).toLocaleDateString('pt-BR')} até {expirationDate}</strong></div>
                                            <div className="summary-row"><span>1º Banho:</span> <strong>{new Date(wizDate).toLocaleDateString('pt-BR')} às {wizTime}</strong></div>
                                            <div className="summary-row"><span>Automático:</span> <strong>+ {showSubscribeWizard.pkg.bath_count - 1} agendamentos</strong></div>
                                        </div>
                                    )}

                                    <div className="wizard-actions">
                                        <button className="btn btn-ghost" onClick={() => setWizStep(1)}>Voltar</button>
                                        <button className="btn btn-primary" disabled={!wizDate || !wizTime} onClick={confirmSubscription}>Confirmar Assinatura</button>
                                    </div>
                                </div>
                            )}

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
                            <p style={{fontSize:'0.9rem', color:'#666', marginBottom: 16}}>Abaixo estão os pets inscritos neste plano. Você pode cancelar a assinatura individualmente.</p>
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
                                        <button className="btn btn-sm btn-ghost" style={{color:'#D63031', borderColor:'#D63031', height: 32, padding: '0 10px'}} onClick={() => handleCancelSubscription(sub.id)}>Cancelar</button>
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