import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const days = [
  { key: '0', name: 'Domingo' },
  { key: '1', name: 'Lunes' },
  { key: '2', name: 'Martes' },
  { key: '3', name: 'Miercoles' },
  { key: '4', name: 'Jueves' },
  { key: '5', name: 'Viernes' },
  { key: '6', name: 'Sabado' },
];

const defaultAvailability = {
  enabled: false,
  startTime: '11:00',
  endTime: '19:00',
  slotMinutes: 60,
};

function buildInitialAvailability() {
  return days.reduce((acc, day) => {
    acc[day.key] = { ...defaultAvailability };
    return acc;
  }, {});
}

async function getUserRole(uid) {
  const snapshot = await getDoc(doc(db, 'users', uid));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data().role || null;
}

const DentistDashboard = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [availability, setAvailability] = useState(buildInitialAvailability);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setRole(null);
      setStatus('');

      if (currentUser) {
        setLoading(true);
        const currentRole = await getUserRole(currentUser.uid);
        setRole(currentRole);

        if (currentRole === 'admin') {
          const entries = await Promise.all(days.map(async (day) => {
            const snapshot = await getDoc(doc(db, 'clinicAvailability', day.key));
            return [day.key, snapshot.exists() ? snapshot.data() : { ...defaultAvailability }];
          }));

          setAvailability(Object.fromEntries(entries));
        }

        setLoading(false);
      }

      setAuthReady(true);
    });
  }, []);

  const updateLoginField = (event) => {
    setLoginForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const updateAvailability = (dayKey, field, value) => {
    setAvailability((current) => ({
      ...current,
      [dayKey]: {
        ...current[dayKey],
        [field]: value,
      },
    }));
  };

  const login = async (event) => {
    event.preventDefault();
    setStatus('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveDay = async (day) => {
    setStatus('');
    setLoading(true);

    try {
      if (role !== 'admin') {
        throw new Error('Tu usuario no tiene permisos de administrador.');
      }

      const dayAvailability = availability[day.key];
      await setDoc(doc(db, 'clinicAvailability', day.key), {
        dayKey: day.key,
        dayName: day.name,
        enabled: Boolean(dayAvailability.enabled),
        startTime: dayAvailability.startTime,
        endTime: dayAvailability.endTime,
        slotMinutes: Number(dayAvailability.slotMinutes || 60),
        updatedAt: serverTimestamp(),
      });
      setStatus(`${day.name} guardado.`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!authReady) {
    return <div className="grid min-h-screen place-items-center bg-lavender text-blush">Cargando...</div>;
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-lavender px-6">
        <form onSubmit={login} className="w-full max-w-md rounded-[1.75rem] bg-white p-8 shadow-2xl shadow-blush/20">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blush">SmileFlow</p>
          <h1 className="mt-2 text-3xl font-black text-gray-950">Dashboard dentista</h1>
          <label className="mt-6 block">
            <span className="text-sm font-bold text-gray-700">Correo</span>
            <input
              name="email"
              type="email"
              value={loginForm.email}
              onChange={updateLoginField}
              required
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blush focus:ring-4 focus:ring-blush/10"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-sm font-bold text-gray-700">Contrasena</span>
            <input
              name="password"
              type="password"
              value={loginForm.password}
              onChange={updateLoginField}
              required
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blush focus:ring-4 focus:ring-blush/10"
            />
          </label>
          {status ? <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{status}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-blush px-6 py-4 text-sm font-black text-white transition hover:bg-dark-blush disabled:opacity-70"
          >
            Entrar
          </button>
        </form>
      </main>
    );
  }

  if (role !== 'admin') {
    return (
      <main className="grid min-h-screen place-items-center bg-lavender px-6">
        <section className="w-full max-w-lg rounded-[1.75rem] bg-white p-8 text-center shadow-2xl shadow-blush/20">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blush">SmileFlow</p>
          <h1 className="mt-2 text-3xl font-black text-gray-950">Sin permisos de admin</h1>
          <p className="mt-4 text-gray-600">
            Este usuario existe, pero no tiene rol admin en Firestore. Crea o actualiza el documento users/{user.uid} con role admin.
          </p>
          <button
            type="button"
            onClick={() => signOut(auth)}
            className="mt-6 rounded-full bg-blush px-6 py-3 text-sm font-black text-white transition hover:bg-dark-blush"
          >
            Salir
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blush">SmileFlow</p>
            <h1 className="mt-2 text-4xl font-black text-gray-950">Horarios de atencion</h1>
          </div>
          <button
            type="button"
            onClick={() => signOut(auth)}
            className="rounded-full border border-gray-200 px-5 py-3 text-sm font-black text-gray-700 transition hover:border-blush hover:text-blush"
          >
            Salir
          </button>
        </header>

        {status ? <p className="mt-6 rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{status}</p> : null}

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          {days.map((day) => {
            const item = availability[day.key] || defaultAvailability;

            return (
              <article key={day.key} className="rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-black text-gray-950">{day.name}</h2>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-600">
                    <input
                      type="checkbox"
                      checked={Boolean(item.enabled)}
                      onChange={(event) => updateAvailability(day.key, 'enabled', event.target.checked)}
                      className="h-5 w-5 accent-blush"
                    />
                    Atiende
                  </label>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-sm font-bold text-gray-700">Inicio</span>
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(event) => updateAvailability(day.key, 'startTime', event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blush"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-gray-700">Fin</span>
                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(event) => updateAvailability(day.key, 'endTime', event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blush"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-gray-700">Minutos</span>
                    <input
                      type="number"
                      min="15"
                      step="15"
                      value={item.slotMinutes}
                      onChange={(event) => updateAvailability(day.key, 'slotMinutes', event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blush"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => saveDay(day)}
                  disabled={loading}
                  className="mt-5 rounded-full bg-blush px-5 py-3 text-sm font-black text-white transition hover:bg-dark-blush disabled:opacity-70"
                >
                  Guardar {day.name}
                </button>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
};

export default DentistDashboard;
