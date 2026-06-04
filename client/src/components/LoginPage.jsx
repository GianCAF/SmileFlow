import { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, authPersistenceReady, db } from '../firebase';

const UserIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" />
    <path d="M4.5 20c1.2-4 4-6 7.5-6s6.3 2 7.5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CloseIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

async function getProfile(user) {
  const snapshot = await getDoc(doc(db, 'users', user.uid));

  if (snapshot.exists()) return snapshot.data();

  const profile = {
    displayName: user.displayName || '',
    email: user.email,
    phone: user.phoneNumber || '',
    role: 'client',
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', user.uid), profile);
  return profile;
}

const LoginPage = () => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      setLoading(true);
      try {
        const profile = await getProfile(user);
        window.location.href = profile.role === 'admin' ? '/dashboard' : '/';
      } catch (error) {
        setStatus(error.message);
        await signOut(auth);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus('');
    setLoading(true);

    try {
      await authPersistenceReady;

      if (mode === 'register') {
        const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);

        if (form.name) {
          await updateProfile(credential.user, { displayName: form.name });
        }

        await setDoc(doc(db, 'users', credential.user.uid), {
          displayName: form.name,
          email: form.email,
          phone: form.phone,
          role: 'client',
          createdAt: serverTimestamp(),
        });
        window.location.href = '/';
        return;
      }

      await signInWithEmailAndPassword(auth, form.email, form.password);
    } catch (error) {
      setStatus(error.message);
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-warm px-6">
      <form onSubmit={submit} className="relative w-full max-w-md rounded-[1.75rem] bg-cream p-8 shadow-2xl shadow-dark-blush/10">
        <a
          href="/"
          aria-label="Volver al inicio"
          className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white text-dark-blush shadow-sm shadow-dark-blush/10 transition hover:bg-soft-rose"
        >
          <CloseIcon />
        </a>
        <a href="/" className="text-sm font-black uppercase tracking-[0.18em] text-blush">SmileFlow</a>
        <h1 className="mt-2 text-3xl font-black text-gray-950">{mode === 'login' ? 'Acceso' : 'Registro cliente'}</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          {mode === 'login'
            ? 'Ingresa para mantener tu sesion activa y volver al inicio con tus accesos de paciente.'
            : 'Crea tu cuenta para agendar desde el chat y consultar tu historial cuando lo necesites.'}
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-full bg-white p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-full px-4 py-2 text-sm font-black transition ${mode === 'login' ? 'bg-blush text-white' : 'text-gray-600 hover:text-blush'}`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`rounded-full px-4 py-2 text-sm font-black transition ${mode === 'register' ? 'bg-blush text-white' : 'text-gray-600 hover:text-blush'}`}
          >
            Registrarme
          </button>
        </div>

        {mode === 'register' ? (
          <>
            <label className="mt-6 block">
              <span className="text-sm font-bold text-gray-700">Nombre</span>
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                required
                className="mt-2 w-full rounded-2xl border border-beige bg-white px-4 py-3 outline-none focus:border-blush focus:ring-4 focus:ring-blush/10"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-bold text-gray-700">WhatsApp</span>
              <input
                name="phone"
                value={form.phone}
                onChange={updateField}
                inputMode="tel"
                className="mt-2 w-full rounded-2xl border border-beige bg-white px-4 py-3 outline-none focus:border-blush focus:ring-4 focus:ring-blush/10"
              />
            </label>
          </>
        ) : null}

        <label className={`${mode === 'register' ? 'mt-4' : 'mt-6'} block`}>
          <span className="text-sm font-bold text-gray-700">Correo</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            required
            className="mt-2 w-full rounded-2xl border border-beige bg-white px-4 py-3 outline-none focus:border-blush focus:ring-4 focus:ring-blush/10"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-bold text-gray-700">Contrasena</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            required
            minLength={6}
            className="mt-2 w-full rounded-2xl border border-beige bg-white px-4 py-3 outline-none focus:border-blush focus:ring-4 focus:ring-blush/10"
          />
        </label>

        {status ? <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{status}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-blush px-6 py-4 text-sm font-black text-white transition hover:bg-dark-blush disabled:cursor-wait disabled:opacity-70"
        >
          <UserIcon />
          {loading ? 'Validando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>
    </main>
  );
};

export default LoginPage;
