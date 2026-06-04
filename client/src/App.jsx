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

      <section id="inicio" className="overflow-hidden bg-warm">
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
            <div className="absolute inset-0 rounded-[2rem] bg-cream/70" />
            <img
              src={heroImage}
              alt="Paciente sonriendo en consultorio dental"
              className="relative h-[420px] w-full rounded-[2rem] object-cover shadow-2xl shadow-dark-blush/20"
            />
          </div>
        </div>
      </section>

      <main>
        <Services />
        <section id="contacto" className="bg-warm px-6 py-16 text-gray-950">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-black">Listos para recibir pacientes</h2>
              <p className="mt-2 max-w-xl text-gray-600">
                El formulario ya envia reservas al servidor local y queda preparado para confirmar por WhatsApp.
              </p>
            </div>
            <a
              href="#servicios"
              className="rounded-full bg-white px-6 py-3 text-sm font-black text-gray-950 shadow-lg shadow-dark-blush/10 transition hover:bg-soft-rose"
            >
              Agendar ahora
            </a>
          </div>
        </section>
      </main>

      <footer className="bg-cream py-10 text-center text-sm text-gray-500">
        &copy; 2026 SmileFlow - Consultorio Dental Digital
      </footer>
      <WebChatbot />
    </div>
  );
}

export default App;
