import React, { useState, useMemo } from 'react';
import { X, AlertCircle, Clock, CalendarCheck, Check } from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency, toLocalISOString, getPetAvatarUrl } from '../utils/ui';
import { useToast } from '../context/ToastContext';
import { Pet, Service } from '../types';

// Business Rules Configuration (Pode vir do banco no futuro)
const BUSINESS_CONFIG = {
    OPEN_HOUR: 9,
    CLOSE_HOUR: 18,
    WORK_DAYS: [1, 2, 3, 4, 5, 6], // 0=Sun, 1=Mon, ..., 6=Sat (Fechado aos domingos)
};

interface BookingWizardProps {
    onClose: () => void;
    session: any;
    pets: Pet[];
    services: Service[];
    navigateTo: (route: any) => void;
    onSuccess: () => Promise<void>; 
}

export const BookingWizard: React.FC<BookingWizardProps> = ({ 
    onClose, 
    session, 
    pets, 
    services, 
    navigateTo,
    onSuccess 
}) => {
    const [step, setStep] = useState(1);
    const [wizPet, setWizPet] = useState<string | null>(null);
    const [wizService, setWizService] = useState<Service | null>(null);
    const [wizDate, setWizDate] = useState('');
    const [isBooking, setIsBooking] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const toast = useToast();

    // Reset error when user changes date
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setWizDate(e.target.value);
        setValidationError(null);
    };

    // Advanced Validation Logic (Frontend Check)
    const validateTimeRules = (dateStr: string): string | null => {
        if (!dateStr) return "Selecione uma data.";
        
        const date = new Date(dateStr);
        const now = new Date();
        
        // 1. Past Date Check
        if (date < now) {
            return "Não podemos voltar no tempo! Selecione uma data futura.";
        }

        // 2. Business Days Check
        const day = date.getDay();
        if (!BUSINESS_CONFIG.WORK_DAYS.includes(day)) {
            return "Estamos fechados aos domingos. Que tal segunda-feira?";
        }

        // 3. Business Hours Check
        const hour = date.getHours();
        if (hour < BUSINESS_CONFIG.OPEN_HOUR || hour >= BUSINESS_CONFIG.CLOSE_HOUR) {
            return `Nosso horário é das ${BUSINESS_CONFIG.OPEN_HOUR}h às ${BUSINESS_CONFIG.CLOSE_HOUR}h.`;
        }

        return null;
    };

    const handleConfirm = async () => {
        if(!wizPet || !wizService || !wizDate) return;

        // 1. Run local validation (Business Rules)
        const localError = validateTimeRules(wizDate);
        if (localError) {
            setValidationError(localError);
            toast.warning(localError);
            return;
        }

        try {
            setIsBooking(true);
            const start = new Date(wizDate);
            const duration = wizService.duration_minutes;
            const end = new Date(start.getTime() + duration * 60000);

            // 2. Check Availability with Backend (Collision Detection)
            const isAvailable = await api.booking.checkAvailability(start.toISOString(), end.toISOString());
            
            if (!isAvailable) {
                setValidationError("Já existe um agendamento neste horário. Por favor, escolha outro.");
                toast.error("Horário indisponível! 😓");
                setIsBooking(false);
                return;
            }

            // 3. Create Appointment (Success)
            await api.booking.createAppointment(session.user.id, wizPet, wizService.id, start.toISOString(), end.toISOString());
            
            await onSuccess();
            toast.success('Agendamento confirmado! Seu pet vai amar. 🐾');
            onClose();
        } catch (e) {
            console.error(e);
            toast.error('Erro técnico ao agendar. Tente novamente.');
        } finally {
            setIsBooking(false);
        }
    };

    // Calculate dynamic end time for preview
    const endTimePreview = useMemo(() => {
        if (!wizDate || !wizService) return '';
        const start = new Date(wizDate);
        const end = new Date(start.getTime() + wizService.duration_minutes * 60000);
        return end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    }, [wizDate, wizService]);

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Agendar Banho & Tosa</h3>
                    <button onClick={onClose} className="btn-icon-sm"><X size={20}/></button>
                </div>
                
                <div className="wizard-steps">
                    <div className={`wizard-step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
                    <div className="wizard-line"></div>
                    <div className={`wizard-step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
                    <div className="wizard-line"></div>
                    <div className={`wizard-step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
                </div>

                <div className="wizard-body page-enter">
                    {step === 1 && (
                        <div className="fade-in-up">
                            <h4 className="text-center mb-4">Quem vai receber cuidados hoje?</h4>
                            {pets.length === 0 ? (
                                <div className="empty-state text-center py-8">
                                    <p className="text-gray-500 mb-4">Você não tem pets cadastrados.</p>
                                    <button className="btn btn-primary btn-sm" onClick={() => { onClose(); navigateTo('user-profile'); }}>Cadastrar Pet</button>
                                </div>
                            ) : (
                                <div className="pet-selection-grid">
                                    {pets.map(p => (
                                        <div key={p.id} 
                                             className={`pet-select-card ${wizPet === p.id ? 'selected' : ''}`}
                                             onClick={() => setWizPet(p.id)}>
                                            <div style={{position:'relative'}}>
                                                <img src={getPetAvatarUrl(p.name)} className="pet-avatar-3d" style={{width: 56, height: 56}} alt={p.name} />
                                                {wizPet === p.id && (
                                                    <div style={{position:'absolute', right:-5, bottom:-5, background:'var(--primary)', borderRadius:'50%', padding:2}}>
                                                        <Check size={12} color='white' />
                                                    </div>
                                                )}
                                            </div>
                                            <span style={{fontWeight:600}}>{p.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button className="btn btn-primary full-width mt-6" disabled={!wizPet} onClick={() => setStep(2)}>Continuar</button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="fade-in-up">
                            <h4 className="text-center mb-4">Qual serviço?</h4>
                            <div className="services-list-wizard">
                                {services.map(s => (
                                    <div key={s.id} 
                                         className={`service-select-item ${wizService?.id === s.id ? 'selected' : ''}`}
                                         onClick={() => setWizService(s)}>
                                        <div style={{flex:1}}>
                                            <div className="service-name">{s.name}</div>
                                            <div className="service-meta"><Clock size={12} style={{verticalAlign:'middle'}}/> {s.duration_minutes} min</div>
                                        </div>
                                        <div className="service-price">{formatCurrency(s.price)}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="wizard-actions">
                                <button className="btn btn-ghost" onClick={() => setStep(1)}>Voltar</button>
                                <button className="btn btn-primary" disabled={!wizService} onClick={() => setStep(3)}>Continuar</button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="fade-in-up">
                            <h4 className="text-center mb-4">Quando?</h4>
                            
                            <div className="card" style={{padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', marginBottom: 20}}>
                                <div style={{fontSize:'0.85rem', color:'#666', marginBottom:12, display:'flex', alignItems:'center', gap:6}}>
                                    <CalendarCheck size={16} />
                                    <span>Horário: <strong>Seg-Sáb, 09:00 às 18:00</strong></span>
                                </div>
                                <div className="form-group" style={{marginBottom:0}}>
                                    <label>Data e Hora de Início</label>
                                    <input 
                                        type="datetime-local" 
                                        className={`input-lg ${validationError ? 'border-red-500' : ''}`}
                                        value={wizDate} 
                                        onChange={handleDateChange} 
                                        min={toLocalISOString(new Date())}
                                        style={validationError ? {borderColor: '#ef4444', backgroundColor: '#FEF2F2'} : {}}
                                    />
                                </div>
                                {validationError && (
                                    <div className="text-red-500 text-sm mt-3 flex items-start gap-2 animate-pulse">
                                        <AlertCircle size={16} style={{marginTop:2}}/> 
                                        <span>{validationError}</span>
                                    </div>
                                )}
                            </div>
                            
                            {wizPet && wizService && wizDate && !validationError && (
                                <div className="summary-card pop-in">
                                    <h5 style={{margin:'0 0 10px 0', borderBottom:'1px solid #ddd', paddingBottom:6, color:'var(--secondary)'}}>Resumo do Pedido</h5>
                                    <div className="summary-row"><span>Pet:</span> <strong>{pets.find(p=>p.id===wizPet)?.name}</strong></div>
                                    <div className="summary-row"><span>Serviço:</span> <strong>{wizService.name}</strong></div>
                                    <div className="summary-row"><span>Valor:</span> <strong style={{color:'var(--primary)'}}>{formatCurrency(wizService.price)}</strong></div>
                                    <div className="summary-row" style={{marginTop:8, paddingTop:8, borderTop:'1px dashed #ddd'}}>
                                        <span>Horário Previsto:</span> 
                                        <strong>
                                            {new Date(wizDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} 
                                            <span style={{color:'#666', margin:'0 4px'}}>➝</span> 
                                            {endTimePreview}
                                        </strong>
                                    </div>
                                </div>
                            )}

                            <div className="wizard-actions">
                                <button className="btn btn-ghost" onClick={() => setStep(2)}>Voltar</button>
                                <button 
                                  className={`btn btn-primary ${isBooking ? 'loading' : ''}`} 
                                  disabled={!wizDate || isBooking || !!validationError} 
                                  onClick={handleConfirm}
                                >
                                    {isBooking ? 'Verificando...' : 'Confirmar Agendamento'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};