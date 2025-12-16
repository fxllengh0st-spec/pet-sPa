
import React from 'react';
import { Route } from '../types';
import { HeartHandshake, ChevronLeft, ExternalLink, Heart, MapPin, Info } from 'lucide-react';

// Dados Mockados de ONGs e Pets para Adoção
const NGOS = [
    {
        id: 1,
        name: 'Ampara Animal',
        description: 'A maior organização de proteção animal do Brasil. Lutamos contra o abandono e maus-tratos.',
        image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=400&q=80',
        link: 'https://amparanimal.org.br/doe/',
        color: '#F1C40F'
    },
    {
        id: 2,
        name: 'Instituto Luísa Mell',
        description: 'Resgate de animais feridos ou em risco, recuperação e adoção. Ajude a manter o abrigo.',
        image: 'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=400&q=80',
        link: 'https://ilm.org.br/',
        color: '#9B59B6'
    }
];

const ADOPTION_PETS = [
    {
        id: 1,
        name: 'Paçoca',
        age: '2 anos',
        breed: 'SRD',
        img: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=400&q=80',
        gender: 'Macho',
        status: 'Disponível'
    },
    {
        id: 2,
        name: 'Luna',
        age: '5 meses',
        breed: 'Siamesa',
        img: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=400&q=80',
        gender: 'Fêmea',
        status: 'Urgente'
    },
    {
        id: 3,
        name: 'Thor',
        age: '4 anos',
        breed: 'Pitbull (Dócil)',
        img: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80',
        gender: 'Macho',
        status: 'Apadrinhar'
    }
];

interface MarketplaceProps {
    onNavigate: (route: Route) => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ onNavigate }) => {
  return (
    <div className="container page-enter" style={{ paddingTop: 20 }}>
      {/* Header com Navegação */}
      <div className="nav-header">
         <div style={{display:'flex', alignItems:'center', gap: 10}}>
             <button className="btn-icon-sm" onClick={() => onNavigate('home')}>
                <ChevronLeft size={22} />
             </button>
             <div>
                <h2 style={{margin:0, fontSize:'1.2rem', lineHeight:1}}>Causa Animal</h2>
                <span style={{fontSize:'0.8rem', color:'#666'}}>Ajudar faz bem ao coração ❤️</span>
             </div>
         </div>
      </div>

      {/* Hero Banner Social */}
      <div className="card cta-card-gradient reveal-on-scroll" style={{marginBottom: 32, background: 'linear-gradient(135deg, #FF7675, #fab1a0)'}}>
           <div style={{paddingRight: '30%'}}>
               <h3 style={{color:'white', marginBottom:8}}>Não vendemos produtos,<br/>espalhamos amor.</h3>
               <p style={{color:'rgba(255,255,255,0.95)', fontSize:'0.95rem'}}>
                   A PetSpa apoia a adoção responsável. Conheça nossos parceiros e ajude quem precisa de um lar.
               </p>
           </div>
           {/* Decorative Icon */}
           <div style={{position:'absolute', right: 20, bottom: 20, opacity: 0.2}}>
               <Heart size={80} fill="white" color="white" />
           </div>
      </div>

      <h3 className="section-title reveal-on-scroll">ONGs Parceiras</h3>
      <p className="reveal-on-scroll" style={{marginBottom: 20}}>Doe diretamente pelo site oficial das instituições:</p>
      
      <div className="ngo-grid reveal-on-scroll" style={{display:'grid', gap: 16}}>
          {NGOS.map(ngo => (
              <div key={ngo.id} className="card ngo-card" style={{display:'flex', gap: 16, alignItems:'center', padding: 16}}>
                  <div style={{width: 80, height: 80, borderRadius: 12, overflow:'hidden', flexShrink:0}}>
                      <img src={ngo.image} alt={ngo.name} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                  </div>
                  <div style={{flex:1}}>
                      <h4 style={{margin:0, color: 'var(--secondary)'}}>{ngo.name}</h4>
                      <p style={{fontSize:'0.85rem', margin:'4px 0 12px', lineHeight:1.4}}>{ngo.description}</p>
                      <a 
                        href={ngo.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-sm btn-ghost" 
                        style={{color: 'var(--primary)', borderColor: 'var(--primary)', height: 32, fontSize:'0.8rem'}}
                      >
                          Visitar & Doar <ExternalLink size={14} style={{marginLeft:4}}/>
                      </a>
                  </div>
              </div>
          ))}
      </div>

      <div style={{margin: '40px 0'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 16}}>
              <h3 className="section-title" style={{margin:0}}>Mural de Adoção</h3>
              <span className="tag-pill">3 Pets Próximos</span>
          </div>
          
          <div className="adoption-scroll" style={{display:'flex', gap: 16, overflowX: 'auto', paddingBottom: 16}}>
              {ADOPTION_PETS.map(pet => (
                  <div key={pet.id} className="card adoption-card" style={{minWidth: 200, padding: 0, overflow:'hidden', border:'1px solid rgba(0,0,0,0.05)'}}>
                      <div style={{height: 140, overflow:'hidden', position:'relative'}}>
                          <img src={pet.img} alt={pet.name} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                          <span className={`status-badge ${pet.status === 'Urgente' ? 'tag-cancelled' : 'tag-confirmed'}`} style={{position:'absolute', top: 8, right: 8}}>
                              {pet.status}
                          </span>
                      </div>
                      <div style={{padding: 12}}>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                              <strong style={{fontSize:'1.1rem'}}>{pet.name}</strong>
                              <Heart size={16} color="var(--primary)" />
                          </div>
                          <p style={{fontSize:'0.85rem', color:'#666', margin:'4px 0 8px'}}>{pet.breed} • {pet.age}</p>
                          <div style={{display:'flex', alignItems:'center', gap: 4, fontSize:'0.75rem', color:'#999', marginBottom: 12}}>
                              <MapPin size={12} /> São Paulo, SP
                          </div>
                          <button className="btn btn-primary full-width btn-sm" onClick={() => window.open('https://api.whatsapp.com/send?phone=5511999999999&text=Ola,%20vi%20o%20pet%20' + pet.name + '%20no%20app%20e%20quero%20adotar!', '_blank')}>
                              Quero Adotar
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      <div className="card reveal-on-scroll" style={{background: '#F0F2F5', border:'none', textAlign:'center', padding: 24}}>
          <Info size={32} color="var(--secondary-light)" style={{margin:'0 auto 12px'}} />
          <p style={{fontSize:'0.85rem', color:'#666'}}>
              A PetSpa atua apenas como divulgadora. Todo processo de doação ou adoção é de responsabilidade das ONGs parceiras.
          </p>
      </div>

    </div>
  );
};
