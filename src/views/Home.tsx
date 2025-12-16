

import React from 'react';
import { Sparkles, Scissors, Droplet, Heart, ShoppingBag, Crown } from 'lucide-react';
import { Route } from '../types';
import { getAvatarUrl } from '../utils/ui';

// URL base do Bucket ATUALIZADA
const BASE_STORAGE_URL = 'https://vfryefavzurwoiuznkwv.supabase.co/storage/v1/object/public/site-assets';

interface HomePageProps {
    session: any;
    onNavigate: (route: Route) => void;
    onOpenBooking: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ session, onNavigate, onOpenBooking }) => (
    <div className="page-enter">
      <header className="hero-header reveal-on-scroll">
        <div className="hero-content">
          <h1 className="fade-in-up">
            Seu pet limpo,<br />feliz e saudável!
          </h1>
          <p className="fade-in-up delay-1">
            Confiança, carinho e tecnologia. Agendamento inteligente com IA.
          </p>
          <div className="hero-actions fade-in-up delay-2">
            <button className="btn btn-white hero-btn" onClick={() => session ? onOpenBooking() : onNavigate('login')}>
                Agendar Agora
            </button>
            <button className="btn btn-ghost hero-btn-outline" onClick={() => onNavigate('chat')}>
               <Sparkles size={18} style={{ marginRight: 8 }} /> Assistente IA
            </button>
          </div>
        </div>

        {/* Imagem decorativa controlada via CSS class .hero-pets-img */}
        <img 
            src={`${BASE_STORAGE_URL}/random.png`} 
            alt="Pet Feliz" 
            className="hero-pets-img fade-in-slide delay-2"
        />
      </header>
      
      <div className="container home-content-offset">
         <h2 className="section-title reveal-on-scroll">Nossos Serviços</h2>
         
         <div className="services-preview-grid">
            <div className="service-img-card reveal-on-scroll" onClick={() => onNavigate('services')} style={{backgroundImage: `url(${BASE_STORAGE_URL}/1.jpg)`}}>
                <div className="service-overlay">
                    <div className="service-icon-float"><Scissors size={18}/></div>
                    <h4>Banho & Tosa</h4>
                </div>
            </div>
            <div className="service-img-card reveal-on-scroll delay-1" onClick={() => onNavigate('services')} style={{backgroundImage: `url(${BASE_STORAGE_URL}/2.jpg)`}}>
                <div className="service-overlay">
                    <div className="service-icon-float"><Droplet size={18}/></div>
                    <h4>Hidratação</h4>
                </div>
            </div>
            <div className="service-img-card reveal-on-scroll delay-2" onClick={() => onNavigate('market')} style={{backgroundImage: `url(${BASE_STORAGE_URL}/4.jpg)`}}>
                <div className="service-overlay">
                    <div className="service-icon-float"><ShoppingBag size={18}/></div>
                    <h4>Pet Shop</h4>
                </div>
            </div>
            <div className="service-img-card reveal-on-scroll delay-3" onClick={() => onNavigate('about')} style={{backgroundImage: `url(${BASE_STORAGE_URL}/5.jpg)`}}>
                <div className="service-overlay">
                    <div className="service-icon-float"><Heart size={18}/></div>
                    <h4>Sobre Nós</h4>
                </div>
            </div>
         </div>

         {/* NOVO: Banner de Pacotes */}
         <div className="card clickable-card reveal-on-scroll" 
              onClick={() => onNavigate('packages')}
              style={{
                  background: 'linear-gradient(135deg, #00B894 0%, #00CEC9 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 24,
                  border: 'none',
                  position: 'relative',
                  overflow: 'hidden'
              }}
         >
             <div style={{position:'relative', zIndex:2}}>
                 <div style={{display:'flex', alignItems:'center', gap: 8, marginBottom: 8}}>
                    <Crown size={24} fill="#FDCB6E" color="#FDCB6E" />
                    <span style={{fontWeight: 800, textTransform:'uppercase', fontSize:'0.85rem', letterSpacing:'0.05em', color:'#FDCB6E'}}>Clube de Assinatura</span>
                 </div>
                 <h3 style={{color:'white', margin:0, fontSize:'1.4rem'}}>Pacotes de Banho</h3>
                 <p style={{color:'rgba(255,255,255,0.9)', margin:0}}>Economize até 30% e garanta horários VIP.</p>
             </div>
             <div style={{background: 'rgba(255,255,255,0.2)', padding: '10px 16px', borderRadius: 20, fontWeight: 700, whiteSpace:'nowrap', zIndex:2}}>
                 Ver Planos
             </div>
             {/* Decorative Circle */}
             <div style={{position:'absolute', right: -20, bottom: -40, width: 140, height: 140, borderRadius:'50%', background:'rgba(255,255,255,0.1)'}}></div>
         </div>
         
         {/* Features Section */}
         <div className="features-section mt-4">
             <h2 className="section-title reveal-on-scroll">Por que a PetSpa?</h2>
             <div className="features-grid">
                
                {/* Profissionais */}
                <div className="feature-item feature-green reveal-on-scroll">
                    <div className="feature-text-content">
                        <h3>Profissionais Certificados</h3>
                        <p>Equipe treinada para lidar com todos os temperamentos.</p>
                    </div>
                    <div className="feature-img-wrapper">
                        <img src={`${BASE_STORAGE_URL}/homepage4.png`} alt="Profissionais" className="feature-png" />
                    </div>
                </div>

                {/* Ambiente Seguro */}
                <div className="feature-item feature-red reveal-on-scroll delay-1">
                     <div className="feature-text-content">
                        <h3>Ambiente Seguro</h3>
                        <p>Monitoramento e higienização hospitalar constante.</p>
                    </div>
                    <div className="feature-img-wrapper">
                        <img src={`${BASE_STORAGE_URL}/amb.png`} alt="Ambiente" className="feature-png" />
                    </div>
                </div>

                {/* Amor em cada detalhe */}
                <div className="feature-item feature-blue reveal-on-scroll delay-2">
                     <div className="feature-text-content">
                        <h3>Amor em cada detalhe</h3>
                        <p>Produtos hipoalergênicos e tratamento VIP.</p>
                    </div>
                    <div className="feature-img-wrapper">
                        <img src={`${BASE_STORAGE_URL}/random.png`} alt="Amor" className="feature-png" />
                    </div>
                </div>

             </div>
         </div>

         {/* Promo Banner */}
         <div className="promo-banner mt-4 clickable-card reveal-on-scroll" onClick={() => session ? onOpenBooking() : onNavigate('login')}>
            <div className="promo-content">
                <h3>Primeira vez aqui? 🎁</h3>
                <p>Ganhe <strong>10% OFF</strong> no primeiro banho agendando pelo app!</p>
            </div>
            <img src={`${BASE_STORAGE_URL}/bt.webp`} alt="Mascote" className="promo-mascot-img" />
         </div>

         {/* Social Proof Gallery */}
         <div className="social-proof-section mt-4 reveal-on-scroll">
            <h2 className="section-title">Galeria da Fofura</h2>
            <div className="gallery-scroll">
                {[1, 2, 4, 5, 6].map((num) => (
                    <img 
                        key={num}
                        src={`${BASE_STORAGE_URL}/${num}.jpg`} 
                        alt="Cliente Feliz" 
                        className="gallery-item-home"
                    />
                ))}
            </div>
         </div>

         {/* Testimonials */}
         <div className="testimonials-section mt-4 reveal-on-scroll">
            <h2 className="section-title">Quem ama, recomenda</h2>
            <div className="testimonials-scroll">
                <div className="testimonial-card">
                    <div className="user-profile-row mb-2">
                         <img src={getAvatarUrl("Ana P.")} className="avatar-xs" alt="Ana" />
                         <div>
                            <small className="block font-bold text-gray-800 leading-tight">Ana P.</small>
                            <div className="stars text-xs">⭐⭐⭐⭐⭐</div>
                         </div>
                    </div>
                    <p>"A Mel nunca voltou tão cheirosa! O atendimento é impecável."</p>
                </div>
                <div className="testimonial-card">
                     <div className="user-profile-row mb-2">
                         <img src={getAvatarUrl("Carlos M.")} className="avatar-xs" alt="Carlos" />
                         <div>
                            <small className="block font-bold text-gray-800 leading-tight">Carlos M.</small>
                            <div className="stars text-xs">⭐⭐⭐⭐⭐</div>
                         </div>
                    </div>
                    <p>"Adoro a facilidade de agendar pelo app. Super prático!"</p>
                </div>
                <div className="testimonial-card">
                     <div className="user-profile-row mb-2">
                         <img src={getAvatarUrl("Julia S.")} className="avatar-xs" alt="Julia" />
                         <div>
                            <small className="block font-bold text-gray-800 leading-tight">Julia S.</small>
                            <div className="stars text-xs">⭐⭐⭐⭐⭐</div>
                         </div>
                    </div>
                    <p>"Confio de olhos fechados. Trataram meu Thor como rei."</p>
                </div>
            </div>
         </div>
      </div>
    </div>
);
