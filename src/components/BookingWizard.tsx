
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, AlertCircle, Clock, CalendarCheck, Check, Calendar as CalendarIcon, PartyPopper, ChevronRight, DollarSign } from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency, getPetAvatarUrl, formatDate } from '../utils/ui';
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
    
    // Date & Time States
    const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
    const [selectedTime, setSelectedTime] = useState<string | null>(null); // HH:mm
    
    const [isBooking, setIsBooking] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    
    // Success State Data
    const [bookedData, setBookedData] = useState<{
        petName: string;
        serviceName: string;
        date: string;
        time: string;
        price: number;
    } | null>(null);

    const toast = useToast();
    const dateScrollRef = useRef<HTMLDivElement>(null);

    // Inicializa a data com hoje (Local Time) se não tiver
    useEffect(() => {
        if (!selectedDate) {
            const today = new Date();
            // Se hoje for domingo (0), avança para segunda
            if (today.getDay() === 0) {
                today.setDate(today.getDate() + 1);
            }
            setSelectedDate(today.toLocaleDateString('en-CA'));
        }
    }, []);

    // --- GERADOR DE DATAS (HORIZONTAL SCROLL) ---
    const nextDays = useMemo(() => {
        const days = [];
        const today = new Date();
        
        for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const dayOfWeek = d.getDay();
            
            // Filtra dias de trabalho
            if (BUSINESS_CONFIG.WORK_DAYS.includes(dayOfWeek)) {
                days.push({
                    dateStr: d.toLocaleDateString('en-CA'),
                    dayName: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
                    dayNum: d.getDate(),
                    fullLabel: d.toLocaleDateString('pt-BR')
                });
            }
        }
        return days;
    }, []);

    // --- GERADOR DE SLOTS ---
    const timeSlots = useMemo(() => {
        if (!selectedDate || !wizService) return [];

        const slots: string[] = [];
        const now = new Date();
        const isToday = selectedDate === now.toLocaleDateString('en-CA');
        
        let currentHour = BUSINESS_CONFIG.OPEN_HOUR;
        let currentMinute = 0;

        const serviceDurationHours = wizService.duration_minutes / 60;
        const lastPossibleStartHour = BUSINESS_CONFIG.CLOSE_HOUR - serviceDurationHours;

        while (currentHour < BUSINESS_CONFIG.CLOSE_HOUR) {
            const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            const currentDecimalTime = currentHour + (currentMinute / 60);
            
            if (currentDecimalTime > lastPossibleStartHour + 0.001) break;

            let isValid = true;
            if (isToday) {
                const slotDate = new Date(`${selectedDate}T${timeStr}:00`);
                const slotBuffer = new Date(now.getTime() + 30 * 60000); // 30min antecedência
                if (slotDate < slotBuffer) isValid = false;
            }

            if (isValid) slots.push(timeStr);

            currentMinute += BUSINESS_CONFIG.SLOT_INTERVAL;
            if (currentMinute >= 60) {
                currentHour++;
                currentMinute = 0;
            }
        }
        return slots;
    }, [selectedDate, wizService]);

    const handleConfirm = async () => {
        if(!wizPet || !wizService || !selectedDate || !selectedTime) return;

        try {
            setIsBooking(true);
            setValidationError(null);

            // 1. Weekly Package Conflict Check
            const hasWeeklyConflict = await api.booking.checkWeeklyPackageConflict(wizPet, selectedDate);
            if (hasWeeklyConflict) {
                 setValidationError("Este pet já possui um banho agendado nesta semana (Plano VIP).");
                 toast.warning("Limite semanal do plano atingido. 📅");
                 setIsBooking(false);
                 return;
            }

            // Montar ISO String final
            const startIso = `${selectedDate}T${selectedTime}:00`;
            const start = new Date(startIso);
            const duration = wizService.duration_minutes;
            const end = new Date(start.getTime() + duration * 60000);

            // 2. Check Availability
            const isAvailable = await api.booking.checkAvailability(start.toISOString(), end.toISOString());
            
            if (!isAvailable) {
                setValidationError("Ops! Alguém acabou de reservar este horário. Tente outro.");
                toast.error("Horário indisponível! 😓");
                setIsBooking(false);
                return;
            }

            // 3. Create Appointment
            await api.booking.createAppointment(session.user.id, wizPet, wizService.id, start.toISOString(), end.toISOString());
            
            const petObj = pets.find(p => p.id === wizPet);
            setBookedData({
                petName: petObj?.name || 'Seu Pet',
                serviceName: wizService.name,
                date: new Date(selectedDate).toLocaleDateString('pt-BR'),
                time: selectedTime,
                price: wizService.price
            });

            await onSuccess();
            setStep(4);
            
        } catch (e) {
            console.error(e);
            toast.error('Erro técnico ao agendar. Tente novamente.');
        } finally {
            setIsBooking(false);
        }
    };

    // Auto-scroll para o dia selecionado (UX Polish)
    useEffect(() => {
        if (step === 3 && dateScrollRef.current) {
            // Pequeno delay para renderizar
            setTimeout(() => {
                const selectedEl = dateScrollRef.current?.querySelector('.date-pill.selected');
                if (selectedEl) {
                    selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            }, 100);
        }
    }, [step, selectedDate]);

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                {/* Header Compacto */}
                <div className="modal-header">
                    {step === 4 ? (
                         <h3 className="text-brand-green">Sucesso! 🎉</h3>
                    ) : (
                        <div style={{display:'flex', alignItems:'center', gap: 8}}>
                            {step > 1 && <button onClick={() => setStep(step - 1)} className="btn-icon-plain"><ChevronRight size={20} style={{transform:'rotate(180deg)'}}/></button>}
                            <div className="wizard-progress-pill">
                                Passo {step} de 3
                            </div>
                        </div>
                    )}
                    {step !== 4 && <button onClick={onClose} className="btn-icon-sm"><X size={20}/></button>}
                </div>

                <div className="wizard-body page-enter" style={{padding: '20px 24px'}}>
                    
                    {/* STEP 1: PET SELECTION */}
                    {step === 1 && (
                        <div className="fade-in-up">
                            <h2 className="wizard-title">Quem vai receber cuidados hoje?</h2>
                            
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
                                            <div style={{position:'relative', marginBottom: 8}}>
                                                <img src={getPetAvatarUrl(p.name)} className="pet-avatar-3d" style={{width: 64, height: 64, border:'2px solid white'}} alt={p.name} />
                                                {wizPet === p.id && (
                                                    <div className="check-badge-overlay">
                                                        <Check size={12} color='white' strokeWidth={3} />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-bold text-sm text-secondary">{p.name}</span>
                                            <span className="text-xs text-muted">{p.breed || 'Pet'}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button className="btn btn-primary full-width mt-6 shadow-float" disabled={!wizPet} onClick={() => setStep(2)}>
                                Continuar
                            </button>
                        </div>
                    )}

                    {/* STEP 2: SERVICE SELECTION */}
                    {step === 2 && (
                        <div className="fade-in-up">
                            <h2 className="wizard-title">Qual o tratamento?</h2>
                            <div className="services-list-wizard">
                                {services.map(s => (
                                    <div key={s.id} 
                                         className={`service-select-item ${wizService?.id === s.id ? 'selected' : ''}`}
                                         onClick={() => setWizService(s)}>
                                        <div className="service-radio-indicator">
                                            {wizService?.id === s.id && <div className="radio-inner" />}
                                        </div>
                                        <div style={{flex:1}}>
                                            <div className="service-name">{s.name}</div>
                                            <div className="service-meta text-xs mt-1">
                                                <Clock size={10} style={{marginRight:2}}/> {s.duration_minutes} min
                                            </div>
                                        </div>
                                        <div className="service-price-tag">
                                            {formatCurrency(s.price)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-primary full-width mt-4 shadow-float" disabled={!wizService} onClick={() => setStep(3)}>
                                Continuar
                            </button>
                        </div>
                    )}

                    {/* STEP 3: DATE & SLOT SELECTION (IMPROVED) */}
                    {step === 3 && (
                        <div className="fade-in-up">
                            <h2 className="wizard-title mb-2">Quando fica melhor?</h2>
                            
                            {/* Horizontal Date Picker */}
                            <div className="date-picker-label"><CalendarIcon size={14}/> Selecione o Dia</div>
                            <div className="horizontal-date-scroll" ref={dateScrollRef}>
                                {nextDays.map((d, i) => (
                                    <button 
                                        key={d.dateStr}
                                        className={`date-pill ${selectedDate === d.dateStr ? 'selected' : ''}`}
                                        onClick={() => { setSelectedDate(d.dateStr); setSelectedTime(null); setValidationError(null); }}
                                    >
                                        <span className="day-name">{d.dayName}</span>
                                        <span className="day-num">{d.dayNum}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Time Slots Grid */}
                            <div className="mt-6 animate-fade">
                                <div className="date-picker-label"><Clock size={14}/> Horários para {new Date(selectedDate).toLocaleDateString('pt-BR', {day:'2-digit', month:'long'})}</div>
                                
                                {timeSlots.length === 0 ? (
                                    <div className="empty-slots-msg">
                                        <AlertCircle size={20} />
                                        <span>Sem horários disponíveis para esta data.</span>
                                    </div>
                                ) : (
                                    <div className="slots-grid">
                                        {timeSlots.map(time => (
                                            <button
                                                key={time}
                                                onClick={() => { setSelectedTime(time); setValidationError(null); }}
                                                className={`slot-pill ${selectedTime === time ? 'selected' : ''}`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Validation Error Banner */}
                            {validationError && (
                                <div className="error-banner-shake mt-4">
                                    <AlertCircle size={16} /> 
                                    <span>{validationError}</span>
                                </div>
                            )}
                            
                            {/* Resumo & Action */}
                            <div className="fixed-bottom-action">
                                {wizPet && wizService && selectedDate && selectedTime && (
                                    <div className="booking-summary-row fade-in">
                                        <div>
                                            <small>Total a Pagar</small>
                                            <div className="summary-price">{formatCurrency(wizService.price)}</div>
                                        </div>
                                        <button 
                                          className={`btn btn-primary btn-wide ${isBooking ? 'loading' : ''}`} 
                                          disabled={!selectedTime || isBooking} 
                                          onClick={handleConfirm}
                                        >
                                            {isBooking ? 'Confirmando...' : 'Confirmar Agendamento'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            {/* Espaço extra para não cobrir conteúdo com o fixed bottom */}
                            <div style={{height: 80}}></div>
                        </div>
                    )}

                    {/* STEP 4: SUCCESS FEEDBACK */}
                    {step === 4 && bookedData && (
                        <div className="fade-in-up text-center pt-4">
                            <div className="success-confetti-icon pop-in">
                                <PartyPopper size={48} color="white" />
                            </div>
                            
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Agendado com Sucesso!</h2>
                            <p className="text-gray-500 mb-6">
                                O spa do <strong>{bookedData.petName}</strong> está garantido.
                            </p>

                            <div className="ticket-card">
                                <div className="ticket-header">
                                    <span className="ticket-label">Data</span>
                                    <strong className="ticket-value">{bookedData.date}</strong>
                                </div>
                                <div className="ticket-row">
                                    <span className="ticket-label">Horário</span>
                                    <strong className="ticket-value">{bookedData.time}</strong>
                                </div>
                                <div className="ticket-divider"></div>
                                <div className="ticket-row">
                                    <span className="ticket-label">Serviço</span>
                                    <strong className="ticket-value">{bookedData.serviceName}</strong>
                                </div>
                            </div>

                            <button className="btn btn-primary full-width mt-6" onClick={onClose}>
                                Ver na Minha Agenda
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
