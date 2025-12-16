import React, { useMemo } from 'react';
import { Activity, CalendarCheck, Clock, ChevronRight, Droplet, Calendar, CheckCircle } from 'lucide-react';
import { Appointment } from '../types';

interface ActiveTrackingCardProps {
    appointments: Appointment[];
    filterPetId?: string; // Se fornecido, filtra apenas para este pet
    onNavigate: (route: any) => void;
    setSelectedAppointment: (app: Appointment) => void;
    variant?: 'full' | 'header';
}

export const ActiveTrackingCard: React.FC<ActiveTrackingCardProps> = ({ 
    appointments, 
    filterPetId, 
    onNavigate, 
    setSelectedAppointment,
    variant = 'full'
}) => {
    
    // Lógica centralizada de prioridade
    const activeApp = useMemo(() => {
        let relevantApps = appointments;
        
        // Filtra por Pet se necessário
        if (filterPetId) {
            relevantApps = relevantApps.filter(a => a.pet_id === filterPetId);
        }

        // 1. Em Progresso (Maior prioridade)
        const inProgress = relevantApps.find(a => a.status === 'in_progress');
        if (inProgress) return inProgress;
        
        // 2. Confirmado (Próximo no futuro)
        // Filtra apenas futuros ou hoje
        const now = new Date();
        const confirmed = relevantApps
            .filter(a => a.status === 'confirmed' && new Date(a.end_time) > now)
            .sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];
        if (confirmed) return confirmed;

        // 3. Pendente (Futuros)
        const pending = relevantApps
            .filter(a => a.status === 'pending' && new Date(a.end_time) > now)
            .sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];
        
        return pending;
    }, [appointments, filterPetId]);

    if (!activeApp) return null;

    const handleClick = () => {
        setSelectedAppointment(activeApp);
        onNavigate('appointment-details');
    };

    // RENDERIZAÇÃO COMPACTA PARA HEADER
    if (variant === 'header') {
        return (
            <div 
                className={`active-status-card header-compact status-bg-${activeApp.status} clickable-card`}
                onClick={handleClick}
            >
                <div className="compact-icon-box">
                    {activeApp.status === 'in_progress' && <Activity size={16} className="pulse-animation" />}
                    {activeApp.status === 'confirmed' && <CalendarCheck size={16} />}
                    {activeApp.status === 'pending' && <Clock size={16} />}
                </div>
                <div className="compact-info">
                    <span className="compact-pet-name">{activeApp.pets?.name}</span>
                    <span className="compact-status-text">
                        {activeApp.status === 'in_progress' ? 'Em Banho' : activeApp.status === 'confirmed' ? 'Confirmado' : 'Solicitado'}
                    </span>
                </div>
            </div>
        );
    }

    // RENDERIZAÇÃO PADRÃO (CARD FULL)
    return (
        <div className="reveal-on-scroll" onClick={handleClick} style={{cursor:'pointer', marginBottom: 24}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12}}>
                <h3 className="section-title" style={{margin:0, fontSize:'1.1rem'}}>
                    {filterPetId ? 'Status Atual' : 'Acompanhamento'}
                </h3>
            </div>
            
            <div className={`active-status-card status-bg-${activeApp.status}`}>
                <div className="active-status-header">
                    <div className="active-status-badge">
                        {activeApp.status === 'in_progress' && <><Activity size={14} className="pulse-animation"/> Em Atendimento</>}
                        {activeApp.status === 'confirmed' && <><CalendarCheck size={14}/> Confirmado</>}
                        {activeApp.status === 'pending' && <><Clock size={14}/> Aguardando Aprovação</>}
                    </div>
                    <div style={{background:'rgba(255,255,255,0.2)', borderRadius:'50%', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center'}}>
                        <ChevronRight size={18} color="white"/>
                    </div>
                </div>
                
                <div className="active-status-content">
                    <h3 style={{display:'flex', alignItems:'center', gap: 8}}>
                        {activeApp.pets?.name} <span style={{fontSize:'0.6em', opacity:0.8}}>• {activeApp.services?.name}</span>
                    </h3>
                    <p>
                        {activeApp.status === 'in_progress' 
                            ? 'Seu pet está recebendo cuidados agora mesmo! 🛁' 
                            : `${new Date(activeApp.start_time).toLocaleDateString()} às ${new Date(activeApp.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`}
                    </p>
                </div>
                
                {/* Decorative Icon Background */}
                <div style={{position:'absolute', right: -10, bottom: -20, opacity: 0.15}}>
                    {activeApp.status === 'in_progress' ? <Droplet size={100} fill="white"/> : <Calendar size={100} fill="white"/>}
                </div>
            </div>
        </div>
    );
};