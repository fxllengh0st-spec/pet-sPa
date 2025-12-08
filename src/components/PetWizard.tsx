
import React, { useState } from 'react';
import { X, Dog, Calendar, Weight, FileText } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface PetWizardProps {
    onClose: () => void;
    session: any;
    onSuccess: () => Promise<void>;
}

export const PetWizard: React.FC<PetWizardProps> = ({ onClose, session, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();

    // Form State
    const [name, setName] = useState('');
    const [breed, setBreed] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [weight, setWeight] = useState('');
    const [notes, setNotes] = useState('');

    const handleSave = async () => {
        if (!name) return;
        setIsSaving(true);
        try {
            const petPayload = {
                name,
                breed: breed || null,
                birth_date: birthDate || null,
                weight: weight ? parseFloat(weight) : null,
                notes: notes || null
            };

            await api.booking.createPet(session.user.id, petPayload);
            await onSuccess();
            toast.success(`${name} foi cadastrado com sucesso! 🐶`);
            onClose();
        } catch (e: any) {
            console.error(e);
            toast.error('Erro ao cadastrar pet. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Novo Pet</h3>
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
                    
                    {/* STEP 1: Basic Info */}
                    {step === 1 && (
                        <div className="fade-in-up">
                            <div style={{display:'flex', justifyContent:'center', marginBottom: 20}}>
                                <div className="mascot-icon-wrapper" style={{width: 60, height: 60, animation: 'none', cursor: 'default'}}>
                                   <Dog size={30} color="white" />
                                </div>
                            </div>
                            <h4 className="text-center mb-4">Qual o nome do seu amiguinho?</h4>
                            
                            <div className="form-group">
                                <label>Nome do Pet*</label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    placeholder="Ex: Rex, Luna..."
                                    autoFocus
                                    className="input-lg"
                                />
                            </div>
                            <div className="form-group">
                                <label>Raça (Opcional)</label>
                                <input 
                                    type="text" 
                                    value={breed} 
                                    onChange={e => setBreed(e.target.value)} 
                                    placeholder="Ex: Golden Retriever, SRD..."
                                />
                            </div>

                            <button className="btn btn-primary full-width mt-4" disabled={!name} onClick={() => setStep(2)}>
                                Próximo
                            </button>
                        </div>
                    )}

                    {/* STEP 2: Details */}
                    {step === 2 && (
                        <div className="fade-in-up">
                            <h4 className="text-center mb-4">Detalhes Importantes</h4>
                            
                            <div className="form-group">
                                <label><Calendar size={14} style={{marginRight:4, verticalAlign:'text-bottom'}}/> Data de Nascimento (Aproximada)</label>
                                <input 
                                    type="date" 
                                    value={birthDate} 
                                    onChange={e => setBirthDate(e.target.value)} 
                                />
                            </div>

                            <div className="form-group">
                                <label><Weight size={14} style={{marginRight:4, verticalAlign:'text-bottom'}}/> Peso (kg)</label>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    value={weight} 
                                    onChange={e => setWeight(e.target.value)} 
                                    placeholder="Ex: 12.5"
                                />
                            </div>

                            <div className="wizard-actions">
                                <button className="btn btn-ghost" onClick={() => setStep(1)}>Voltar</button>
                                <button className="btn btn-primary" onClick={() => setStep(3)}>Próximo</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Notes & Confirm */}
                    {step === 3 && (
                        <div className="fade-in-up">
                            <h4 className="text-center mb-4">Algo mais que devemos saber?</h4>
                            
                            <div className="form-group">
                                <label><FileText size={14} style={{marginRight:4, verticalAlign:'text-bottom'}}/> Observações / Alergias / Temperamento</label>
                                <textarea 
                                    value={notes} 
                                    onChange={e => setNotes(e.target.value)} 
                                    placeholder="Ex: Tem medo de secador; Alérgico a frango..."
                                    rows={3}
                                    style={{padding: 12, borderRadius: 16, border: '2px solid var(--bg-input)', resize: 'none', width: '100%', fontFamily: 'inherit'}}
                                />
                            </div>

                            <div className="summary-card">
                                <div className="summary-row"><span>Nome:</span> <strong>{name}</strong></div>
                                {breed && <div className="summary-row"><span>Raça:</span> <strong>{breed}</strong></div>}
                                {birthDate && <div className="summary-row"><span>Nascimento:</span> <strong>{new Date(birthDate).toLocaleDateString()}</strong></div>}
                                {weight && <div className="summary-row"><span>Peso:</span> <strong>{weight} kg</strong></div>}
                            </div>

                            <div className="wizard-actions">
                                <button className="btn btn-ghost" onClick={() => setStep(2)}>Voltar</button>
                                <button 
                                  className={`btn btn-primary ${isSaving ? 'loading' : ''}`} 
                                  disabled={isSaving} 
                                  onClick={handleSave}
                                >
                                    {isSaving ? 'Salvando...' : 'Cadastrar Pet'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
