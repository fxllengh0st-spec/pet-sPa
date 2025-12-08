
import React from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import { Profile, Pet, Route } from '../types';
import { useToast } from '../context/ToastContext';
import { getAvatarUrl, getPetAvatarUrl } from '../utils/ui';

interface UserProfileProps {
    profile: Profile | null;
    session: any;
    pets: Pet[];
    apps: any[];
    onNavigate: (route: Route) => void;
    setSelectedPet: (pet: Pet) => void;
}

export const UserProfileView: React.FC<UserProfileProps> = ({ 
    profile, 
    session, 
    pets, 
    apps, 
    onNavigate, 
    setSelectedPet 
}) => {
    const toast = useToast();
    
    return (
    <div className="container page-enter" style={{ paddingTop: 20 }}>
       <div className="nav-header">
           <button className="btn-icon-sm" onClick={() => onNavigate('dashboard')}><ChevronLeft /></button>
           <h3>Meu Perfil</h3>
           <div style={{width: 44}}></div>
       </div>

       <div className="profile-header reveal-on-scroll">
           <div className="profile-avatar">
              <img 
                src={getAvatarUrl(profile?.full_name || 'User')} 
                alt="Avatar" 
                style={{width:'100%', height:'100%', objectFit:'cover'}} 
              />
           </div>
           <div>
               <h2 style={{color:'white', marginBottom:4}}>{profile?.full_name}</h2>
               <p style={{color:'rgba(255,255,255,0.8)', margin:0}}>{session?.user.email}</p>
               <span className="status-badge" style={{background:'rgba(255,255,255,0.2)', color:'white', marginTop:8}}>
                  {profile?.role === 'admin' ? 'Administrador' : 'Cliente Vip'}
               </span>
           </div>
       </div>

       <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}} className="reveal-on-scroll">
            <h3>Meus Pets</h3>
            <button className="btn-icon-sm" style={{width:32, height:32}} onClick={() => toast.info('Funcionalidade de cadastro em desenvolvimento 🏗️')}><Plus size={16}/></button>
       </div>
       
       {pets.length === 0 ? <p>Nenhum pet cadastrado.</p> : (
         <div className="pet-grid">
           {pets.map(p => (
              <div key={p.id} className="card pet-card clickable-card reveal-on-scroll" onClick={() => { setSelectedPet(p); onNavigate('pet-details'); }}>
                 <img src={getPetAvatarUrl(p.name)} className="pet-avatar-3d" alt={p.name} />
                 <strong>{p.name}</strong>
                 <span className="pet-breed">{p.breed || 'SRD'}</span>
              </div>
           ))}
         </div>
       )}
       
       <div className="card reveal-on-scroll" style={{marginTop: 24}}>
          <h3 style={{marginBottom:16}}>Estatísticas</h3>
          <div className="stat-grid">
              <div className="stat-card">
                 <div className="stat-value">{apps.length}</div>
                 <div className="stat-label">Banhos Realizados</div>
              </div>
              <div className="stat-card">
                 <div className="stat-value">{pets.length}</div>
                 <div className="stat-label">Pets Amados</div>
              </div>
          </div>
       </div>
    </div>
  );
};
