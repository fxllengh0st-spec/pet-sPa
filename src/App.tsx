
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { api } from './services/api';
import { Profile, Appointment, Pet, Service, Route, LoginStage } from './types';
import { Chat } from './components/Chat';
import { AboutUs } from './components/AboutUs';
import { AdminPanel } from './components/Admin';
import { Logo } from './components/Logo';
import { Marketplace } from './components/Marketplace';
import { useToast } from './context/ToastContext';
import { Home, MessageCircle, User, HeartHandshake, Sparkles, PlusCircle } from 'lucide-react';

// Modules
import { LoginFlowOverlay } from './components/LoginFlowOverlay';
import { MascotCompanion } from './components/MascotCompanion';
import { BookingWizard } from './components/BookingWizard';
import { PetWizard } from './components/PetWizard'; 

// Views
import { HomePage } from './views/Home';
import { ServicesPage } from './views/Services';
import { PackagesView } from './views/Packages';
import { LoginPage, RegisterPage } from './views/Login';
import { Dashboard } from './views/Dashboard';
import { UserProfileView } from './views/Profile';
import { PetDetailsView, AppointmentDetailsView } from './views/Details';

const MASCOT_COMMENTS: Partial<Record<Route, string[]>> = {
    'home': ['Pronto para um dia de spa? 🛁', 'Seu pet merece o melhor!', 'Toque em Agendar para começar!'],
    'services': ['O Banho Premium é divino! ✨', 'Temos hidratação com cheirinho de morango 🍓'],
    'packages': ['Economia inteligente! 💰', 'Seu pet limpo o mês todo.'],
    'market': ['Adotar é um ato de amor! ❤️', 'Ajude quem precisa 🐾'],
    'dashboard': ['Sua agenda organizada 📅', 'Não esqueça dos compromissos!'],
    'user-profile': ['Que perfil chique! 💅', 'Seus pets são lindos!']
};

export default function App() {
  const [view, setView] = useState<Route>('home');
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // Data State
  const [pets, setPets] = useState<Pet[]>([]);
  const [apps, setApps] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Selection State
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Modal States
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPetWizard, setShowPetWizard] = useState(false);

  // Login Flow State
  const [loginStage, setLoginStage] = useState<LoginStage>('idle');
  const [mascotMessage, setMascotMessage] = useState<string>('');
  const [showMascotBubble, setShowMascotBubble] = useState(false);

  const toast = useToast();

  // Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [view, pets, apps]);

  // Body class manager for Chat Mode
  useEffect(() => {
    if (view === 'chat') {
        document.body.classList.add('mode-chat');
    } else {
        document.body.classList.remove('mode-chat');
    }
  }, [view]);

  // Initial Load Logic
  useEffect(() => {
    const initApp = async () => {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
            setSession(existingSession);
            loadProfile(existingSession.user.id);
            loadUserData(existingSession.user.id);
        }
    };
    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
         if (loginStage === 'idle' && !profile) {
             loadProfile(session.user.id);
             loadUserData(session.user.id);
         }
      } else { 
          setProfile(null); 
          setPets([]); setApps([]); 
          if (view !== 'register' && view !== 'login') setView('home'); 
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (uid: string) => {
    try {
      const p = await api.auth.getUserProfile(uid);
      setProfile(p);
    } catch (e) { console.error(e); }
  };

  const loadUserData = async (uid: string) => {
      try {
         const [p, a, s] = await Promise.all([
             api.booking.getMyPets(uid),
             api.booking.getMyAppointments(uid),
             api.booking.getServices()
         ]);
         setPets(p);
         setApps(a);
         setServices(s);
         return { pets: p, apps: a };
      } catch (e) { console.error(e); return { pets: [], apps: [] }; }
  };

  const handleLogout = async () => {
    await api.auth.signOut();
    setLoginStage('idle');
    toast.info('Até logo! 👋');
    setView('home');
  };

  const navigateTo = (v: Route) => {
      setView(v);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={view === 'chat' ? 'mode-chat' : ''}>
       
       <LoginFlowOverlay 
          loginStage={loginStage}
          setLoginStage={setLoginStage}
          session={session}
          onComplete={(hasPets) => { 
              setLoginStage('idle'); 
              navigateTo('user-profile');
              // Se não tiver pets, abre o wizard automaticamente
              if (!hasPets) {
                  setTimeout(() => {
                      setShowPetWizard(true);
                      toast.info("Vamos cadastrar seu primeiro pet! 🐾");
                  }, 600);
              }
          }}
          loadUserData={loadUserData}
          loadProfile={loadProfile}
       />

       {showBookingModal && (
         <BookingWizard 
            onClose={() => setShowBookingModal(false)}
            session={session}
            pets={pets}
            services={services}
            navigateTo={navigateTo}
            onSuccess={async () => { await loadUserData(session.user.id); }}
         />
       )}

       {showPetWizard && (
         <PetWizard 
            onClose={() => setShowPetWizard(false)}
            session={session}
            onSuccess={async () => { await loadUserData(session.user.id); }}
         />
       )}
       
       <MascotCompanion 
          showBookingModal={showBookingModal}
          view={view}
          loginStage={loginStage}
          session={session}
          mascotMessage={mascotMessage}
          showMascotBubble={showMascotBubble}
          setShowMascotBubble={setShowMascotBubble}
          onTriggerBooking={() => setShowBookingModal(true)}
          onTriggerLogin={() => navigateTo('login')}
       />

       {/* MOBILE TOP BAR (Logo Only) */}
       <div className="mobile-top-bar">
          <Logo height={44} onClick={() => navigateTo('home')} />
       </div>

       {/* MOBILE BOTTOM NAV */}
       <nav className="mobile-bottom-nav">
          <button className={`nav-item-mobile ${view === 'home' ? 'active' : ''}`} onClick={() => navigateTo('home')}>
             <Home size={24} strokeWidth={view === 'home' ? 2.5 : 2} />
             <span>Início</span>
          </button>
          
          <button className={`nav-item-mobile ${view === 'market' ? 'active' : ''}`} onClick={() => navigateTo('market')}>
             <HeartHandshake size={24} strokeWidth={view === 'market' ? 2.5 : 2} />
             <span>Ajudar</span>
          </button>
          
          {/* FAB Central Button */}
          <button className={`nav-item-mobile fab ${view === 'chat' ? 'active' : ''}`} onClick={() => navigateTo('chat')}>
             <Sparkles size={24} fill={view === 'chat' ? 'currentColor' : 'none'} />
          </button>
          
          <button className={`nav-item-mobile ${view === 'packages' ? 'active' : ''}`} onClick={() => navigateTo('packages')}>
             <PlusCircle size={24} strokeWidth={view === 'packages' ? 2.5 : 2} />
             <span>Planos</span>
          </button>

          {session ? (
             <button className={`nav-item-mobile ${view === 'dashboard' ? 'active' : ''}`} onClick={() => navigateTo('dashboard')}>
                <User size={24} strokeWidth={view === 'dashboard' ? 2.5 : 2} />
                <span>Perfil</span>
             </button>
          ) : (
             <button className={`nav-item-mobile ${view === 'login' ? 'active' : ''}`} onClick={() => navigateTo('login')}>
                <User size={24} strokeWidth={view === 'login' ? 2.5 : 2} />
                <span>Entrar</span>
             </button>
          )}
       </nav>

       {/* DESKTOP NAV */}
       <header className="desktop-nav">
          <Logo height={36} onClick={() => navigateTo('home')} />
          <nav className="nav-links-desktop">
             <a href="#" className={`nav-link-item ${view === 'home' && 'active'}`} onClick={() => navigateTo('home')}>Início</a>
             <a href="#" className={`nav-link-item ${view === 'services' && 'active'}`} onClick={() => navigateTo('services')}>Serviços</a>
             <a href="#" className={`nav-link-item ${view === 'packages' && 'active'}`} onClick={() => navigateTo('packages')}>Clube VIP</a>
             <a href="#" className={`nav-link-item ${view === 'market' && 'active'}`} onClick={() => navigateTo('market')}>Adoção</a>
             <a href="#" className={`nav-link-item nav-link-cta ${view === 'chat' && 'active'}`} onClick={() => navigateTo('chat')}>Assistente IA</a>
             {session ? (
               <>
                 <a href="#" className="btn btn-primary btn-sm" onClick={() => navigateTo('dashboard')}>Minha Conta</a>
                 {profile?.role === 'admin' && <a href="#" className="nav-link-item" onClick={() => navigateTo('admin')}>Admin</a>}
                 <a href="#" className="logout-link" onClick={handleLogout} style={{marginLeft: 20}}>Sair</a>
               </>
             ) : (
               <a href="#" className="btn btn-secondary btn-sm" onClick={() => navigateTo('login')}>Entrar / Cadastrar</a>
             )}
          </nav>
       </header>

       <main id="app">
          {view === 'home' && <HomePage session={session} onNavigate={navigateTo} onOpenBooking={() => setShowBookingModal(true)} />}
          {view === 'services' && <ServicesPage services={services} onNavigate={navigateTo} onOpenBooking={() => setShowBookingModal(true)} session={session} />}
          {view === 'packages' && <PackagesView onNavigate={navigateTo} session={session} />}
          {view === 'market' && <Marketplace onNavigate={navigateTo} />}
          {view === 'login' && <LoginPage onNavigate={navigateTo} setLoginStage={setLoginStage} />}
          {view === 'register' && <RegisterPage onNavigate={navigateTo} setLoginStage={setLoginStage} />}
          
          {/* Chat with State Sync capability */}
          {view === 'chat' && (
              <Chat 
                  onNavigate={(r) => navigateTo(r as Route)} 
                  onActionSuccess={() => { if(session) loadUserData(session.user.id); }} 
              />
          )}
          
          {view === 'about' && <AboutUs onNavigate={navigateTo} />}
          {view === 'dashboard' && <Dashboard profile={profile} pets={pets} apps={apps} onNavigate={navigateTo} setSelectedPet={setSelectedPet} setSelectedAppointment={setSelectedAppointment} onOpenBooking={() => setShowBookingModal(true)} />}
          {view === 'admin' && <AdminPanel />}
          {view === 'user-profile' && <UserProfileView profile={profile} session={session} pets={pets} apps={apps} onNavigate={navigateTo} setSelectedPet={setSelectedPet} onAddPet={() => setShowPetWizard(true)} />}
          {view === 'pet-details' && <PetDetailsView selectedPet={selectedPet} apps={apps} onNavigate={navigateTo} setSelectedAppointment={setSelectedAppointment} />}
          {view === 'appointment-details' && <AppointmentDetailsView selectedAppointment={selectedAppointment} onNavigate={navigateTo} />}
       </main>
    </div>
  );
}