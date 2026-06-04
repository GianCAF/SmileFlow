import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, authPersistenceReady, db } from '../firebase';

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

const statusLabels = {
  pending: 'pendiente',
  confirmed: 'agendada',
  realizada: 'realizada',
  no_llego: 'no llego',
  completed: 'realizada',
  no_show: 'no llego',
};

function buildInitialAvailability() {
  return days.reduce((acc, day) => {
    acc[day.key] = { ...defaultAvailability };
    return acc;
  }, {});
}

function toDateInput(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function addDays(date, daysToAdd) {
  const next = new Date(date);
  next.setDate(next.getDate() + daysToAdd);
  return next;
}

function buildTodayRange() {
  const today = new Date();
  const date = toDateInput(today);
  return { startDate: date, endDate: date };
}

function getAppointmentDate(appointment) {
  if (appointment.startsAt?.toDate) {
    return appointment.startsAt.toDate();
  }

  return new Date(`${appointment.date || ''}T${appointment.time || '00:00'}:00`);
}

function sortAppointmentsByCurrentTime(appointments) {
  const now = Date.now();

  return [...appointments].sort((a, b) => {
    const aDate = getAppointmentDate(a);
    const bDate = getAppointmentDate(b);
    const aTime = Number.isNaN(aDate.getTime()) ? 0 : aDate.getTime();
    const bTime = Number.isNaN(bDate.getTime()) ? 0 : bDate.getTime();

    return Math.abs(aTime - now) - Math.abs(bTime - now);
  });
}

async function getUserRole(uid) {
  const snapshot = await getDoc(doc(db, 'users', uid));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data().role || null;
}

async function fetchAppointmentsForRange(range) {
  const snapshot = await getDocs(query(
    collection(db, 'appointments'),
    where('date', '>=', range.startDate),
    where('date', '<=', range.endDate),
  ));

  const items = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));

  return sortAppointmentsByCurrentTime(items);
}

const DentistDashboard = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('consultas');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [availability, setAvailability] = useState(buildInitialAvailability);
  const [selectedDayKey, setSelectedDayKey] = useState(null);
  const [dateRange, setDateRange] = useState(buildTodayRange);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const appointmentSummary = useMemo(() => ({
    total: appointments.length,
    realizadas: appointments.filter((item) => item.status === 'realizada' || item.status === 'completed').length,
    noLlegaron: appointments.filter((item) => item.status === 'no_llego' || item.status === 'no_show').length,
  }), [appointments]);

  const loadAppointments = async (range = dateRange, roleValue = role) => {
    if (roleValue !== 'admin') return;

    setAppointmentsLoading(true);
    try {
      setAppointments(await fetchAppointmentsForRange(range));
    } catch (error) {
      setStatus(error.message);
    } finally {
      setAppointmentsLoading(false);
    }
  };

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
          const todayRange = buildTodayRange();
          setDateRange(todayRange);
          setAppointmentsLoading(true);
          try {
            setAppointments(await fetchAppointmentsForRange(todayRange));
          } catch (error) {
            setStatus(error.message);
          } finally {
            setAppointmentsLoading(false);
          }
        }

        setLoading(false);
      }

      setAuthReady(true);
    });
  }, []);

  const selectedDay = days.find((day) => day.key === selectedDayKey) || null;
  const selectedAvailability = selectedDay ? availability[selectedDay.key] || defaultAvailability : null;

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

  const updateRangeField = (event) => {
    const nextRange = {
      ...dateRange,
      [event.target.name]: event.target.value,
    };

    setDateRange(nextRange);
    loadAppointments(nextRange);
  };

  const setPresetRange = (preset) => {
    const today = new Date();
    const ranges = {
      today: { startDate: toDateInput(today), endDate: toDateInput(today) },
      yesterday: { startDate: toDateInput(addDays(today, -1)), endDate: toDateInput(addDays(today, -1)) },
      lastWeek: { startDate: toDateInput(addDays(today, -7)), endDate: toDateInput(today) },
      lastMonth: { startDate: toDateInput(addDays(today, -30)), endDate: toDateInput(today) },
      nextWeek: { startDate: toDateInput(today), endDate: toDateInput(addDays(today, 7)) },
    };

    const nextRange = ranges[preset] || ranges.today;
    setDateRange(nextRange);
    loadAppointments(nextRange);
  };

  const login = async (event) => {
    event.preventDefault();
    setStatus('');
    setLoading(true);

    try {
      await authPersistenceReady;
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

  const updateAppointmentStatus = async (appointmentId, nextStatus) => {
    setUpdatingAppointmentId(appointmentId);
    setStatus('');

    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: nextStatus,
        attendedAt: nextStatus === 'realizada' ? serverTimestamp() : null,
        noShowAt: nextStatus === 'no_llego' ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });

      setAppointments((current) => current.map((appointment) => (
        appointment.id === appointmentId ? { ...appointment, status: nextStatus } : appointment
      )));
      setStatus('Consulta actualizada.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setUpdatingAppointmentId(null);
    }
  };

  if (!authReady) {
    return <div className="grid min-h-screen place-items-center bg-beige text-blush">Cargando...</div>;
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-beige px-6">
        <form onSubmit={login} className="w-full max-w-md rounded-[1.75rem] bg-cream p-8 shadow-2xl shadow-blush/20">
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
              className="mt-2 w-full rounded-2xl border border-beige bg-white px-4 py-3 outline-none focus:border-blush focus:ring-4 focus:ring-blush/10"
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
              className="mt-2 w-full rounded-2xl border border-beige bg-white px-4 py-3 outline-none focus:border-blush focus:ring-4 focus:ring-blush/10"
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
      <main className="grid min-h-screen place-items-center bg-beige px-6">
        <section className="w-full max-w-lg rounded-[1.75rem] bg-cream p-8 text-center shadow-2xl shadow-blush/20">
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
    <main className="min-h-screen bg-cream px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col justify-between gap-4 border-b border-beige pb-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blush">SmileFlow</p>
            <h1 className="mt-2 text-4xl font-black text-gray-950">
              {activeTab === 'consultas' ? 'Consultas' : 'Horarios de atencion'}
            </h1>
            <p className="mt-2 text-gray-600">
              {activeTab === 'consultas'
                ? 'Consulta la agenda por rango de fechas y registra si el paciente llego.'
                : 'Selecciona un dia para editar su disponibilidad.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut(auth)}
            className="rounded-full border border-beige bg-white px-5 py-3 text-sm font-black text-gray-700 transition hover:border-blush hover:text-blush"
          >
            Salir
          </button>
        </header>

        <div className="mt-6 inline-grid grid-cols-2 rounded-full bg-white p-1 shadow-sm shadow-blush/10">
          <button
            type="button"
            onClick={() => setActiveTab('consultas')}
            className={`rounded-full px-5 py-2 text-sm font-black transition ${activeTab === 'consultas' ? 'bg-blush text-white' : 'text-gray-600 hover:text-blush'}`}
          >
            Consultas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('horarios')}
            className={`rounded-full px-5 py-2 text-sm font-black transition ${activeTab === 'horarios' ? 'bg-blush text-white' : 'text-gray-600 hover:text-blush'}`}
          >
            Horarios
          </button>
        </div>

        {status ? <p className="mt-6 rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{status}</p> : null}

        {activeTab === 'consultas' ? (
          <section className="mt-8">
            <div className="grid gap-4 rounded-[1.25rem] border border-beige bg-white/70 p-5 shadow-xl shadow-blush/5 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700">Dia de inicio</span>
                  <input
                    type="date"
                    name="startDate"
                    value={dateRange.startDate}
                    onChange={updateRangeField}
                    className="mt-2 w-full rounded-2xl border border-beige bg-cream px-4 py-3 outline-none focus:border-blush"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-700">Dia de fin</span>
                  <input
                    type="date"
                    name="endDate"
                    value={dateRange.endDate}
                    onChange={updateRangeField}
                    className="mt-2 w-full rounded-2xl border border-beige bg-cream px-4 py-3 outline-none focus:border-blush"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setPresetRange('today')} className="rounded-full bg-cream px-4 py-2 text-xs font-black text-gray-700 transition hover:bg-soft-rose">Hoy</button>
                <button type="button" onClick={() => setPresetRange('yesterday')} className="rounded-full bg-cream px-4 py-2 text-xs font-black text-gray-700 transition hover:bg-soft-rose">Ayer</button>
                <button type="button" onClick={() => setPresetRange('lastWeek')} className="rounded-full bg-cream px-4 py-2 text-xs font-black text-gray-700 transition hover:bg-soft-rose">Ultima semana</button>
                <button type="button" onClick={() => setPresetRange('lastMonth')} className="rounded-full bg-cream px-4 py-2 text-xs font-black text-gray-700 transition hover:bg-soft-rose">Ultimo mes</button>
                <button type="button" onClick={() => setPresetRange('nextWeek')} className="rounded-full bg-cream px-4 py-2 text-xs font-black text-gray-700 transition hover:bg-soft-rose">Siguiente semana</button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-beige bg-white p-4">
                <p className="text-sm font-bold text-gray-500">Consultas</p>
                <p className="mt-1 text-3xl font-black text-gray-950">{appointmentSummary.total}</p>
              </div>
              <div className="rounded-2xl border border-beige bg-white p-4">
                <p className="text-sm font-bold text-gray-500">Realizadas</p>
                <p className="mt-1 text-3xl font-black text-green-700">{appointmentSummary.realizadas}</p>
              </div>
              <div className="rounded-2xl border border-beige bg-white p-4">
                <p className="text-sm font-bold text-gray-500">No llegaron</p>
                <p className="mt-1 text-3xl font-black text-red-700">{appointmentSummary.noLlegaron}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {appointmentsLoading ? (
                <div className="rounded-2xl border border-beige bg-white p-6 text-sm font-bold text-gray-600">Cargando consultas...</div>
              ) : appointments.length ? appointments.map((appointment) => {
                const isUpdating = updatingAppointmentId === appointment.id;
                const label = statusLabels[appointment.status] || appointment.status || 'pendiente';

                return (
                  <article key={appointment.id} className="rounded-2xl border border-beige bg-white p-5 shadow-lg shadow-blush/5">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-black text-gray-950">{appointment.name || 'Paciente sin nombre'}</p>
                          <span className="rounded-full bg-soft-rose px-3 py-1 text-xs font-black text-blush">{label}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-gray-600">
                          {appointment.serviceTitle || 'Consulta dental'} - {appointment.date} - {appointment.time}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {appointment.email || appointment.phone || 'Sin contacto registrado'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateAppointmentStatus(appointment.id, 'realizada')}
                          disabled={isUpdating}
                          className="rounded-full bg-green-600 px-4 py-2 text-xs font-black text-white transition hover:bg-green-700 disabled:opacity-60"
                        >
                          Realizada
                        </button>
                        <button
                          type="button"
                          onClick={() => updateAppointmentStatus(appointment.id, 'no_llego')}
                          disabled={isUpdating}
                          className="rounded-full bg-red-600 px-4 py-2 text-xs font-black text-white transition hover:bg-red-700 disabled:opacity-60"
                        >
                          No llego
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }) : (
                <div className="rounded-2xl border border-dashed border-blush/40 bg-soft-rose/35 p-6">
                  <p className="font-bold text-gray-800">No hay consultas en este rango.</p>
                  <p className="mt-2 text-sm text-gray-600">Cambia las fechas o usa un filtro rapido para revisar otra ventana.</p>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
            <aside className="space-y-3">
              {days.map((day) => {
                const item = availability[day.key] || defaultAvailability;
                const isSelected = selectedDayKey === day.key;

                return (
                  <button
                    type="button"
                    key={day.key}
                    onClick={() => setSelectedDayKey(day.key)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-blush bg-soft-rose shadow-lg shadow-blush/10'
                        : 'border-beige bg-white hover:border-blush/50 hover:bg-soft-rose/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-black text-gray-950">{day.name}</h2>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${
                        item.enabled ? 'bg-white text-blush' : 'bg-beige text-gray-500'
                      }`}>
                        {item.enabled ? 'Activo' : 'Cerrado'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-gray-600">
                      {item.enabled ? `${item.startTime} - ${item.endTime}` : 'Sin horario de atencion'}
                    </p>
                  </button>
                );
              })}
            </aside>

            <section className="min-h-[520px] rounded-[1.75rem] border border-beige bg-white/55 p-6 shadow-2xl shadow-blush/10">
              {selectedDay && selectedAvailability ? (
                <div>
                  <div className="border-b border-beige pb-5">
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-blush">Editar dia</p>
                    <h2 className="mt-2 text-3xl font-black text-gray-950">{selectedDay.name}</h2>
                    <p className="mt-2 text-sm text-gray-600">Los cambios impactan la disponibilidad que consulta el chatbot.</p>
                  </div>

                  <div className="mt-6 space-y-5">
                    <label className="flex items-center justify-between gap-4 rounded-2xl border border-beige bg-cream px-4 py-4 text-sm font-bold text-gray-700">
                      Atiende este dia
                      <input
                        type="checkbox"
                        checked={Boolean(selectedAvailability.enabled)}
                        onChange={(event) => updateAvailability(selectedDay.key, 'enabled', event.target.checked)}
                        className="h-5 w-5 accent-blush"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-bold text-gray-700">Inicio</span>
                        <input
                          type="time"
                          value={selectedAvailability.startTime}
                          onChange={(event) => updateAvailability(selectedDay.key, 'startTime', event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-beige bg-cream px-4 py-3 outline-none focus:border-blush"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-bold text-gray-700">Fin</span>
                        <input
                          type="time"
                          value={selectedAvailability.endTime}
                          onChange={(event) => updateAvailability(selectedDay.key, 'endTime', event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-beige bg-cream px-4 py-3 outline-none focus:border-blush"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-sm font-bold text-gray-700">Duracion de cada cita en minutos</span>
                      <input
                        type="number"
                        min="15"
                        step="15"
                        value={selectedAvailability.slotMinutes}
                        onChange={(event) => updateAvailability(selectedDay.key, 'slotMinutes', event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-beige bg-cream px-4 py-3 outline-none focus:border-blush"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => saveDay(selectedDay)}
                      disabled={loading}
                      className="w-full rounded-full bg-blush px-5 py-4 text-sm font-black text-white transition hover:bg-dark-blush disabled:opacity-70"
                    >
                      Guardar {selectedDay.name}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid min-h-[460px] place-items-center rounded-[1.25rem] border border-dashed border-beige bg-cream/35 text-center">
                  <div className="max-w-sm px-6">
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-blush">Sin seleccion</p>
                    <h2 className="mt-2 text-2xl font-black text-gray-950">Elige un dia</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      Este panel permanece fijo para editar el horario del dia que selecciones en la lista izquierda.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </section>
        )}
      </div>
    </main>
  );
};

export default DentistDashboard;
