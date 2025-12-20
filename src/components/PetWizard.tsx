
import React, { useState } from 'react';
import { X, Dog, Calendar, Weight, FileText, Camera, Upload, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { compressImage } from '../utils/ui';

interface PetWizardProps {
    onClose: () => void;
    session: any;
    onSuccess: () => Promise<void>;
}

export const PetWizard: React.FC<PetWizardProps> = ({ onClose, session, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const toast = useToast();

    // Form State
    const [name, setName] = useState('');
    const [breed, setBreed] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [weight, setWeight] = useState('');
    const [notes, setNotes] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Optimized Image Upload with Compression
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsCompressing(true);
        try {
            // Comprime a imagem antes de setar no estado (Economia de Storage)
            const compressedBase64 = await compressImage(file);
            setAvatarUrl(compressedBase64);
            toast.success('Foto processada e otimizada! 📸');
        } catch (err) {
            console.error("Erro ao comprimir imagem:", err);
            toast.error('Não conseguimos processar essa foto. Tente outra ou continue sem foto.');
        } finally {
            setIsCompressing(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("O nome do pet é obrigatório.");
            setStep(1);
            return;
        }

        setIsSaving(true);
        try {
            // Saneamento dos dados para evitar erros de tipo no PostgreSQL
            // 1. Tratar o peso (aceitar vírgula e garantir número válido ou null)
            const cleanWeight = weight ? parseFloat(weight.replace(',', '.')) : null;
            
            // 2. Montar o payload garantindo null em strings vazias (essencial para o campo DATE)
            const petPayload = {
                name: name.trim(),
                breed: breed.trim() || null,
                birth_date: birthDate || null, // Se for "", o Supabase/Postgres reclama se não for null
                weight: isNaN(Number(cleanWeight)) ? null : cleanWeight,
                notes: notes.trim() || null,
                avatar_url: avatarUrl // Já é base64 ou null
            };

            await api.booking.createPet(session.user.id, petPayload);
            
            // Tenta dar refresh nos dados, mas não deixa travar se o refresh falhar
            try {
                await onSuccess();
            } catch (refreshErr) {
                console.warn("Pet salvo, mas falha ao atualizar lista:", refreshErr);
            }

            toast.success(`${name} cadastrado com sucesso! 🐶`);
            onClose();
        } catch (e: any) {
            console.error("Erro fatal ao salvar pet:", e);
            const errorMessage = e.message || 'Erro desconhecido ao salvar.';
            toast.error(`Não foi possível salvar: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Novo Pet</h3>
                    <button onClick={onClose} className="btn-icon-sm" disabled={isSaving}><X size={20}/></button>
                </div>
                
                <div className="wizard-steps">
                    <div className={`wizard-step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
                    <div className="wizard-line"></div>
                    <div className={`wizard-step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
                    <div className="wizard-line"></div>
                    <div className={`wizard-step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
                    <div className="wizard-line"></div>
                    <div className={`wizard-step-dot ${step >= 4 ? 'active' : ''}`}>4</div>
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

                            <button className="btn btn-primary full-width mt-4" disabled={!name.trim()} onClick={() => setStep(2)}>
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
                                    type="text" 
                                    inputMode="decimal"
                                    value={weight} 
                                    onChange={e => setWeight(e.target.value)} 
                                    placeholder="Ex: 12,5"
                                />
                            </div>

                            <div className="wizard-actions">
                                <button className="btn btn-ghost" onClick={() => setStep(1)}>Voltar</button>
                                <button className="btn btn-primary" onClick={() => setStep(3)}>Próximo</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Notes */}
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

                            <div className="wizard-actions">
                                <button className="btn btn-ghost" onClick={() => setStep(2)}>Voltar</button>
                                <button className="btn btn-primary" onClick={() => setStep(4)}>Próximo</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Photo & Confirm */}
                    {step === 4 && (
                        <div className="fade-in-up">
                            <h4 className="text-center mb-4">Uma foto do {name}! 📸</h4>
                            
                            <div style={{display:'flex', flexDirection:'column', alignItems:'center', marginBottom: 20}}>
                                <div style={{
                                    width: 120, height: 120, borderRadius: '50%', 
                                    background: '#F8F9FA', border: '2px dashed #CBD5E0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden', position: 'relative'
                                }}>
                                    {isCompressing ? (
                                        <Loader2 className="animate-spin" color="var(--primary)" size={32} />
                                    ) : avatarUrl ? (
                                        <img src={avatarUrl} alt="Preview" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                    ) : (
                                        <Camera size={40} color="#CBD5E0" />
                                    )}
                                </div>
                                
                                <label className={`btn btn-sm btn-ghost mt-4 ${isCompressing || isSaving ? 'opacity-50 pointer-events-none' : ''}`} style={{cursor: 'pointer'}}>
                                    <Upload size={16} style={{marginRight: 6}} />
                                    {avatarUrl ? 'Trocar Foto' : 'Escolher Foto'}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:'none'}} disabled={isCompressing || isSaving} />
                                </label>
                                <small style={{color:'#999', marginTop:4, fontSize:'0.75rem'}}>A foto será otimizada para ocupar menos espaço.</small>
                            </div>

                            <div className="summary-card">
                                <div className="summary-row"><span>Nome:</span> <strong>{name}</strong></div>
                                {breed && <div className="summary-row"><span>Raça:</span> <strong>{breed}</strong></div>}
                                {weight && <div className="summary-row"><span>Peso:</span> <strong>{weight} kg</strong></div>}
                            </div>

                            <div className="wizard-actions">
                                <button className="btn btn-ghost" disabled={isSaving} onClick={() => setStep(3)}>Voltar</button>
                                <button 
                                  className={`btn btn-primary ${isSaving ? 'loading' : ''}`} 
                                  disabled={isSaving || isCompressing} 
                                  onClick={handleSave}
                                >
                                    {isSaving ? 'Salvando...' : 'Finalizar Cadastro'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
