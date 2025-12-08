
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency, toLocalISOString, getPetAvatarUrl } from '../utils/ui';
import { useToast } from '../context/ToastContext';
import { Pet, Service } from '../types';

interface BookingWizardProps {
    onClose: () => void;
    session: any;
    pets: Pet[];
    services: Service[];
    navigateTo: (route: any) => void;
    onSuccess: () => Promise<void>; // Para recarregar dados
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
    const [wizPet, setWizPet] = useState<number | null>(null);
    const [wizService, setWizService] = useState<Service | null>(null);
    const [wizDate, setWizDate] = useState('');
    const [isBooking, setIsBooking] = useState(false);
    const toast = useToast();

    const handleConfirm = async () => {
        if(!wizPet || !wizService || !wizDate) return;
        try {
            setIsBooking(true);
            const start = new Date(wizDate);
            const end = new Date(start.getTime() + wizService.duration_minutes * 60000);
            await api.booking.createAppointment(session.user.id, wizPet, wizService.id, start.toISOString(), end.toISOString());
            await onSuccess();
            toast.success('Agendamento realizado com sucesso! 🐾');
            onClose();
        } catch (e) {
            toast.error('Erro ao agendar. Tente novamente.');
        } finally {
            setIsBooking(false);
        }
    };

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
                                <div className="empty-state">
                                    <p>Você não tem pets cadastrados.</p>
                                    <button className="btn btn-primary btn-sm" onClick={() => { onClose(); navigateTo('user-profile'); }}>Cadastrar Pet</button>
                                </div>
                            ) : (
                                <div className="pet-selection-grid">
                                    {pets.map(p => (
                                        <div key={p.id} 
                                             className={`pet-select-card ${wizPet === p.id ? 'selected' : ''}`}
                                             onClick={() => setWizPet(p.id)}>
                                            <img src={getPetAvatarUrl(p.name)} className="pet-avatar-3d" style={{width: 48, height: 48}} alt={p.name} />
                                            <span>{p.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button className="btn btn-primary full-width mt-4" disabled={!wizPet} onClick={() => setStep(2)}>Continuar</button>
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
                                            <div className="service-meta">{s.duration_minutes} min</div>
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
                            <div className="form-group">
                                <label>Data e Hora</label>
                                <input 
                                    type="datetime-local" 
                                    className="input-lg" 
                                    value={wizDate} 
                                    onChange={e => setWizDate(e.target.value)} 
                                    min={toLocalISOString(new Date())}
                                />
                            </div>
                            
                            {wizPet && wizService && wizDate && (
                                <div className="summary-card">
                                    <div className="summary-row"><span>Pet:</span> <strong>{pets.find(p=>p.id===wizPet)?.name}</strong></div>
                                    <div className="summary-row"><span>Serviço:</span> <strong>{wizService.name}</strong></div>
                                    <div className="summary-row"><span>Valor:</span> <strong>{formatCurrency(wizService.price)}</strong></div>
                                    <div className="summary-row"><span>Data:</span> <strong>{new Date(wizDate).toLocaleDateString()} às {new Date(wizDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</strong></div>
                                </div>
                            )}

                            <div className="wizard-actions">
                                <button className="btn btn-ghost" onClick={() => setStep(2)}>Voltar</button>
                                <button 
                                  className={`btn btn-primary ${isBooking ? 'loading' : ''}`} 
                                  disabled={!wizDate || isBooking} 
                                  onClick={handleConfirm}
                                >
                                    {isBooking ? 'Agendando...' : 'Confirmar Agendamento'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
