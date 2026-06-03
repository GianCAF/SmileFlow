import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

async function getProfile(user) {
  const snapshot = await getDoc(doc(db, 'users', user.uid));

  if (snapshot.exists()) {
    return snapshot.data();
  }

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
  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        return;
      }

      setLoading(true);
      try {
        const profile = await getProfile(user);
        window.location.href = profile.role === 'admin' ? '/dashboard' : '/portal';
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

  const login = async (event) => {
    event.preventDefault();
    setStatus('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
    } catch (error) {
      setStatus(error.message);
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-lavender px-6">
      <form onSubmit={login} className="w-full max-w-md rounded-[1.75rem] bg-white p-8 shadow-2xl shadow-blush/20">
        <a href="/" className="text-sm font-black uppercase tracking-[0.18em] text-blush">SmileFlow</a>
        <h1 className="mt-2 text-3xl font-black text-gray-950">Acceso</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Ingresa para validar tu informacion. Si eres admin, iremos al dashboard; si eres paciente, veras tu portal.
        </p>

        <label className="mt-6 block">
          <span className="text-sm font-bold text-gray-700">Correo</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            required
            className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blush focus:ring-4 focus:ring-blush/10"
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
            className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blush focus:ring-4 focus:ring-blush/10"
          />
        </label>

        {status ? <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{status}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-blush px-6 py-4 text-sm font-black text-white transition hover:bg-dark-blush disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? 'Validando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
};

export default LoginPage;
