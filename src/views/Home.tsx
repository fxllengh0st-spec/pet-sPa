
import React from 'react';
import { Sparkles, Scissors, Droplet, Heart, HeartHandshake, Crown, CalendarCheck } from 'lucide-react';
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
          <div className="hero-badge fade-in-up">
              <Sparkles size={12} /> Cuidado Premium
          </div>
          <h1 className="fade-in-up delay-1">
            Seu pet merece <br />
            <span className="text-gradient">um dia de rei!</span>
          </h1>
          <p className="fade-in-up delay-2">
            Banho, tosa e spa com tecnologia e muito carinho. Agende em segundos pelo app.
          </p>
          <div className="hero-actions fade-in-up delay-3">
            <button className="btn btn-white hero-btn shadow-float" onClick={() => session ? onOpenBooking() : onNavigate('login')}>
                <CalendarCheck size={18} /> Agendar Agora
            </button>
            <button className="btn btn-ghost hero-btn-outline" onClick={onOpenChat}>
               <Sparkles size={18} style={{ marginRight: 8 }} /> Assistente IA
            </button>
          </div>
        </div>

        {/* Imagem responsiva do mascote */}
        <div className="hero-img-container fade-in-slide delay-2">
            <img 
                src={`${BASE_STORAGE_URL}/random.png`} 
                alt="Pet Feliz" 
                className="hero-pets-img"
            />
            {/* Elementos flutuantes decorativos */}
            <div className="floating-bubble bubble-1">🛁 Banho Quentinho</div>
            <div className="floating-bubble bubble-2">✂️ Tosa Estilosa</div>
        </div>
      </header>
      
      <div className="container home-content-offset">
         <div className="section-header-row reveal-on-scroll">
             <h2 className="section-title" style={{marginTop:0}}>Nossos Serviços</h2>
             <button className="btn-text-action" onClick={() => onNavigate('services')}>Ver Todos</button>
         </div>
         
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
                  overflow: 'hidden',
                  padding: '24px 32px'
              }}
         >
             <div style={{position:'relative', zIndex:2}}>
                 <div style={{display:'flex', alignItems:'center', gap: 8, marginBottom: 8}}>
                    <div style={{background:'rgba(255,255,255,0.2)', padding:6, borderRadius:8}}>
                        <Crown size={20} fill="#FDCB6E" color="#FDCB6E" />
                    </div>
                    <span style={{fontWeight: 800, textTransform:'uppercase', fontSize:'0.85rem', letterSpacing:'0.05em', color:'rgba(255,255,255,0.9)'}}>Clube VIP</span>
                 </div>
                 <h3 style={{color:'white', margin:0, fontSize:'1.6rem', lineHeight:1.1}}>Assinatura Mensal</h3>
                 <p style={{color:'rgba(255,255,255,0.9)', margin:'4px 0 0 0'}}>Economize até 30% nos banhos.</p>
             </div>
             <div style={{background: 'white', color: '#00B894', padding: '12px 24px', borderRadius: 30, fontWeight: 800, whiteSpace:'nowrap', zIndex:2, boxShadow:'0 4px 15px rgba(0,0,0,0.1)'}}>
                 Ver Planos
             </div>
             
             {/* Background Shapes */}
             <div style={{position:'absolute', right: -20, bottom: -40, width: 180, height: 180, borderRadius:'50%', background:'rgba(255,255,255,0.1)'}}></div>
             <div style={{position:'absolute', left: -20, top: -40, width: 100, height: 100, borderRadius:'50%', background:'rgba(255,255,255,0.05)'}}></div>
         </div>
         
         <div className="features-section mt-4">
             <h2 className="section-title reveal-on-scroll">Por que a PetSpa?</h2>
             <div className="features-grid">
                <div className="feature-item feature-green reveal-on-scroll">
                    <div className="feature-text-content">
                        <h3>Profissionais</h3>
                        <p>Equipe treinada para todos os temperamentos.</p>
                    </div>
                    <div className="feature-img-wrapper">
                        <img src={`${BASE_STORAGE_URL}/homepage4.png`} alt="Profissionais" className="feature-png" />
                    </div>
                </div>

                <div className="feature-item feature-red reveal-on-scroll delay-1">
                     <div className="feature-text-content">
                        <h3>Segurança</h3>
                        <p>Monitoramento e higienização hospitalar.</p>
                    </div>
                    <div className="feature-img-wrapper">
                        <img src={`${BASE_STORAGE_URL}/amb.png`} alt="Ambiente" className="feature-png" />
                    </div>
                </div>

                <div className="feature-item feature-blue reveal-on-scroll delay-2">
                     <div className="feature-text-content">
                        <h3>Muito Amor</h3>
                        <p>Produtos hipoalergênicos e tratamento VIP.</p>
                    </div>
                    <div className="feature-img-wrapper">
                        <img src={`${BASE_STORAGE_URL}/random.png`} alt="Amor" className="feature-png" />
                    </div>
                </div>
             </div>
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
      </div>
    </div>
);
