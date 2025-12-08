import React, { useState } from 'react';
import { api } from '../services/api';
import { Logo } from '../components/Logo';
import { useToast } from '../context/ToastContext';
import { LoginStage, Route } from '../types';
import { UserPlus, LogIn, AlertTriangle, CheckCircle } from 'lucide-react';

interface AuthPageProps {
    onNavigate: (route: Route) => void;
    setLoginStage: (stage: LoginStage) => void;
}

const getErrorMessage = (error: any): string => {
    if (!error) return 'Erro desconhecido.';
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.error_description) return error.error_description;
    return 'Ocorreu um erro ao processar sua solicitação.';
};

export const LoginPage: React.FC<AuthPageProps> = ({ onNavigate, setLoginStage }) => {
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    
    const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault(); 
       setIsSubmitting(true);
       setErrorMsg('');
       
       try { 
         // api.auth.signIn now returns { data, error } instead of throwing
         const { error } = await api.auth.signIn(email, pass); 
         
         if (error) throw error; // Re-throw to catch block

         setLoginStage('welcome');
       } 
       catch (err: any) { 
         console.error(err);
         let msg = getErrorMessage(err);
         
         // Tradução amigável de erros comuns
         if (msg.includes('Invalid login credentials')) msg = 'E-mail ou senha incorretos.';
         
         setErrorMsg(msg);
       } finally { 
         setIsSubmitting(false); 
       }
    };

    return (
      <div className="container auth-container page-enter" style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 100px)'}}>
        <div className="card auth-card reveal-on-scroll" style={{width:'100%', maxWidth:400, textAlign:'center', padding: '40px 32px'}}>
          <div style={{display:'flex', justifyContent:'center', marginBottom:20}}>
            <Logo height={60} />
          </div>
          <h1 className="auth-title" style={{marginBottom: 8}}>Bem-vindo de volta!</h1>
          <p style={{marginBottom: 24, fontSize: '0.9rem'}}>Entre para gerenciar seus pets.</p>
          
          {errorMsg && (
             <div className="auth-error-banner fade-in">
                <AlertTriangle size={18} />
                <span>{errorMsg}</span>
             </div>
          )}

          <form onSubmit={handleSubmit} style={{textAlign:'left'}}>
            <div className="form-group">
                <label>Email</label>
                <input 
                    type="email" 
                    value={email} 
                    onChange={e=>setEmail(e.target.value)} 
                    required 
                    placeholder="seu@email.com"
                    disabled={isSubmitting}
                />
            </div>
            <div className="form-group">
                <label>Senha</label>
                <input 
                    type="password" 
                    value={pass} 
                    onChange={e=>setPass(e.target.value)} 
                    required 
                    placeholder="••••••"
                    disabled={isSubmitting}
                />
            </div>
            
            <button className={`btn btn-primary full-width ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting} style={{marginTop: 10}}>
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="auth-footer" style={{marginTop: 24, paddingTop: 24, borderTop: '1px solid #eee'}}>
            <p style={{marginBottom: 12}}>Ainda não tem conta?</p>
            <button onClick={()=>onNavigate('register')} className="btn btn-ghost full-width" style={{border: '2px solid var(--primary)', color: 'var(--primary)'}}>
               <UserPlus size={18} /> Criar Conta
            </button>
          </div>
        </div>
      </div>
    );
};

export const RegisterPage: React.FC<AuthPageProps> = ({ onNavigate, setLoginStage }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [pass, setPass] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successState, setSuccessState] = useState(false);
    
    const toast = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault(); 
       setIsSubmitting(true);
       setErrorMsg('');

       try { 
         // Call API
         const { data, error } = await api.auth.signUp(email, pass, name, phone);
         
         if (error) throw error;

         if (data.session) {
             // Caso 1: Sessão criada imediatamente (sem confirmação de email)
             setLoginStage('welcome');
         } else if (data.user) {
             // Caso 2: Usuário criado, mas requer confirmação de email
             setSuccessState(true);
             toast.success('Cadastro realizado com sucesso!');
         }
       } 
       catch (err: any) { 
         console.error(err);
         let msg = getErrorMessage(err);
         
         if (msg.includes('already registered')) msg = 'Este e-mail já está em uso.';
         if (msg.includes('Password should be')) msg = 'A senha deve ter pelo menos 6 caracteres.';
         
         setErrorMsg(msg);
       } finally { 
         setIsSubmitting(false); 
       }
    };

    if (successState) {
        return (
            <div className="container auth-container page-enter" style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 100px)'}}>
                <div className="card auth-card reveal-on-scroll" style={{width:'100%', maxWidth:400, textAlign:'center', padding: '40px 32px'}}>
                     <div style={{display:'flex', justifyContent:'center', marginBottom:24}} className="pop-in">
                        <CheckCircle size={80} color="#00B894" />
                     </div>
                     <h2 className="text-center mb-4">Cadastro Realizado!</h2>
                     <p className="text-center text-gray-600 mb-8">
                        Sua conta foi criada com sucesso. <br/>
                        <strong>Verifique seu e-mail</strong> para confirmar o cadastro antes de entrar.
                     </p>
                     <button onClick={()=>onNavigate('login')} className="btn btn-primary full-width">
                        Ir para Login
                     </button>
                </div>
            </div>
        );
    }

    return (
      <div className="container auth-container page-enter" style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 100px)'}}>
        <div className="card auth-card reveal-on-scroll" style={{width:'100%', maxWidth:400, textAlign:'center', padding: '40px 32px'}}>
          <div style={{display:'flex', justifyContent:'center', marginBottom:20}}>
            <Logo height={50} variant="icon" />
          </div>
          <h1 className="auth-title" style={{marginBottom: 8}}>Crie sua conta</h1>
          <p style={{marginBottom: 24, fontSize: '0.9rem'}}>Junte-se à família PetSpa.</p>

          {errorMsg && (
             <div className="auth-error-banner fade-in">
                <AlertTriangle size={18} />
                <span>{errorMsg}</span>
             </div>
          )}
          
          <form onSubmit={handleSubmit} style={{textAlign:'left'}}>
            <div className="form-group">
                <label>Nome Completo</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={e=>setName(e.target.value)} 
                    required 
                    placeholder="João da Silva" 
                    disabled={isSubmitting}
                />
            </div>
            <div className="form-group">
                <label>Email</label>
                <input 
                    type="email" 
                    value={email} 
                    onChange={e=>setEmail(e.target.value)} 
                    required 
                    placeholder="seu@email.com" 
                    disabled={isSubmitting}
                />
            </div>
            <div className="form-group">
                <label>Celular</label>
                <input 
                    type="tel" 
                    value={phone} 
                    onChange={e=>setPhone(e.target.value)} 
                    required 
                    placeholder="(11) 99999-9999" 
                    disabled={isSubmitting}
                />
            </div>
            <div className="form-group">
                <label>Senha</label>
                <input 
                    type="password" 
                    value={pass} 
                    onChange={e=>setPass(e.target.value)} 
                    required 
                    placeholder="••••••" 
                    disabled={isSubmitting}
                />
            </div>
            
            <button className={`btn btn-primary full-width ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting} style={{marginTop: 10}}>
              {isSubmitting ? 'Cadastrando...' : 'Criar Conta Grátis'}
            </button>
          </form>

          <div className="auth-footer" style={{marginTop: 24, paddingTop: 24, borderTop: '1px solid #eee'}}>
            <p style={{marginBottom: 12}}>Já tem cadastro?</p>
            <button onClick={()=>onNavigate('login')} className="btn btn-ghost full-width" style={{border: '2px solid var(--secondary)', color: 'var(--secondary)'}}>
               <LogIn size={18} /> Fazer Login
            </button>
          </div>
        </div>
      </div>
    );
};