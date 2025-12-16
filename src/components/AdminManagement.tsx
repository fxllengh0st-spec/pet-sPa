
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Service, Package } from '../types';
import { useToast } from '../context/ToastContext';
import { Plus, Edit2, Trash2, X, Package as PackageIcon, Scissors, CheckSquare, Square, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../utils/ui';

type Tab = 'services' | 'packages';

export const AdminManagement: React.FC = () => {
    const [tab, setTab] = useState<Tab>('services');
    const [services, setServices] = useState<Service[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Edit State
    const [editingId, setEditingId] = useState<number | null>(null);
    
    // Form States (Combined for simplicity, though could be separated)
    const [formData, setFormData] = useState<any>({});
    
    // "Create Service on the fly" State
    const [isCreatingNewService, setIsCreatingNewService] = useState(false);
    const [newServiceName, setNewServiceName] = useState('');

    const toast = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [srvs, pkgs] = await Promise.all([
                api.admin.getAllServicesAdmin(),
                api.admin.getAllPackagesAdmin()
            ]);
            setServices(srvs || []);
            setPackages(pkgs || []);
        } catch (e) {
            console.error(e);
            toast.error('Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openModal = (item?: any) => {
        if (item) {
            setEditingId(item.id);
            // Se for pacote, converter features array para string para edição textarea
            const data = { ...item };
            if (tab === 'packages') {
                if (Array.isArray(data.features)) {
                    data.features = data.features.join('\n');
                }
                // Handle service mapping logic if needed
                setIsCreatingNewService(false);
            }
            // Garantir que color theme tenha valor
            if (tab === 'packages' && !data.color_theme) {
                data.color_theme = '#9B59B6';
            }
            setFormData(data);
        } else {
            setEditingId(null);
            // Default values
            if (tab === 'services') {
                setFormData({ name: '', price: 0, duration_minutes: 30, active: true, description: '' });
            } else {
                setFormData({ 
                    title: '', price: 0, original_price: 0, 
                    bath_count: 1, features: '', highlight: false, 
                    color_theme: '#9B59B6', active: true, description: '',
                    service_id: '' // Start empty
                });
                setIsCreatingNewService(false);
                setNewServiceName('');
            }
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Tem certeza que deseja excluir este item?')) return;
        try {
            if (tab === 'services') await api.admin.deleteService(id);
            else await api.admin.deletePackage(id);
            toast.success('Item excluído com sucesso.');
            fetchData();
        } catch (e) {
            toast.error('Erro ao excluir.');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            
            // Tratamento específico para Pacotes
            if (tab === 'packages') {
                // Converter features string de volta para array
                if (typeof payload.features === 'string') {
                    payload.features = payload.features.split('\n').filter((l: string) => l.trim() !== '');
                }
                payload.price = Number(payload.price);
                payload.original_price = payload.original_price ? Number(payload.original_price) : null;
                payload.bath_count = Number(payload.bath_count);
                // Garantir cor válida se estiver vazia
                if (!payload.color_theme) payload.color_theme = '#9B59B6';
                
                // --- SMART SERVICE CREATION LOGIC ---
                // Se o usuário escolheu "CRIAR NOVO" (service_id === 'NEW')
                if (payload.service_id === 'NEW') {
                    if (!newServiceName) {
                        toast.error("Digite o nome do novo serviço.");
                        return;
                    }
                    // 1. Criar o serviço primeiro
                    const createdService = await api.admin.createService({
                        name: newServiceName,
                        price: 0, // Placeholder, admin deve editar depois
                        duration_minutes: 30, // Default
                        active: true,
                        description: 'Serviço criado automaticamente via Pacote'
                    });
                    
                    // 2. Usar o ID do novo serviço
                    payload.service_id = createdService.id;
                    toast.success(`Serviço "${newServiceName}" criado!`);
                    
                    // Refresh services list for future use without page reload
                    const srvs = await api.admin.getAllServicesAdmin();
                    setServices(srvs || []);
                }
            } else {
                payload.price = Number(payload.price);
                payload.duration_minutes = Number(payload.duration_minutes);
            }

            if (editingId) {
                if (tab === 'services') await api.admin.updateService(editingId, payload);
                else await api.admin.updatePackage(editingId, payload);
                toast.success('Atualizado com sucesso!');
            } else {
                if (tab === 'services') await api.admin.createService(payload);
                else await api.admin.createPackage(payload);
                toast.success('Criado com sucesso!');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar.');
        }
    };

    return (
        <div className="fade-in">
            {/* Sub-tabs */}
            <div className="admin-tabs" style={{marginBottom: 20}}>
                <button className={`tab-btn ${tab === 'services' ? 'active' : ''}`} onClick={() => setTab('services')}>
                    <Scissors size={16} style={{marginRight:6}}/> Serviços
                </button>
                <button className={`tab-btn ${tab === 'packages' ? 'active' : ''}`} onClick={() => setTab('packages')}>
                    <PackageIcon size={16} style={{marginRight:6}}/> Pacotes
                </button>
            </div>

            {/* Header com botão Add */}
            <div style={{display:'flex', justifyContent:'space-between', marginBottom: 16}}>
                <h3>Gerenciar {tab === 'services' ? 'Serviços' : 'Pacotes'}</h3>
                <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                    <Plus size={16} /> Novo
                </button>
            </div>

            {/* Listagem */}
            {loading ? <div className="spinner-center"><div className="spinner"></div></div> : (
                <div className="card" style={{padding:0, overflow:'hidden'}}>
                    <div className="table-wrapper" style={{border:'none', margin:0, borderRadius:0}}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nome/Título</th>
                                    <th>Preço</th>
                                    {tab === 'services' ? <th>Duração</th> : <th>Banhos / Serviço</th>}
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tab === 'services' ? services.map(s => (
                                    <tr key={s.id}>
                                        <td>#{s.id}</td>
                                        <td><strong>{s.name}</strong></td>
                                        <td>{formatCurrency(Number(s.price))}</td>
                                        <td>{s.duration_minutes} min</td>
                                        <td>{s.active ? <span className="status-badge tag-confirmed">Ativo</span> : <span className="status-badge tag-cancelled">Inativo</span>}</td>
                                        <td style={{textAlign:'right'}}>
                                            <button className="btn-icon-sm" onClick={() => openModal(s)}><Edit2 size={16}/></button>
                                            <button className="btn-icon-sm" onClick={() => handleDelete(s.id)} style={{color:'red'}}><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                )) : packages.map(p => {
                                    const linkedService = services.find(s => s.id === p.service_id);
                                    return (
                                        <tr key={p.id}>
                                            <td>#{p.id}</td>
                                            <td>
                                                <strong>{p.title}</strong>
                                                {p.highlight && <span style={{marginLeft:6, fontSize:'0.7rem'}} className="tag-pill">⭐ Destaque</span>}
                                            </td>
                                            <td>
                                                {formatCurrency(Number(p.price))} 
                                                {p.original_price && Number(p.original_price) > Number(p.price) && <small style={{textDecoration:'line-through', color:'#999', marginLeft:4}}>{formatCurrency(Number(p.original_price))}</small>}
                                            </td>
                                            <td>
                                                {p.bath_count}x 
                                                {linkedService && <span style={{display:'inline-block', marginLeft:6, fontSize:'0.75rem', color:'var(--primary)', fontWeight:600}}>{linkedService.name}</span>}
                                            </td>
                                            <td>{p.active ? <span className="status-badge tag-confirmed">Ativo</span> : <span className="status-badge tag-cancelled">Inativo</span>}</td>
                                            <td style={{textAlign:'right'}}>
                                                <button className="btn-icon-sm" onClick={() => openModal(p)}><Edit2 size={16}/></button>
                                                <button className="btn-icon-sm" onClick={() => handleDelete(p.id)} style={{color:'red'}}><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {((tab === 'services' && services.length === 0) || (tab === 'packages' && packages.length === 0)) && (
                            <div style={{padding:24, textAlign:'center', color:'#999'}}>Nenhum item cadastrado.</div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal CRUD */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingId ? 'Editar' : 'Novo'} {tab === 'services' ? 'Serviço' : 'Pacote'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="btn-icon-sm"><X size={20}/></button>
                        </div>
                        <div className="wizard-body" style={{padding: '20px'}}>
                            <form onSubmit={handleSave}>
                                {tab === 'services' ? (
                                    <>
                                        <div className="form-group">
                                            <label>Nome do Serviço</label>
                                            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Descrição</label>
                                            <textarea className="input-lg" style={{padding:12}} rows={2} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                                        </div>
                                        <div style={{display:'flex', gap:10}}>
                                            <div className="form-group full-width">
                                                <label>Preço (R$)</label>
                                                <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                                            </div>
                                            <div className="form-group full-width">
                                                <label>Duração (min)</label>
                                                <input required type="number" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="form-group" style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}} onClick={() => setFormData({...formData, active: !formData.active})}>
                                            {formData.active ? <CheckSquare color="var(--primary)"/> : <Square color="#ccc"/>}
                                            <label style={{margin:0, cursor:'pointer'}}>Serviço Ativo (Visível no App)</label>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-group">
                                            <label>Título do Pacote</label>
                                            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                        </div>

                                        {/* SMART SERVICE SELECTION */}
                                        <div className="form-group">
                                            <label>Tipo de Serviço Vinculado</label>
                                            <select 
                                                className="input-lg"
                                                value={formData.service_id || ''} 
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setFormData({...formData, service_id: val === '' ? null : val === 'NEW' ? 'NEW' : Number(val)});
                                                }}
                                            >
                                                <option value="">Selecione um serviço...</option>
                                                {services.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>
                                                ))}
                                                <option value="NEW" style={{fontWeight:'bold', color:'var(--primary)'}}>+ Criar Novo Serviço</option>
                                            </select>
                                        </div>

                                        {/* CREATE NEW SERVICE INPUT (CONDITIONAL) */}
                                        {formData.service_id === 'NEW' && (
                                            <div className="form-group fade-in-up" style={{background:'#F3E5F5', padding:12, borderRadius:12}}>
                                                <label style={{color:'var(--primary)'}}>Nome do Novo Serviço</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="Ex: Banho Premium Plus" 
                                                    value={newServiceName} 
                                                    onChange={e => setNewServiceName(e.target.value)}
                                                    autoFocus
                                                />
                                                <small style={{display:'block', marginTop:4, color:'#666'}}>
                                                    O serviço será criado com preço R$ 0,00 e 30min de duração. Edite-o depois na aba Serviços.
                                                </small>
                                            </div>
                                        )}

                                        <div style={{display:'flex', gap:10}}>
                                            <div className="form-group full-width">
                                                <label>Preço Final (R$)</label>
                                                <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                                            </div>
                                            <div className="form-group full-width">
                                                <label>Preço Original (R$)</label>
                                                <input type="number" step="0.01" value={formData.original_price || ''} onChange={e => setFormData({...formData, original_price: e.target.value})} />
                                            </div>
                                        </div>
                                        <div style={{display:'flex', gap:10}}>
                                            <div className="form-group full-width">
                                                <label>Qtd. Banhos</label>
                                                <input required type="number" value={formData.bath_count} onChange={e => setFormData({...formData, bath_count: e.target.value})} />
                                            </div>
                                            <div className="form-group full-width">
                                                <label>Cor do Tema (Hex)</label>
                                                <input type="color" style={{height:44, padding:4}} value={formData.color_theme && formData.color_theme.startsWith('#') ? formData.color_theme : '#9B59B6'} onChange={e => setFormData({...formData, color_theme: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Benefícios (Um por linha)</label>
                                            <textarea className="input-lg" style={{padding:12, height: 100}} value={formData.features || ''} onChange={e => setFormData({...formData, features: e.target.value})} placeholder="Ex: Banho Premium&#10;Tosa Higiênica&#10;Taxi Dog" />
                                        </div>
                                        
                                        <div style={{display:'flex', gap:20, marginTop:10}}>
                                            <div className="form-group" style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}} onClick={() => setFormData({...formData, highlight: !formData.highlight})}>
                                                {formData.highlight ? <CheckSquare color="var(--primary)"/> : <Square color="#ccc"/>}
                                                <label style={{margin:0, cursor:'pointer'}}>Destaque (Mais Popular)</label>
                                            </div>
                                            
                                            <div className="form-group" style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}} onClick={() => setFormData({...formData, active: !formData.active})}>
                                                {formData.active ? <CheckSquare color="var(--primary)"/> : <Square color="#ccc"/>}
                                                <label style={{margin:0, cursor:'pointer'}}>Ativo</label>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <button type="submit" className="btn btn-primary full-width mt-4">
                                    Salvar Dados
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
