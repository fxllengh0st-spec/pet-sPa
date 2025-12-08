
import React from 'react';
import { ChevronLeft, Scissors, Droplet, Sparkles, Footprints, Heart, Stethoscope } from 'lucide-react';
import { Service, Route } from '../types';
import { formatCurrency } from '../utils/ui';

interface ServicesPageProps {
    services: Service[];
    onNavigate: (route: Route) => void;
    onOpenBooking: () => void;
    session: any;
}

const getServiceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('banho')) return <Droplet size={32} />;
    if (n.includes('tosa') || n.includes('corte')) return <Scissors size={32} />;
    if (n.includes('hidrata') || n.includes('spa')) return <Sparkles size={32} />;
    if (n.includes('unha') || n.includes('higiene') || n.includes('limpeza')) return <Footprints size={32} />;
    if (n.includes('vacina') || n.includes('exame') || n.includes('consulta')) return <Stethoscope size={32} />;
    return <Heart size={32} />;
};

export const ServicesPage: React.FC<ServicesPageProps> = ({ services, onNavigate, onOpenBooking, session }) => (
    <div className="container page-enter" style={{paddingTop:20}}>
        <div className="nav-header">
             <button className="btn-icon-sm" onClick={() => onNavigate('home')}><ChevronLeft /></button>
             <h3>Nossos Serviços</h3>
             <div style={{width: 44}}></div>
        </div>
        <div className="services-list-full">
            {services.map((s, idx) => (
                <div key={s.id} className="card service-card-detailed reveal-on-scroll" style={{ transitionDelay: `${idx * 0.1}s` }}>
                    <div className="service-icon-large">
                        {getServiceIcon(s.name)}
                    </div>
                    <div className="service-info-full">
                        <h3>{s.name}</h3>
                        <p>{s.description || 'Procedimento realizado por profissionais qualificados com produtos premium.'}</p>
                        <div className="service-tags">
                            <span className="tag-pill">⏳ {s.duration_minutes} min</span>
                            <span className="tag-pill-price">{formatCurrency(s.price)}</span>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => { if(session) onOpenBooking(); else onNavigate('login'); }}>
                        Agendar
                    </button>
                </div>
            ))}
        </div>
    </div>
);
