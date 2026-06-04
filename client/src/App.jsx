import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import ClientPortal from './components/ClientPortal';
import DentistDashboard from './components/DentistDashboard';
import LoginPage from './components/LoginPage';
import Services from './components/Services';
import WebChatbot from './components/WebChatbot';
import { auth, db } from './firebase';
import heroImage from './assets/hero.png';

const UserIcon = () => (
  <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" />
    <path d="M4.5 20c1.2-4 4-6 7.5-6s6.3 2 7.5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
    <path d="M5.4 19.2 6.5 16A8 8 0 1 1 9 18.5l-3.6.7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M9.3 8.8c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.3 0 .5-.1.6l-.5.6c.7 1.2 1.6 2.1 2.8 2.7l.7-.6c.2-.1.4-.2.7-.1l1.5.7c.3.1.4.3.4.6v.4c0 .5-.3 1-.7 1.2-.6.3-1.8.4-3.6-.5-2.8-1.3-4.6-4.1-4.8-4.4-.6-.9-.7-1.8-.4-2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

const FacebookIcon = () => (
  <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
    <path d="M14 8.5h2V5h-2.8C10.7 5 9 6.8 9 9.5V12H6v3.5h3V21h3.8v-5.5h3L16.5 12h-3.7V9.7c0-.8.4-1.2 1.2-1.2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

function getDisplayName(user, profile) {
  return profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Paciente';
}

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setProfile(null);

      if (!currentUser) return;

      try {
        const snapshot = await getDoc(doc(db, 'users', currentUser.uid));
        setProfile(snapshot.exists() ? snapshot.data() : null);
      } catch {
        setProfile(null);
      }
    });
  }, []);

  const logout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  if (window.location.pathname.startsWith('/dashboard')) {
    return <DentistDashboard />;
  }

  if (window.location.pathname.startsWith('/login')) {
    return <LoginPage />;
  }

  if (window.location.pathname.startsWith('/portal')) {
    return <ClientPortal />;
  }

  return (
    <div className="min-h-screen bg-cream text-gray-950 selection:bg-soft-rose">
      <header className="sticky top-0 z-40 border-b border-beige bg-cream/92 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#inicio" className="text-xl font-black tracking-normal text-gray-950">
            Smile<span className="text-blush">Flow</span>
          </a>
          <div className="hidden items-center gap-8 text-sm font-semibold text-gray-600 md:flex">
            <a className="hover:text-blush" href="#servicios">Servicios</a>
            <a className="hover:text-blush" href="#agenda">Agenda</a>
            <a className="hover:text-blush" href="#contacto">Contacto</a>
            {user ? <a className="hover:text-blush" href="/portal">Historial</a> : <a className="hover:text-blush" href="/login">Login</a>}
          </div>
          {user ? (
            <div className="flex min-w-0 items-center gap-2">
              <span className="hidden max-w-[150px] truncate text-sm font-black text-gray-800 sm:inline">
                {getDisplayName(user, profile)}
              </span>
              <a
                href="/portal"
                className="rounded-full bg-blush px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-dark-blush/20 transition hover:bg-dark-blush"
              >
                Ver historial
              </a>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-beige bg-white px-4 py-2.5 text-sm font-black text-gray-700 transition hover:border-blush hover:text-blush"
              >
                Salir
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-blush px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-dark-blush/20 transition hover:bg-dark-blush"
            >
              <UserIcon />
              Login
            </a>
          )}
        </nav>
      </header>

      <section
        id="inicio"
        className="overflow-hidden bg-warm"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='220' height='220' viewBox='0 0 220 220' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23eaa0b3' stroke-opacity='.18' stroke-width='2'%3E%3Cpath d='M34 66c28-30 64-30 92 0s64 30 92 0'/%3E%3Cpath d='M-12 150c28-30 64-30 92 0s64 30 92 0'/%3E%3Ccircle cx='168' cy='34' r='18'/%3E%3Ccircle cx='48' cy='190' r='10'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      >
        <div className="mx-auto grid min-h-[620px] max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-20">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-blush">
              Consultorio dental digital
            </p>
            <h1 className="text-5xl font-black leading-[1.03] text-gray-950 md:text-7xl">
              SmileFlow
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Agenda citas en segundos, confirma por WhatsApp y ofrece una experiencia pulida desde el primer contacto.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#servicios"
                className="rounded-full bg-blush px-7 py-4 text-center text-sm font-black text-white shadow-xl shadow-dark-blush/20 transition hover:bg-dark-blush"
              >
                Ver servicios
              </a>
              <a
                href="#contacto"
                className="rounded-full border border-blush/30 bg-cream px-7 py-4 text-center text-sm font-black text-gray-900 transition hover:border-blush hover:bg-white hover:text-blush"
              >
                Hablar por WhatsApp
              </a>
            </div>
          </div>
          <div className="relative min-h-[420px]">
            <div className="absolute inset-0 rounded-[2rem] bg-cream/80" />
            <img
              src={heroImage}
              alt="Paciente sonriendo en consultorio dental"
              className="relative h-[420px] w-full rounded-[2rem] object-cover shadow-2xl shadow-dark-blush/20"
            />
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl bg-white/88 px-4 py-3 shadow-lg shadow-dark-blush/10 backdrop-blur">
              <div>
                <p className="text-xs font-black uppercase text-blush">Agenda digital</p>
                <p className="mt-1 text-sm font-bold text-gray-800">Chat, recordatorios y consultas en un solo flujo</p>
              </div>
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blush" />
                <span className="h-2.5 w-2.5 rounded-full bg-beige" />
                <span className="h-2.5 w-2.5 rounded-full bg-beige" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main>
        <Services />
        <section id="contacto" className="bg-warm px-6 py-14 text-gray-950">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <h2 className="text-2xl font-black">Contacto</h2>
            <div className="flex gap-3">
              <a
                href="#contacto"
                aria-label="WhatsApp"
                className="grid h-12 w-12 place-items-center rounded-full bg-white text-dark-blush shadow-lg shadow-dark-blush/10 transition hover:bg-soft-rose"
              >
                <WhatsAppIcon />
              </a>
              <a
                href="#contacto"
                aria-label="Facebook"
                className="grid h-12 w-12 place-items-center rounded-full bg-white text-dark-blush shadow-lg shadow-dark-blush/10 transition hover:bg-soft-rose"
              >
                <FacebookIcon />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-cream py-10 text-center text-sm text-gray-500">
        <p>&copy; 2026 SmileFlow - Consultorio Dental Digital</p>
        <p className="mt-2 font-bold text-gray-600">Powered by GCAF</p>
      </footer>
      <WebChatbot />
    </div>
  );
}

export default App;
