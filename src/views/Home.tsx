

import React from 'react';
import { Sparkles, Scissors, Droplet, Heart, ShoppingBag } from 'lucide-react';
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
      <header 
        className="hero-header reveal-on-scroll"
        style={{ 
            /* Adicionada máscara escura (linear-gradient preto transparente) sobre o gradiente laranja */
            background: `
                linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 100%), 
                linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)
            `,
            position: 'relative',
            overflow: 'hidden'
        }}
      >
        <div className="hero-content">
          {/* Adicionado text-shadow mais forte para contraste */}
          <h1 className="fade-in-up" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
            Seu pet limpo,<br />feliz e saudável!
          </h1>
          <p className="fade-in-up delay-1" style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
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

        {/* Imagem decorativa na direita - Tamanho Reduzido pela metade */}
        <img 
            src={`${BASE_STORAGE_URL}/random.png`} 
            alt="Pet Feliz" 
            className="fade-in-slide delay-2"
            style={{
                position: 'absolute',
                right: '2%',
                bottom: 0,
                height: '12vh', /* Reduzido de 25vh para 12vh */
                maxHeight: '120px', /* Limite máximo em pixels */
                zIndex: 1,
                objectFit: 'contain',
                pointerEvents: 'none',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))'
            }}
        />
      </header>
      
      {/* Ajustado marginTop de -40px para -15px para abaixar o título 'Nossos Serviços' */}
      <div className="container" style={{ marginTop: '-15px', position: 'relative', zIndex: 20 }}>
         <h2 className="section-title reveal-on-scroll" style={{ marginTop: 0, marginBottom: 20 }}>Nossos Serviços</h2>
         
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
         
         {/* Features Section - Organic PNG Images */}
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
            <div className="promo-content" style={{maxWidth: '65%'}}>
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
