
import React, { useMemo } from 'react';
import { Activity, CalendarCheck, Clock, ChevronRight, Droplet, Calendar } from 'lucide-react';
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
    
    // Lógica para encontrar TODOS os agendamentos ativos/relevantes
    const activeApps = useMemo(() => {
        const now = new Date();

        return appointments.filter(a => {
            // 0. Filtro Opcional de Pet
            if (filterPetId && a.pet_id !== filterPetId) return false;

            // 1. REGRA CRÍTICA: Nunca mostrar Finalizados ou Cancelados no Rastreio
            if (a.status === 'completed' || a.status === 'cancelled') return false;
            
            // 2. Em Progresso (Sempre mostra, pois está acontecendo agora)
            if (a.status === 'in_progress') return true;

            // 3. Confirmados ou Pendentes (Apenas se ainda não tiver passado o horário de fim)
            // Se o horário final já passou e não foi marcado como completed/in_progress, escondemos do tracker 
            // (assume-se que já acabou ou foi esquecido, não é mais "ativo" para o usuário monitorar)
            // Obs: Adicionamos 1 hora de tolerância após o fim antes de sumir, para o user não achar que sumiu do nada
            const endTimeTolerance = new Date(new Date(a.end_time).getTime() + 60 * 60000); 
            return endTimeTolerance > now;

        }).sort((a,b) => {
            // Ordenação: Em andamento primeiro (topo), depois por data mais próxima
            if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
            if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
            return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        });

    }, [appointments, filterPetId]);

    if (!activeApps || activeApps.length === 0) return null;

    const handleClick = (app: Appointment) => {
        setSelectedAppointment(app);
        onNavigate('appointment-details');
    };

    // --- RENDERIZAÇÃO COMPACTA PARA HEADER (Lista Horizontal) ---
    if (variant === 'header') {
        return (
            <div 
                className="no-scrollbar fade-in" 
                style={{
                    display:'flex', 
                    gap: 12, 
                    overflowX: 'auto', 
                    paddingBottom: 4, 
                    // LIMITE DE LARGURA: 
                    // Define um máximo fixo ou relativo à viewport para não empurrar a navegação.
                    // 35vw garante espaço em telas médias, 450px é um bom teto para telas grandes.
                    maxWidth: 'min(450px, 35vw)', 
                    alignItems: 'center'
                }}
            >
                {activeApps.map(app => (
                    <div 
                        key={app.id}
                        className={`active-status-card header-compact status-bg-${app.status} clickable-card`}
                        onClick={() => handleClick(app)}
                        style={{flexShrink: 0}} // Impede que o card encolha, forçando o scroll
                    >
                        <div className="compact-icon-box">
                            {app.status === 'in_progress' && <Activity size={16} className="pulse-animation" />}
                            {app.status === 'confirmed' && <CalendarCheck size={16} />}
                            {app.status === 'pending' && <Clock size={16} />}
                        </div>
                        <div className="compact-info">
                            <span className="compact-pet-name">{app.pets?.name}</span>
                            <span className="compact-status-text">
                                {app.status === 'in_progress' ? 'Em Banho' : app.status === 'confirmed' ? 'Confirmado' : 'Solicitado'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // --- RENDERIZAÇÃO PADRÃO (CARD FULL - Lista Vertical) ---
    return (
        <div className="reveal-on-scroll" style={{marginBottom: 24}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12}}>
                <h3 className="section-title" style={{margin:0, fontSize:'1.1rem'}}>
                    {filterPetId ? 'Status Atual' : `Acompanhamento (${activeApps.length})`}
                </h3>
            </div>
            
            <div style={{display:'flex', flexDirection:'column', gap: 16}}>
                {activeApps.map(app => (
                    <div 
                        key={app.id} 
                        className={`active-status-card status-bg-${app.status} clickable-card`} 
                        onClick={() => handleClick(app)}
                        style={{marginBottom: 0}} // Remove margem individual pois usamos gap no container
                    >
                        <div className="active-status-header">
                            <div className="active-status-badge">
                                {app.status === 'in_progress' && <><Activity size={14} className="pulse-animation"/> Em Atendimento</>}
                                {app.status === 'confirmed' && <><CalendarCheck size={14}/> Confirmado</>}
                                {app.status === 'pending' && <><Clock size={14}/> Aguardando Aprovação</>}
                            </div>
                            <div style={{background:'rgba(255,255,255,0.2)', borderRadius:'50%', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center'}}>
                                <ChevronRight size={18} color="white"/>
                            </div>
                        </div>
                        
                        <div className="active-status-content">
                            <h3 style={{display:'flex', alignItems:'center', gap: 8}}>
                                {app.pets?.name} <span style={{fontSize:'0.6em', opacity:0.8}}>• {app.services?.name}</span>
                            </h3>
                            <p>
                                {app.status === 'in_progress' 
                                    ? 'Seu pet está recebendo cuidados agora mesmo! 🛁' 
                                    : `${new Date(app.start_time).toLocaleDateString()} às ${new Date(app.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`}
                            </p>
                        </div>
                        
                        {/* Decorative Icon Background */}
                        <div style={{position:'absolute', right: -10, bottom: -20, opacity: 0.15}}>
                            {app.status === 'in_progress' ? <Droplet size={100} fill="white"/> : <Calendar size={100} fill="white"/>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
