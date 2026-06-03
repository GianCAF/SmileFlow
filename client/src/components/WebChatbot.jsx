import { useEffect, useRef, useState } from 'react';
import { buildAvailabilityReplyForMessage } from '../lib/availability';

const menuMessage = [
  'Hola!, un placer saludarte, que te gustaria realizar:',
  '',
  '1- Servicios que manejamos',
  '2- Precio de cada servicio',
  '3- Agendar cita',
  '4- Recordar fecha de cita',
  '5- Cambiar o cancelar cita',
  '6- Hablar con la dentista',
  '',
  'Puedes responder con el numero de la opcion.',
].join('\n');

const servicesMessage = [
  'Estos son los servicios que manejamos:',
  '',
  '1. Limpieza Pro',
  '2. Ortodoncia',
  '3. Implantes',
  '4. Blanqueamiento',
  '',
  'Responde 2 para ver precios o 3 para agendar una cita.',
].join('\n');

const pricesMessage = 'Con gusto te compartimos precios. Limpieza desde $700 MXN y valoracion inicial con agenda previa.';
const bookingPrompt = 'Dime que dia quieres agendar en numero y mes por favor. Ejemplo: 15 junio o 15/06.';
const reminderMessage = 'Para recordar tu fecha de cita, enviame tu nombre completo y telefono registrado.';
const rescheduleMessage = 'Para cambiar o cancelar una cita, enviame tu nombre completo, fecha actual de la cita y el nuevo horario deseado.';
const handoffMessage = 'Claro, te comunico con la dentista. Puedes escribirnos por WhatsApp para atencion personalizada.';
const fallbackMessage = 'No estoy seguro de que opcion necesitas. Escribe Hola o Menu para ver las opciones disponibles.';

const RobotIcon = ({ className = 'h-5 w-5' }) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
    <path d="M12 3v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 6h8a4 4 0 0 1 4 4v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-5a4 4 0 0 1 4-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M9 12h.01M15 12h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M9 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 11H1M23 11h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SendIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
    <path d="m4 12 16-8-4.5 16-3.2-6.3L4 12Z" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" />
    <path d="m12.3 13.7 3.2-3.2" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
  </svg>
);

const CloseIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

function normalizeKeywordText(messageBody) {
  return messageBody
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isGreetingOrInfoRequest(text) {
  return ['buenos dias', 'buen dia', 'buenas tardes', 'buenas noches', 'hola', 'podria', 'disculpe', 'oiga', 'menu', 'informacion', 'info']
    .some((trigger) => text.includes(trigger));
}

function getMenuOption(text) {
  if (text === '1' || text.includes('servicio')) return 'services';
  if (text === '2' || text.includes('precio') || text.includes('costo')) return 'prices';
  if (text === '4' || text.includes('recordar') || text.includes('fecha')) return 'reminder';
  if (text === '5' || text.includes('cambiar') || text.includes('cancelar') || text.includes('reagendar')) return 'reschedule';
  if (text === '3' || text.includes('agendar') || text.includes('cita')) return 'booking';
  if (text === '6' || text.includes('dentista') || text.includes('doctor') || text.includes('humano')) return 'handoff';
  if (text.includes('ubicacion')) return 'location';
  return null;
}

const WebChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [flow, setFlow] = useState(null);
  const [messages, setMessages] = useState([{ role: 'bot', text: menuMessage }]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, isOpen]);

  const buildReply = async (text) => {
    const normalized = normalizeKeywordText(text);

    if (flow === 'booking_date') {
      setFlow('booking_time');
      return buildAvailabilityReplyForMessage(text);
    }

    if (isGreetingOrInfoRequest(normalized)) {
      setFlow(null);
      return menuMessage;
    }

    const option = getMenuOption(normalized);

    if (option === 'services') return servicesMessage;
    if (option === 'prices') return pricesMessage;

    if (option === 'booking') {
      setFlow('booking_date');
      return bookingPrompt;
    }

    if (option === 'reminder') return reminderMessage;
    if (option === 'reschedule') return rescheduleMessage;
    if (option === 'handoff') return handoffMessage;
    if (option === 'location') return 'Estamos en Av. Sonrisa 123. Puedes pedir una cita aqui mismo.';

    return fallbackMessage;
  };

  const sendMessage = async (event) => {
    event.preventDefault();

    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages((current) => [...current, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const reply = await buildReply(userText);
      setMessages((current) => [...current, { role: 'bot', text: reply }]);
    } catch {
      setMessages((current) => [...current, {
        role: 'bot',
        text: 'No pude consultar disponibilidad. Si Firestore pide login, activa Authentication > Sign-in method > Anonymous o publica las reglas temporales de lectura.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <section className="flex h-[560px] w-[min(92vw,390px)] flex-col overflow-hidden rounded-[1.5rem] border border-dark-blush/20 bg-cream shadow-2xl shadow-dark-blush/15">
          <header className="flex items-center justify-between border-b border-dark-blush/10 bg-blush px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-dark-blush">
                <RobotIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-black">SmileFlow Chat</p>
                <p className="text-xs font-semibold text-white/85">Disponibilidad y citas</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full bg-white text-dark-blush transition hover:bg-soft-rose"
              aria-label="Cerrar chat"
            >
              <CloseIcon />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-warm px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                  message.role === 'bot' ? 'mr-6 bg-white text-gray-800' : 'ml-6 bg-dark-blush text-white'
                }`}
              >
                {message.text}
              </div>
            ))}
            {loading ? <div className="mr-6 rounded-2xl bg-white px-4 py-3 text-sm text-gray-600">Consultando...</div> : null}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-dark-blush/10 bg-cream p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribe tu mensaje"
              className="min-w-0 flex-1 rounded-full border border-beige bg-white px-4 py-3 text-sm outline-none focus:border-blush"
            />
            <button
              type="submit"
              className="grid h-12 w-12 place-items-center rounded-full bg-dark-blush text-white shadow-lg shadow-dark-blush/20 transition hover:bg-blush"
              aria-label="Enviar mensaje"
            >
              <SendIcon />
            </button>
          </form>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-dark-blush px-5 py-4 text-sm font-black text-white shadow-2xl shadow-dark-blush/20 transition hover:bg-blush"
        >
          <RobotIcon />
          Chat
        </button>
      )}
    </div>
  );
};

export default WebChatbot;
