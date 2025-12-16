
import React, { useState, useMemo, useEffect } from 'react';
import { X, AlertCircle, Clock, CalendarCheck, Check, Calendar as CalendarIcon, PartyPopper, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency, toLocalISOString, getPetAvatarUrl, formatDate } from '../utils/ui';
import { useToast } from '../context/ToastContext';
import { Pet, Service } from '../types';

// Configuração de Negócio
const BUSINESS_CONFIG = {
    OPEN_HOUR: 9, // 09:00
    CLOSE_HOUR: 18, // 18:00
    WORK_DAYS: [1, 2, 3, 4, 5, 6], // 0=Dom (Fechado)
    SLOT_INTERVAL: 30 // minutos
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
    
    // Selection States
    const [wizPet, setWizPet] = useState<string | null>(null);
    const [wizService, setWizService] = useState<Service | null>(null);
    
    // Date & Time States (Separados para melhor UX)
    const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
    const [selectedTime, setSelectedTime] = useState<string | null>(null); // HH:mm
    
    const [isBooking, setIsBooking] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    
    // Success State Data to display in final step
    const [bookedData, setBookedData] = useState<{
        petName: string;
        serviceName: string;
        date: string;
        time: string;
        price: number;
    } | null>(null);

    const toast = useToast();

    // Inicializa a data com hoje (Local Time)
    useEffect(() => {
        const today = new Date();
        // toLocaleDateString('en-CA') returns YYYY-MM-DD in local time
        setSelectedDate(today.toLocaleDateString('en-CA'));
    }, []);

    // Gera os slots de tempo baseados na data selecionada E duração do serviço
    const timeSlots = useMemo(() => {
        if (!selectedDate || !wizService) return [];

        const slots: string[] = [];
        const now = new Date();
        
        // Fix Timezone: Compare local date strings
        const isToday = selectedDate === now.toLocaleDateString('en-CA');
        
        let currentHour = BUSINESS_CONFIG.OPEN_HOUR;
        let currentMinute = 0;

        // Limite para o inicio do serviço: Horario Fechamento - Duração do Serviço
        const serviceDurationHours = wizService.duration_minutes / 60;
        const lastPossibleStartHour = BUSINESS_CONFIG.CLOSE_HOUR - serviceDurationHours;

        // Loop até o fechamento
        while (currentHour < BUSINESS_CONFIG.CLOSE_HOUR) {
            // Formatar HH:mm
            const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            
            // Verifica se o serviço terminaria DEPOIS do fechamento
            // Convert current time to decimal hours (ex: 17:30 = 17.5)
            const currentDecimalTime = currentHour + (currentMinute / 60);
            
            // Allow equality (start exactly at last possible moment)
            // Use epsilon for float comparison safety
            if (currentDecimalTime > lastPossibleStartHour + 0.001) {
                break;
            }

            // Validação de "Passado" para o dia de hoje
            let isValid = true;
            if (isToday) {
                // Creates date object in local time
                const slotDate = new Date(`${selectedDate}T${timeStr}:00`);
                // Buffer de 30min para agendamento em cima da hora
                const slotBuffer = new Date(now.getTime() + 30 * 60000);
                
                if (slotDate < slotBuffer) isValid = false;
            }

            if (isValid) {
                slots.push(timeStr);
            }

            // Incremento
            currentMinute += BUSINESS_CONFIG.SLOT_INTERVAL;
            if (currentMinute >= 60) {
                currentHour++;
                currentMinute = 0;
            }
        }
        return slots;
    }, [selectedDate, wizService]);

    // Validação de Dia da Semana (Domingo)
    const isDayValid = useMemo(() => {
        if (!selectedDate) return false;
        // Fix de timezone simples: Setar hora para meio dia para evitar virada de dia por UTC
        const dayOfWeek = new Date(`${selectedDate}T12:00:00`).getDay();
        return BUSINESS_CONFIG.WORK_DAYS.includes(dayOfWeek);
    }, [selectedDate]);

    // Helper para pular para o próximo dia útil
    const handleNextAvailableDay = () => {
        if (!selectedDate) return;
        const current = new Date(selectedDate);
        current.setDate(current.getDate() + 1);
        
        // Se cair num domingo (0), avança mais um
        if (current.getDay() === 0) {
             current.setDate(current.getDate() + 1);
        }
        
        setSelectedDate(current.toLocaleDateString('en-CA'));
        setSelectedTime(null);
    };

    const handleConfirm = async () => {
        if(!wizPet || !wizService || !selectedDate || !selectedTime) return;

        try {
            setIsBooking(true);
            setValidationError(null);

            // 1. Weekly Package Conflict Check
            const hasWeeklyConflict = await api.booking.checkWeeklyPackageConflict(wizPet, selectedDate);
            if (hasWeeklyConflict) {
                 setValidationError("Este pet já possui um banho do pacote agendado para esta semana.");
                 toast.warning("Use seus créditos do pacote ou escolha outra semana. 📅");
                 setIsBooking(false);
                 return;
            }

            // Montar ISO String final
            const startIso = `${selectedDate}T${selectedTime}:00`;
            const start = new Date(startIso);
            const duration = wizService.duration_minutes;
            const end = new Date(start.getTime() + duration * 60000);

            // 2. Check Availability with Backend (Collision Detection)
            const isAvailable = await api.booking.checkAvailability(start.toISOString(), end.toISOString());
            
            if (!isAvailable) {
                setValidationError("Este horário já está reservado. Por favor, escolha outro slot.");
                toast.error("Horário indisponível! 😓");
                setIsBooking(false);
                return;
            }

            // 3. Create Appointment (Success)
            await api.booking.createAppointment(session.user.id, wizPet, wizService.id, start.toISOString(), end.toISOString());
            
            // Prepare Success Data View
            const petObj = pets.find(p => p.id === wizPet);
            setBookedData({
                petName: petObj?.name || 'Seu Pet',
                serviceName: wizService.name,
                date: new Date(selectedDate).toLocaleDateString('pt-BR'),
                time: selectedTime,
                price: wizService.price
            });

            await onSuccess();
            // Don't close immediately. Move to success step.
            setStep(4);
            
        } catch (e) {
            console.error(e);
            toast.error('Erro técnico ao agendar. Tente novamente.');
        } finally {
            setIsBooking(false);
        }
    };

    // Calculate dynamic end time for preview
    const endTimePreview = useMemo(() => {
        if (!selectedDate || !selectedTime || !wizService) return '';
        const start = new Date(`${selectedDate}T${selectedTime}:00`);
        const end = new Date(start.getTime() + wizService.duration_minutes * 60000);
        return end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    }, [selectedDate, selectedTime, wizService]);

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                {/* Header (Hide close button on success step to force user to read) */}
                <div className="modal-header">
                    <h3>{step === 4 ? 'Agendamento Realizado!' : 'Agendar Banho & Tosa'}</h3>
                    {step !== 4 && <button onClick={onClose} className="btn-icon-sm"><X size={20}/></button>}
                </div>
                
                {step !== 4 && (
                    <div className="wizard-steps">
                        <div className={`wizard-step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
                        <div className="wizard-line"></div>
                        <div className={`wizard-step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
                        <div className="wizard-line"></div>
                        <div className={`wizard-step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
                    </div>
                )}

                <div className="wizard-body page-enter">
                    {/* STEP 1: PET SELECTION */}
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

                    {/* STEP 2: SERVICE SELECTION */}
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

                    {/* STEP 3: DATE & SLOT SELECTION */}
                    {step === 3 && (
                        <div className="fade-in-up">
                            <h4 className="text-center mb-2">Quando?</h4>
                            
                            <div className="form-group" style={{marginBottom:16}}>
                                <label style={{display:'flex', alignItems:'center', gap:6}}>
                                    <CalendarIcon size={14}/> Selecione o Dia
                                </label>
                                <input 
                                    type="date" 
                                    className="input-lg"
                                    value={selectedDate} 
                                    min={new Date().toLocaleDateString('en-CA')}
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value);
                                        setSelectedTime(null); 
                                        setValidationError(null);
                                    }}
                                />
                                {!isDayValid && selectedDate && (
                                    <div className="text-red-500 text-sm mt-2 flex items-center gap-2">
                                        <AlertCircle size={14}/> Fechado aos domingos!
                                    </div>
                                )}
                            </div>

                            {isDayValid && selectedDate && wizService && (
                                <div className="fade-in">
                                    <label style={{display:'block', marginBottom:8, fontWeight:700, fontSize:'0.85rem', color:'var(--secondary)'}}>
                                        Horários Disponíveis ({timeSlots.length})
                                    </label>
                                    
                                    {timeSlots.length === 0 ? (
                                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                                            <p className="text-sm text-gray-500 mb-3">
                                                {new Date(`${selectedDate}T00:00:00`) < new Date(new Date().setHours(0,0,0,0)) ? 'Data passada.' : 'Agenda lotada para hoje! 😓'}
                                            </p>
                                            <button 
                                                className="btn btn-sm btn-ghost full-width" 
                                                style={{color: 'var(--primary)', borderColor: 'var(--primary)'}}
                                                onClick={handleNextAvailableDay}
                                            >
                                                Ver próxima data livre <ArrowRight size={14} style={{marginLeft: 4}}/>
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{
                                            display: 'grid', 
                                            gridTemplateColumns: 'repeat(4, 1fr)', 
                                            gap: 8,
                                            maxHeight: 180,
                                            overflowY: 'auto',
                                            paddingRight: 4
                                        }}>
                                            {timeSlots.map(time => (
                                                <button
                                                    key={time}
                                                    onClick={() => { setSelectedTime(time); setValidationError(null); }}
                                                    className={`
                                                        py-2 px-1 rounded-lg text-sm font-bold border transition-all
                                                        ${selectedTime === time 
                                                            ? 'bg-purple-600 text-white border-purple-600 shadow-md transform scale-105' 
                                                            : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'}
                                                    `}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {validationError && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2 animate-pulse">
                                    <AlertCircle size={16} style={{marginTop:2, flexShrink:0}}/> 
                                    <span>{validationError}</span>
                                </div>
                            )}
                            
                            {wizPet && wizService && selectedDate && selectedTime && !validationError && (
                                <div className="summary-card pop-in">
                                    <h5 style={{margin:'0 0 10px 0', borderBottom:'1px solid #ddd', paddingBottom:6, color:'var(--secondary)'}}>Resumo</h5>
                                    <div className="summary-row"><span>Pet:</span> <strong>{pets.find(p=>p.id===wizPet)?.name}</strong></div>
                                    <div className="summary-row"><span>Serviço:</span> <strong>{wizService.name}</strong></div>
                                    <div className="summary-row"><span>Valor:</span> <strong style={{color:'var(--primary)'}}>{formatCurrency(wizService.price)}</strong></div>
                                    <div className="summary-row" style={{marginTop:8, paddingTop:8, borderTop:'1px dashed #ddd'}}>
                                        <span>Horário:</span> 
                                        <strong>
                                            {selectedTime}
                                            <span style={{color:'#666', margin:'0 4px', fontSize:'0.8em'}}>➝ {endTimePreview}</span>
                                        </strong>
                                    </div>
                                </div>
                            )}

                            <div className="wizard-actions">
                                <button className="btn btn-ghost" onClick={() => setStep(2)}>Voltar</button>
                                <button 
                                  className={`btn btn-primary ${isBooking ? 'loading' : ''}`} 
                                  disabled={!selectedTime || isBooking || !!validationError} 
                                  onClick={handleConfirm}
                                >
                                    {isBooking ? 'Reservando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: SUCCESS FEEDBACK */}
                    {step === 4 && bookedData && (
                        <div className="fade-in-up text-center" style={{paddingTop: 10}}>
                            <div style={{
                                width: 80, height: 80, margin: '0 auto 20px', 
                                background: '#E0F2F1', borderRadius: '50%', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }} className="pop-in">
                                <PartyPopper size={40} color="var(--brand-green)" />
                            </div>
                            
                            <h3 style={{color: 'var(--brand-green)', marginBottom: 8}}>Agendamento Enviado!</h3>
                            <p style={{marginBottom: 24, fontSize: '1rem'}}>
                                Avisamos o <strong>{bookedData.petName}</strong> que ele vai ficar cheiroso! 🐶✨
                            </p>

                            <div className="card" style={{background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 20, textAlign: 'left', marginBottom: 24}}>
                                <div className="summary-row">
                                    <span style={{color:'#666'}}><CalendarIcon size={14} style={{verticalAlign:'middle', marginRight:4}}/> Data</span>
                                    <strong>{bookedData.date}</strong>
                                </div>
                                <div className="summary-row">
                                    <span style={{color:'#666'}}><Clock size={14} style={{verticalAlign:'middle', marginRight:4}}/> Horário</span>
                                    <strong>{bookedData.time}</strong>
                                </div>
                                <div style={{height:1, background:'#eee', margin:'10px 0'}}></div>
                                <div className="summary-row">
                                    <span style={{color:'#666'}}>Serviço</span>
                                    <strong>{bookedData.serviceName}</strong>
                                </div>
                            </div>

                            <button className="btn btn-primary full-width" onClick={onClose}>
                                Combinado!
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
