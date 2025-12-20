
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { api } from './services/api';
import { Profile, Appointment, Pet, Service, Route, LoginStage, Subscription } from './types';
import { Chat } from './components/Chat';
import { AboutUs } from './components/AboutUs';
import { AdminPanel } from './components/Admin';
import { Logo } from './components/Logo';
import { Marketplace } from './components/Marketplace';
import { useToast } from './context/ToastContext';
import { Home, User, HeartHandshake, Sparkles, PlusCircle, Moon, Sun } from 'lucide-react';

// Modules
import { LoginFlowOverlay } from './components/LoginFlowOverlay';
import { MascotCompanion } from './components/MascotCompanion';
import { BookingWizard } from './components/BookingWizard';
import { PetWizard } from './components/PetWizard'; 
import { ActiveTrackingCard } from './components/ActiveTrackingCard';

// Views
import { HomePage } from './views/Home';
import { ServicesPage } from './views/Services';
import { PackagesView } from './views/Packages';
import { LoginPage, RegisterPage } from './views/Login';
import { Dashboard } from './views/Dashboard';
import { PetDetailsView, AppointmentDetailsView } from './views/Details';

export default function App() {
  const [view, setView] = useState<Route>('home');
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('petspa-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Data State
  const [pets, setPets] = useState<Pet[]>([]);
  const [apps, setApps] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  // Selection State
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Modal States
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPetWizard, setShowPetWizard] = useState(false);
  
  // NEW: Chat State (Widget Mode)
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Login Flow State
  const [loginStage, setLoginStage] = useState<LoginStage>('idle');
  const [mascotMessage, setMascotMessage] = useState<string>('');
  const [showMascotBubble, setShowMascotBubble] = useState(false);

  const toast = useToast();

  // Apply Theme Effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('petspa-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Initial Load Logic
  useEffect(() => {
    const initApp = async () => {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
            setSession(existingSession);
            // Sequencial para garantir que o Dashboard tenha tudo
            await loadProfile(existingSession.user.id);
            await loadUserData(existingSession.user.id);
        }
    };
    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
         if (loginStage === 'idle') {
             await loadProfile(session.user.id);
             await loadUserData(session.user.id);
         }
      } else { 
          setProfile(null); 
          setPets([]); setApps([]); setSubscriptions([]);
          if (view !== 'register' && view !== 'login') setView('home'); 
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (uid: string) => {
    try {
      const p = await api.auth.getUserProfile(uid);
      setProfile(p);
    } catch (e) { console.error("Erro perfil:", e); }
  };

  const loadUserData = async (uid: string) => {
      setIsLoadingData(true);
      try {
         const [p, a, s, subs] = await Promise.all([
             api.booking.getMyPets(uid),
             api.booking.getMyAppointments(uid),
             api.booking.getServices(),
             api.packages.getMySubscriptions(uid)
         ]);
         setPets(p || []);
         setApps(a || []);
         setServices(s || []);
         setSubscriptions(subs || []);
         return { pets: p, apps: a, subscriptions: subs };
      } catch (e) { 
          console.error("Erro carregamento dados:", e); 
          return { pets: [], apps: [], subscriptions: [] }; 
      } finally {
          setIsLoadingData(false);
      }
  };

  const handleLogout = async () => {
    await api.auth.signOut();
    setLoginStage('idle');
    toast.info('Até logo! 👋');
    setView('home');
    setIsChatOpen(false);
  };

  const navigateTo = (v: Route) => {
      setView(v);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleChat = () => setIsChatOpen(!isChatOpen);

  return (
    <div className={isChatOpen ? 'mode-chat-open' : ''}>
       
       <LoginFlowOverlay 
          loginStage={loginStage}
          setLoginStage={setLoginStage}
          session={session}
          onComplete={(hasPets) => { 
              setLoginStage('idle'); 
              navigateTo('dashboard');
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
          onOpenChat={toggleChat}
       />

       {/* MOBILE TOP BAR */}
       <div className="mobile-top-bar">
          <Logo height={44} onClick={() => navigateTo('home')} />
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
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
          
          <button className={`nav-item-mobile fab ${isChatOpen ? 'active' : ''}`} onClick={toggleChat}>
             <Sparkles size={24} fill={isChatOpen ? 'currentColor' : 'none'} />
          </button>
          
          <button className={`nav-item-mobile ${view === 'packages' ? 'active' : ''}`} onClick={() => navigateTo('packages')}>
             <PlusCircle size={24} strokeWidth={view === 'packages' ? 2.5 : 2} />
             <span>Planos</span>
          </button>

          {session ? (
             <button className={`nav-item-mobile ${view === 'dashboard' || view === 'user-profile' ? 'active' : ''}`} onClick={() => navigateTo('dashboard')}>
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
          <div style={{display:'flex', alignItems:'center', gap: 20}}>
              <Logo height={36} onClick={() => navigateTo('home')} />
              <ActiveTrackingCard 
                 appointments={apps} 
                 onNavigate={navigateTo} 
                 setSelectedAppointment={setSelectedAppointment} 
                 variant="header" 
              />
          </div>

          <nav className="nav-links-desktop">
             <a href="#" className={`nav-link-item ${view === 'home' && 'active'}`} onClick={() => navigateTo('home')}>Início</a>
             <a href="#" className={`nav-link-item ${view === 'services' && 'active'}`} onClick={() => navigateTo('services')}>Serviços</a>
             <a href="#" className={`nav-link-item ${view === 'packages' && 'active'}`} onClick={() => navigateTo('packages')}>Clube VIP</a>
             <a href="#" className={`nav-link-item ${view === 'market' && 'active'}`} onClick={() => navigateTo('market')}>Adoção</a>
             
             <button className="nav-link-item theme-icon-desktop" onClick={toggleTheme} title="Trocar Tema">
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
             </button>

             <a href="#" className={`nav-link-item nav-link-cta ${isChatOpen && 'active'}`} onClick={toggleChat}>Assistente IA</a>
             {session ? (
               <>
                 <a href="#" className={`btn btn-primary btn-sm ${(view === 'dashboard' || view === 'user-profile') && 'active'}`} onClick={() => navigateTo('dashboard')}>Minha Conta</a>
                 {profile?.role === 'admin' && <a href="#" className="nav-link-item" onClick={() => navigateTo('admin')}>Admin</a>}
                 <a href="#" className="logout-link" onClick={handleLogout} style={{marginLeft: 20}}>Sair</a>
               </>
             ) : (
               <a href="#" className="btn btn-secondary btn-sm" onClick={() => navigateTo('login')}>Entrar / Cadastrar</a>
             )}
          </nav>
       </header>

       <main id="app">
          {view === 'home' && <HomePage session={session} onNavigate={navigateTo} onOpenBooking={() => setShowBookingModal(true)} onOpenChat={toggleChat} />}
          {view === 'services' && <ServicesPage services={services} onNavigate={navigateTo} onOpenBooking={() => setShowBookingModal(true)} session={session} />}
          {view === 'packages' && <PackagesView onNavigate={navigateTo} session={session} />}
          {view === 'market' && <Marketplace onNavigate={navigateTo} />}
          {view === 'login' && <LoginPage onNavigate={navigateTo} setLoginStage={setLoginStage} />}
          {view === 'register' && <RegisterPage onNavigate={navigateTo} setLoginStage={setLoginStage} />}
          
          {isChatOpen && (
              <Chat 
                  onClose={() => setIsChatOpen(false)}
                  onNavigate={(r) => { setIsChatOpen(false); navigateTo(r as Route); }} 
                  onActionSuccess={() => { if(session) loadUserData(session.user.id); }} 
              />
          )}
          
          {view === 'about' && <AboutUs onNavigate={navigateTo} />}
          
          {(view === 'dashboard' || view === 'user-profile') && (
            <Dashboard 
                profile={profile} 
                pets={pets} 
                apps={apps} 
                subscriptions={subscriptions}
                onNavigate={navigateTo} 
                setSelectedPet={setSelectedPet} 
                setSelectedAppointment={setSelectedAppointment} 
                onOpenBooking={() => setShowBookingModal(true)}
                onAddPet={() => setShowPetWizard(true)}
            />
          )}
          
          {view === 'admin' && <AdminPanel />}
          {view === 'pet-details' && <PetDetailsView selectedPet={selectedPet} apps={apps} subscriptions={subscriptions} onNavigate={navigateTo} setSelectedAppointment={setSelectedAppointment} />}
          {view === 'appointment-details' && <AppointmentDetailsView selectedAppointment={selectedAppointment} onNavigate={navigateTo} />}
       </main>
    </div>
  );
}
