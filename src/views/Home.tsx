
import React from 'react';
import { Sparkles, Scissors, Droplet, Heart, HeartHandshake, Crown, Star } from 'lucide-react';
import { Route } from '../types';
import { getAvatarUrl } from '../utils/ui';

const BASE_STORAGE_URL = 'https://vfryefavzurwoiuznkwv.supabase.co/storage/v1/object/public/site-assets';

interface HomePageProps {
    session: any;
    onNavigate: (route: Route) => void;
    onOpenBooking: () => void;
    onOpenChat: () => void; // New prop for modal toggle
}

export const HomePage: React.FC<HomePageProps> = ({ session, onNavigate, onOpenBooking, onOpenChat }) => (
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
            <button className="btn btn-ghost hero-btn-outline" onClick={onOpenChat}>
               <Sparkles size={18} style={{ marginRight: 8 }} /> Assistente IA
            </button>
          </div>
        </div>

        {/* Imagem responsiva do mascote */}
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
                    <div className="service-icon-float"><HeartHandshake size={18}/></div>
                    <h4>Adoção & Ajuda</h4>
                </div>
            </div>
            <div className="service-img-card reveal-on-scroll delay-3" onClick={() => onNavigate('about')} style={{backgroundImage: `url(${BASE_STORAGE_URL}/5.jpg)`}}>
                <div className="service-overlay">
                    <div className="service-icon-float"><Heart size={18}/></div>
                    <h4>Sobre Nós</h4>
                </div>
            </div>
         </div>

         {/* Banner de Pacotes Refinado */}
         <div className="card clickable-card reveal-on-scroll" 
              onClick={() => onNavigate('packages')}
              style={{
                  background: 'linear-gradient(135deg, #00B894 0%, #00CEC9 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 40,
                  marginTop: 20,
                  border: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '32px'
              }}
         >
             <div style={{position:'relative', zIndex:2}}>
                 <div style={{display:'flex', alignItems:'center', gap: 8, marginBottom: 8}}>
                    <Crown size={24} fill="#FDCB6E" color="#FDCB6E" />
                    <span style={{fontWeight: 800, textTransform:'uppercase', fontSize:'0.85rem', letterSpacing:'0.05em', color:'#FDCB6E'}}>Clube VIP</span>
                 </div>
                 <h3 style={{color:'white', margin:0, fontSize:'1.6rem'}}>Assinatura PetSpa</h3>
                 <p style={{color:'rgba(255,255,255,0.9)', margin:0, fontSize: '1rem'}}>Economize até 30% em todos os banhos!</p>
             </div>
             <div className="btn btn-white" style={{zIndex:2, padding: '0 32px'}}>
                 Ver Planos
             </div>
             <div style={{position:'absolute', right: -20, bottom: -40, width: 160, height: 160, borderRadius:'50%', background:'rgba(255,255,255,0.1)'}}></div>
         </div>
         
         <section className="features-section" style={{marginTop: '60px'}}>
             <h2 className="section-title reveal-on-scroll">Por que a PetSpa?</h2>
             <div className="features-grid">
                <div className="feature-item feature-green reveal-on-scroll">
                    <div className="feature-text-content">
                        <h3>Profissionais</h3>
                        <p>Equipe certificada e apaixonada por cada pet.</p>
                    </div>
                    <div className="feature-img-wrapper">
                        <img src={`${BASE_STORAGE_URL}/homepage4.png`} alt="Profissionais" className="feature-png" />
                    </div>
                </div>

                <div className="feature-item feature-red reveal-on-scroll delay-1">
                     <div className="feature-text-content">
                        <h3>Segurança</h3>
                        <p>Monitoramento e esterilização de padrão hospitalar.</p>
                    </div>
                    <div className="feature-img-wrapper">
                        <img src={`${BASE_STORAGE_URL}/amb.png`} alt="Ambiente" className="feature-png" />
                    </div>
                </div>

                <div className="feature-item feature-blue reveal-on-scroll delay-2">
                     <div className="feature-text-content">
                        <h3>Puro Carinho</h3>
                        <p>Produtos hipoalergênicos para peles sensíveis.</p>
                    </div>
                    <div className="feature-img-wrapper">
                        <img src={`${BASE_STORAGE_URL}/random.png`} alt="Amor" className="feature-png" />
                    </div>
                </div>
             </div>
         </section>

         {/* Social Proof Gallery Refined */}
         <section className="social-proof-section" style={{marginTop: '60px'}}>
            <h2 className="section-title reveal-on-scroll">Galeria da Fofura</h2>
            <div className="gallery-container reveal-on-scroll">
                <div className="gallery-scroll">
                    {[1, 2, 4, 5, 6].map((num) => (
                        <img 
                            key={num}
                            src={`${BASE_STORAGE_URL}/${num}.jpg`} 
                            alt={`Cliente Feliz ${num}`} 
                            className="gallery-item-home"
                        />
                    ))}
                </div>
            </div>
         </section>

         {/* Testimonials Refined */}
         <section className="testimonials-section" style={{marginTop: '60px', marginBottom: '60px'}}>
            <h2 className="section-title reveal-on-scroll">Quem ama, recomenda</h2>
            <div className="testimonials-scroll reveal-on-scroll">
                <div className="testimonial-card">
                    <p className="testimonial-text">"A Mel nunca voltou tão cheirosa! O atendimento é impecável e a equipe é extremamente atenciosa."</p>
                    <div className="user-profile-row">
                         <img src={getAvatarUrl("Mariana Silva")} className="testimonial-avatar" alt="Mariana Silva" />
                         <div className="testimonial-user-info">
                            <strong>Mariana Silva</strong>
                            <div className="stars-row">
                                <Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" />
                            </div>
                         </div>
                    </div>
                </div>
                <div className="testimonial-card">
                    <p className="testimonial-text">"Adoro a facilidade de agendar pelo app. Super prático e os profissionais são muito cuidadosos."</p>
                    <div className="user-profile-row">
                         <img src={getAvatarUrl("Roberto Costa")} className="testimonial-avatar" alt="Roberto Costa" />
                         <div className="testimonial-user-info">
                            <strong>Roberto Costa</strong>
                            <div className="stars-row">
                                <Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" />
                            </div>
                         </div>
                    </div>
                </div>
                <div className="testimonial-card">
                    <p className="testimonial-text">"Confio de olhos fechados. Trataram meu Thor como se fosse da família. O melhor spa da cidade!"</p>
                    <div className="user-profile-row">
                         <img src={getAvatarUrl("Julia Santos")} className="testimonial-avatar" alt="Julia Santos" />
                         <div className="testimonial-user-info">
                            <strong>Julia Santos</strong>
                            <div className="stars-row">
                                <Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" />
                            </div>
                         </div>
                    </div>
                </div>
            </div>
         </section>
      </div>
    </div>
);
