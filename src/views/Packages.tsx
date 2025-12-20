
import React, { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, Check, Crown, Star, ShieldCheck, Dog, X, Settings, Calendar, Clock, AlertCircle, ShoppingCart, Info, ArrowRight } from 'lucide-react';
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
            const dataPackages = await api.packages.getPackages();
            setPackages(dataPackages || []);
            
            // 2. Carrega Dados do Usuário
            if (session) {
                const [petsData, subData] = await Promise.all([
                    api.booking.getMyPets(session.user.id),
                    api.packages.getMySubscriptions(session.user.id)
                ]);
                setMyPets(petsData || []);
                setActiveSubscriptions(subData || []);
            }
        } catch (e: any) {
            console.error('Erro ao carregar pacotes:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [session]);

    // --- LÓGICA DE SLOTS ---
    const timeSlots = useMemo(() => {
        if (!wizDate) return [];
        const slots: string[] = [];
        const now = new Date();
        const isToday = wizDate === now.toLocaleDateString('en-CA');
        
        let currentHour = BUSINESS_CONFIG.OPEN_HOUR;
        let currentMinute = 0;
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
            if (currentMinute >= 60) { currentHour++; currentMinute = 0; }
        }
        return slots;
    }, [wizDate]);

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

    const handleInitiateSubscribe = (pkg: Package) => {
        if (!session) { toast.info('Faça login para assinar.'); onNavigate('login'); return; }
        const subscribedPetIds = activeSubscriptions.map(s => s.pet_id);
        const availablePets = myPets.filter(p => !subscribedPetIds.includes(p.id));

        if (myPets.length === 0) { toast.info('Cadastre um pet primeiro!'); onNavigate('user-profile'); return; }
        if (availablePets.length === 0) { toast.warning('Seus pets já possuem planos ativos! 🐶'); return; }

        setWizStep(1); setWizPetId(null); setWizDate(''); setWizTime(null);
        setShowSubscribeWizard({ pkg });
    };

    const confirmSubscription = async () => {
        if (!showSubscribeWizard || !wizPetId || !wizDate || !wizTime) return;
        const pkg = showSubscribeWizard.pkg;

        setProcessingId(pkg.id);
        setShowSubscribeWizard(null); 

        try {
            const startIso = `${wizDate}T${wizTime}:00`;
            const result = await api.packages.subscribe(session.user.id, pkg, wizPetId, startIso);
            if (result.warning) toast.warning(result.warning);
            else toast.success(result.message || 'Assinatura confirmada!');
            await loadData(); 
        } catch (e: any) {
            toast.error(e.message || 'Erro ao processar assinatura.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancelSubscription = async (subId: number) => {
        if (!window.confirm("Deseja cancelar esta assinatura?")) return;
        try {
            await api.packages.cancelSubscription(subId);
            toast.success("Cancelado.");
            setShowManageModal(null);
            loadData();
        } catch (e) { toast.error("Erro ao cancelar."); }
    };

    const freqLabels: any = { weekly: 'Semanal', biweekly: 'Quinzenal', monthly: 'Mensal' };

    return (
        <div className="container page-enter" style={{ paddingTop: 20 }}>
            <div className="nav-header">
                <button className="btn-icon-sm" onClick={() => onNavigate('home')}><ChevronLeft size={22} /></button>
                <h3>Clube de Assinatura</h3>
                <div style={{ width: 44 }}></div>
            </div>

            <div className="packages-grid">
                {loading ? (
                    <div className="spinner-center"><div className="spinner"></div></div>
                ) : (
                    packages.map((pkg, idx) => {
                        const themeColor = pkg.color_theme || 'var(--primary)';
                        const petsOnThisPlan = activeSubscriptions.filter(s => s.package_id === pkg.id);
                        return (
                        <div key={pkg.id} className={`card package-card fade-in-up ${pkg.highlight ? 'highlight-pkg' : ''}`} 
                             style={{ transitionDelay: `${idx * 0.1}s`, '--pkg-theme': themeColor } as any}>
                            {pkg.highlight && <div className="pkg-badge"><Crown size={14} fill="white" /> POPULAR</div>}
                            <h3>{pkg.title}</h3>
                            <p className="pkg-desc">{pkg.description}</p>
                            {petsOnThisPlan.length > 0 && (
                                <div className="subscribed-section">
                                    <div className="subscribed-avatars-row">
                                        {petsOnThisPlan.map(s => (
                                            <img key={s.id} src={getPetAvatarUrl(s.pets?.name || '')} className="sub-avatar-mini" />
                                        ))}
                                    </div>
                                    <button className="btn-manage-link" onClick={() => setShowManageModal({pkg})}><Settings size={12} /> Gerenciar</button>
                                </div>
                            )}
                            <div className="pkg-price-area">
                                <div className="pkg-current-price">
                                    <small>R$</small><strong>{Number(pkg.price).toFixed(0)}</strong><small>,00 /mês</small>
                                </div>
                            </div>
                            <ul className="pkg-features">
                                <li><Check size={14} color={themeColor} /> {pkg.bath_count}x Banhos <strong>{freqLabels[pkg.frequency] || 'S/D'}</strong></li>
                                {(pkg.features || []).map((feat, i) => (
                                    <li key={i}><Check size={14} color={themeColor} /> {feat}</li>
                                ))}
                            </ul>
                            <button className="btn full-width btn-primary" style={{background: themeColor}} onClick={() => handleInitiateSubscribe(pkg)}>
                                Assinar Plano
                            </button>
                        </div>
                    )})
                )}
            </div>
            
            {/* --- WIZARD: SELEÇÃO DE PET + DATA + RESUMO --- */}
            {showSubscribeWizard && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth: 420}}>
                        <div className="modal-header">
                            <h3>Assinar {showSubscribeWizard.pkg.title}</h3>
                            <button onClick={() => setShowSubscribeWizard(null)} className="btn-icon-sm"><X size={20}/></button>
                        </div>

                        <div className="wizard-steps">
                            <div className={`wizard-step-dot ${wizStep >= 1 ? 'active' : ''}`}>1</div>
                            <div className="wizard-line"></div>
                            <div className={`wizard-step-dot ${wizStep >= 2 ? 'active' : ''}`}>2</div>
                            <div className="wizard-line"></div>
                            <div className={`wizard-step-dot ${wizStep >= 3 ? 'active' : ''}`}>3</div>
                        </div>

                        <div className="wizard-body" style={{padding: '20px'}}>
                            
                            {/* STEP 1: PET */}
                            {wizStep === 1 && (
                                <div className="fade-in-up">
                                    <h4 className="text-center mb-4">Selecione o Pet</h4>
                                    <div className="pet-selection-list">
                                        {myPets.filter(p => !activeSubscriptions.map(s => s.pet_id).includes(p.id)).map(p => (
                                            <div key={p.id} className={`pet-select-item clickable-card ${wizPetId === p.id ? 'selected' : ''}`}
                                                 onClick={() => setWizPetId(p.id)}>
                                                <img src={getPetAvatarUrl(p.name)} alt={p.name} />
                                                <div style={{flex:1}}><strong>{p.name}</strong></div>
                                                {wizPetId === p.id && <div className="select-arrow"><Check size={18} color="white" /></div>}
                                            </div>
                                        ))}
                                    </div>
                                    <button className="btn btn-primary full-width mt-4" disabled={!wizPetId} onClick={() => setWizStep(2)}>Próximo</button>
                                </div>
                            )}

                            {/* STEP 2: DATA INICIAL */}
                            {wizStep === 2 && (
                                <div className="fade-in-up">
                                    <h4 className="text-center mb-2">Primeiro Banho</h4>
                                    <div className="form-group">
                                        <label>Data de Início</label>
                                        <input type="date" className="input-lg" value={wizDate} min={new Date().toLocaleDateString('en-CA')} onChange={(e) => { setWizDate(e.target.value); setWizTime(null); }} />
                                    </div>
                                    {isDayValid && wizDate && (
                                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, maxHeight: 150, overflowY: 'auto', marginBottom:16}}>
                                            {timeSlots.map(time => (
                                                <button key={time} onClick={() => setWizTime(time)} className={`py-2 px-1 rounded-lg text-sm font-bold border transition-all ${wizTime === time ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700'}`}>{time}</button>
                                            ))}
                                        </div>
                                    )}
                                    <div className="wizard-actions">
                                        <button className="btn btn-ghost" onClick={() => setWizStep(1)}>Voltar</button>
                                        <button className="btn btn-primary" disabled={!wizDate || !wizTime} onClick={() => setWizStep(3)}>Revisar Plano</button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: SUMMARY CARD (NEW) */}
                            {wizStep === 3 && (
                                <div className="fade-in-up">
                                    <h4 className="text-center mb-4">Resumo da Assinatura</h4>
                                    
                                    <div className="subscription-summary-card">
                                        <div className="summary-pet-row">
                                            <img src={getPetAvatarUrl(myPets.find(p => p.id === wizPetId)?.name || '')} />
                                            <div>
                                                <strong>{myPets.find(p => p.id === wizPetId)?.name}</strong>
                                                <span>Beneficiário</span>
                                            </div>
                                        </div>

                                        <div className="summary-details">
                                            <div className="detail-item">
                                                <ShoppingCart size={14} />
                                                <div className="detail-info">
                                                    <label>Plano</label>
                                                    <strong>{showSubscribeWizard.pkg.title}</strong>
                                                </div>
                                            </div>
                                            <div className="detail-item">
                                                <Calendar size={14} />
                                                <div className="detail-info">
                                                    <label>Frequência</label>
                                                    <strong>{freqLabels[showSubscribeWizard.pkg.frequency]} ({showSubscribeWizard.pkg.bath_count} banhos)</strong>
                                                </div>
                                            </div>
                                            <div className="detail-item">
                                                <Clock size={14} />
                                                <div className="detail-info">
                                                    <label>Início</label>
                                                    <strong>{new Date(wizDate).toLocaleDateString()} às {wizTime}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="summary-total">
                                            <span>Mensalidade</span>
                                            <strong>{formatCurrency(Number(showSubscribeWizard.pkg.price))}</strong>
                                        </div>
                                    </div>

                                    <div className="summary-notice">
                                        <Info size={14} />
                                        <span>Ao confirmar, {showSubscribeWizard.pkg.bath_count} agendamentos serão criados automaticamente.</span>
                                    </div>

                                    <div className="wizard-actions">
                                        <button className="btn btn-ghost" onClick={() => setWizStep(2)}>Alterar</button>
                                        <button className="btn btn-primary" onClick={confirmSubscription}>
                                            Finalizar e Agendar <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
