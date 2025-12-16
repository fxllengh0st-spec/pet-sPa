
import React, { useState } from 'react';
import { X, Dog, Calendar, Weight, FileText, Camera, Upload } from 'lucide-react';
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
    
    // Image Handling
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            // Create local preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!name) return;
        setIsSaving(true);
        try {
            // 1. Create Pet record FIRST (without avatar_url initially to avoid PGRST204 if column is missing/cached or to get UUID)
            const petPayload = {
                name,
                breed: breed || null,
                birth_date: birthDate || null,
                weight: weight ? parseFloat(weight) : null,
                notes: notes || null
                // Note: Not sending avatar_url here yet
            };

            const createdPet = await api.booking.createPet(session.user.id, petPayload);
            
            // 2. If there is a file, upload it to Storage bucket using the new Pet ID
            if (createdPet && createdPet.id && selectedFile) {
                try {
                    const publicUrl = await api.booking.uploadPetPhoto(createdPet.id, selectedFile);
                    
                    // 3. Update the pet record with the returned URL
                    // Note: If 'avatar_url' column is missing in DB, this might still fail silently or throw, 
                    // but the pet is created and image uploaded.
                    await api.booking.updatePet(createdPet.id, { avatar_url: publicUrl });
                } catch (uploadErr) {
                    console.error("Erro ao fazer upload da imagem:", uploadErr);
                    toast.warning("Pet criado, mas houve um erro ao salvar a foto.");
                }
            }

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
                                    {avatarPreviewUrl ? (
                                        <img src={avatarPreviewUrl} alt="Preview" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                    ) : (
                                        <Camera size={40} color="#CBD5E0" />
                                    )}
                                </div>
                                
                                <label className="btn btn-sm btn-ghost mt-4" style={{cursor: 'pointer'}}>
                                    <Upload size={16} style={{marginRight: 6}} />
                                    {avatarPreviewUrl ? 'Trocar Foto' : 'Escolher Foto'}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:'none'}} />
                                </label>
                            </div>

                            <div className="summary-card">
                                <div className="summary-row"><span>Nome:</span> <strong>{name}</strong></div>
                                {breed && <div className="summary-row"><span>Raça:</span> <strong>{breed}</strong></div>}
                                {weight && <div className="summary-row"><span>Peso:</span> <strong>{weight} kg</strong></div>}
                            </div>

                            <div className="wizard-actions">
                                <button className="btn btn-ghost" onClick={() => setStep(3)}>Voltar</button>
                                <button 
                                  className={`btn btn-primary ${isSaving ? 'loading' : ''}`} 
                                  disabled={isSaving} 
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
