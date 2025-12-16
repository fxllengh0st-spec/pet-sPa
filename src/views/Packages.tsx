
import React, { useEffect, useState } from 'react';
import { ChevronLeft, Check, Crown, Star } from 'lucide-react';
import { Package, Route } from '../types';
import { api } from '../services/api';
import { formatCurrency } from '../utils/ui';
import { useToast } from '../context/ToastContext';

interface PackagesViewProps {
    onNavigate: (route: Route) => void;
    session: any;
}

export const PackagesView: React.FC<PackagesViewProps> = ({ onNavigate, session }) => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [subscribingId, setSubscribingId] = useState<number | null>(null);
    const toast = useToast();

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.packages.getPackages();
                console.log('Pacotes carregados:', data);
                setPackages(data || []);
            } catch (e) {
                console.error('Erro ao carregar pacotes:', e);
                toast.error('Erro ao carregar pacotes.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSubscribe = async (pkg: Package) => {
        if (!session) {
            toast.info('Faça login para assinar um pacote.');
            onNavigate('login');
            return;
        }

        setSubscribingId(pkg.id);
        try {
            await api.packages.subscribe(session.user.id, pkg.id);
            toast.success(`Parabéns! Você assinou o plano ${pkg.title}! 🎉`);
            // Aqui futuramente redirecionaria para WhatsApp ou checkout real
        } catch (e) {
            toast.error('Erro ao processar assinatura.');
        } finally {
            setSubscribingId(null);
        }
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
                    Garanta a higiene do seu pet com economia e benefícios exclusivos.
                    Sem fidelidade, cancele quando quiser.
                </p>
            </div>

            {/* Packages Grid */}
            <div className="packages-grid">
                {loading ? (
                    <div className="spinner-center"><div className="spinner"></div></div>
                ) : (
                    packages.length === 0 ? (
                         <div className="text-center w-full" style={{gridColumn: '1/-1', padding: 40}}>
                            <p style={{color: '#999'}}>Nenhum pacote disponível no momento.</p>
                         </div>
                    ) :
                    packages.map((pkg, idx) => {
                        // Safe casting for numeric types coming from DB
                        const price = Number(pkg.price);
                        const originalPrice = pkg.original_price ? Number(pkg.original_price) : null;
                        
                        return (
                        <div 
                            key={pkg.id} 
                            className={`card package-card reveal-on-scroll ${pkg.highlight ? 'highlight-pkg' : ''}`}
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
                                style={{ 
                                    background: pkg.highlight ? 'linear-gradient(135deg, var(--primary), #8E44AD)' : 'var(--secondary)',
                                    color: 'white',
                                    marginTop: 'auto'
                                }}
                                onClick={() => handleSubscribe(pkg)}
                                disabled={subscribingId !== null}
                            >
                                {subscribingId === pkg.id ? 'Processando...' : 'Quero Esse!'}
                            </button>
                        </div>
                    )})
                )}
            </div>
            
            <div className="card mt-4 reveal-on-scroll" style={{background: '#FFF8E1', border: '1px solid #FFE082'}}>
                <div style={{display:'flex', gap: 12}}>
                    <Star color="#FBC02D" fill="#FBC02D" />
                    <div>
                        <strong style={{color: '#F57F17'}}>Como funciona?</strong>
                        <p style={{fontSize:'0.9rem', margin:0, color:'#5d4037'}}>
                            Ao assinar, os créditos de banho são adicionados automaticamente à sua conta. 
                            Você agenda normalmente pelo app e o sistema desconta do seu pacote.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
