import { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
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

function normalizeKeywordText(messageBody) {
  return messageBody
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isGreetingOrInfoRequest(text) {
  return [
    'buenos dias',
    'buen dia',
    'buenas tardes',
    'buenas noches',
    'hola',
    'podria',
    'disculpe',
    'oiga',
    'menu',
    'informacion',
    'info',
  ].some((trigger) => text.includes(trigger));
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
  const [messages, setMessages] = useState([
    { role: 'bot', text: menuMessage },
  ]);
  const [loading, setLoading] = useState(false);

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

    if (option === 'services') {
      setFlow(null);
      return servicesMessage;
    }

    if (option === 'prices') {
      setFlow(null);
      return pricesMessage;
    }

    if (option === 'booking') {
      setFlow('booking_date');
      return bookingPrompt;
    }

    if (option === 'reminder') {
      setFlow(null);
      return reminderMessage;
    }

    if (option === 'reschedule') {
      setFlow(null);
      return rescheduleMessage;
    }

    if (option === 'handoff') {
      setFlow(null);
      return handoffMessage;
    }

    if (option === 'location') {
      setFlow(null);
      return 'Estamos en Av. Sonrisa 123. Puedes pedir una cita aqui mismo.';
    }

    return fallbackMessage;
  };

  const sendMessage = async (event) => {
    event.preventDefault();

    if (!input.trim() || loading) {
      return;
    }

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
        text: 'No pude consultar disponibilidad en este momento. Intenta de nuevo en unos segundos.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <section className="flex h-[560px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-[1.5rem] border border-beige bg-cream shadow-2xl shadow-blush/20">
          <header className="flex items-center justify-between border-b border-beige bg-soft-rose px-4 py-3">
            <div>
              <p className="text-sm font-black text-gray-950">SmileFlow Chat</p>
              <p className="text-xs font-semibold text-gray-600">Disponibilidad y citas</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full bg-white text-gray-600 transition hover:text-blush"
              aria-label="Cerrar chat"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === 'bot'
                    ? 'mr-6 bg-white text-gray-700'
                    : 'ml-6 bg-blush text-white'
                }`}
              >
                {message.text}
              </div>
            ))}
            {loading ? <div className="mr-6 rounded-2xl bg-white px-4 py-3 text-sm text-gray-500">Consultando...</div> : null}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-beige bg-white/70 p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribe tu mensaje"
              className="min-w-0 flex-1 rounded-full border border-beige bg-white px-4 py-3 text-sm outline-none focus:border-blush"
            />
            <button
              type="submit"
              className="grid h-11 w-11 place-items-center rounded-full bg-blush text-white transition hover:bg-dark-blush"
              aria-label="Enviar mensaje"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-blush px-5 py-4 text-sm font-black text-white shadow-2xl shadow-blush/30 transition hover:bg-dark-blush"
        >
          <MessageCircle className="h-5 w-5" />
          Chat
        </button>
      )}
    </div>
  );
};

export default WebChatbot;
