import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const initialForm = {
  name: '',
  phone: '',
  date: '',
  time: '',
};

const timeSlots = ['09:00', '10:00', '11:00', '12:00', '16:00', '17:00', '18:00'];

const BookingModal = ({ isOpen, service, onClose }) => {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const resetAndClose = () => {
    setForm(initialForm);
    setStatus('idle');
    setMessage('');
    onClose();
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          serviceId: service.id,
          serviceTitle: service.title,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No pudimos crear la cita.');
      }

      setStatus('success');
      setMessage(data.message || 'Cita solicitada. Te confirmaremos por WhatsApp.');
      setForm(initialForm);
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && service ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 px-4 py-8 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-lg rounded-[1.75rem] bg-cream p-6 text-left shadow-2xl shadow-blush/20"
            initial={{ y: 28, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 18, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blush">Nueva cita</p>
                <h3 className="mt-2 text-3xl font-black text-gray-950">{service.title}</h3>
              </div>
              <button
                type="button"
                onClick={resetAndClose}
                className="grid h-10 w-10 place-items-center rounded-full border border-beige bg-white text-xl font-bold text-gray-500 transition hover:border-blush hover:text-blush"
                aria-label="Cerrar modal"
              >
                x
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={submitBooking}>
              <label className="block">
                <span className="text-sm font-bold text-gray-700">Nombre del paciente</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  required
                  minLength={2}
                  className="mt-2 w-full rounded-2xl border border-beige bg-white px-4 py-3 outline-none transition focus:border-blush focus:ring-4 focus:ring-blush/10"
                  placeholder="Ej. Ana Martinez"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-gray-700">WhatsApp</span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={updateField}
                  required
                  inputMode="tel"
                  className="mt-2 w-full rounded-2xl border border-beige bg-white px-4 py-3 outline-none transition focus:border-blush focus:ring-4 focus:ring-blush/10"
                  placeholder="Ej. 5512345678"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700">Fecha</span>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={updateField}
                    min={minDate}
                    required
                    className="mt-2 w-full rounded-2xl border border-beige bg-white px-4 py-3 outline-none transition focus:border-blush focus:ring-4 focus:ring-blush/10"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-gray-700">Hora</span>
                  <select
                    name="time"
                    value={form.time}
                    onChange={updateField}
                    required
                    className="mt-2 w-full rounded-2xl border border-beige bg-white px-4 py-3 outline-none transition focus:border-blush focus:ring-4 focus:ring-blush/10"
                  >
                    <option value="">Selecciona</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </label>
              </div>

              {message ? (
                <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                  status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-full bg-blush px-6 py-4 text-sm font-black text-white shadow-lg shadow-blush/25 transition hover:bg-dark-blush disabled:cursor-wait disabled:opacity-70"
              >
                {status === 'loading' ? 'Enviando...' : 'Solicitar cita'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default BookingModal;
