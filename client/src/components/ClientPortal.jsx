import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';

const ClientPortal = () => {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = '/login';
        return;
      }

      setUser(currentUser);
      const snapshot = await getDocs(query(
        collection(db, 'appointments'),
        where('patientUid', '==', currentUser.uid),
      ));

      setAppointments(snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-lavender text-blush">Cargando...</div>;
  }

  return (
    <main className="min-h-screen bg-white px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-6 md:flex-row md:items-center">
          <div>
            <a href="/" className="text-sm font-black uppercase tracking-[0.18em] text-blush">SmileFlow</a>
            <h1 className="mt-2 text-4xl font-black text-gray-950">Portal del paciente</h1>
            <p className="mt-2 text-gray-600">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut(auth).then(() => { window.location.href = '/'; })}
            className="rounded-full border border-gray-200 px-5 py-3 text-sm font-black text-gray-700 transition hover:border-blush hover:text-blush"
          >
            Salir
          </button>
        </header>

        <section className="mt-8">
          <h2 className="text-2xl font-black text-gray-950">Historial de citas</h2>
          {appointments.length ? (
            <div className="mt-4 grid gap-4">
              {appointments.map((appointment) => (
                <article key={appointment.id} className="rounded-2xl border border-gray-200 p-5">
                  <p className="text-lg font-black text-gray-950">{appointment.serviceTitle || 'Cita dental'}</p>
                  <p className="mt-2 text-gray-600">{appointment.date} {appointment.time}</p>
                  <p className="mt-2 text-sm font-bold text-blush">{appointment.status || 'pending'}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-blush/40 bg-lavender/40 p-6">
              <p className="font-bold text-gray-800">Aun no hay citas vinculadas a tu cuenta.</p>
              <p className="mt-2 text-sm text-gray-600">Cuando el consultorio confirme una cita con tu perfil, aparecera aqui.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default ClientPortal;
