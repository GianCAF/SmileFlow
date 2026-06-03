const qrImage = require('qrcode');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { buildAvailabilityReplyForMessage } = require('./availability');
const { toWhatsAppId } = require('../utils/phone');

let client;
let isReady = false;
let isInitializing = false;
let latestQr = null;

const conversationState = new Map();

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

const serviceListMessage = [
  'Estos son los servicios que manejamos:',
  '',
  '1. Limpieza Pro',
  '2. Ortodoncia',
  '3. Implantes',
  '4. Blanqueamiento',
  '',
  'Responde 2 para ver precios o 3 para agendar una cita.',
].join('\n');

const bookingDatePrompt = 'Dime que dia quieres agendar en numero y mes por favor. Ejemplo: 15 junio o 15/06.';

const reminderMessage = [
  'Para recordar tu fecha de cita, enviame tu nombre completo y telefono registrado.',
  'Revisaremos tu cita y te confirmaremos por WhatsApp.',
].join('\n');

const rescheduleMessage = [
  'Para cambiar o cancelar una cita, enviame tu nombre completo, fecha actual de la cita y el nuevo horario deseado.',
  'La dentista revisara disponibilidad y te respondera por este medio.',
].join('\n');

const dentistHandoffMessage = [
  'Claro, te comunico con la dentista.',
  'El chatbot dejara de responder en esta conversacion para que pueda atenderte personalmente.',
  '',
  'Para reactivar el chatbot escribe: activar bot',
].join('\n');

const fallbackMessage = [
  'No estoy seguro de que opcion necesitas.',
  'Escribe Hola o Menu para ver las opciones disponibles.',
].join('\n');

function normalizeKeywordText(messageBody) {
  return messageBody
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getChatState(chatId) {
  if (!conversationState.has(chatId)) {
    conversationState.set(chatId, { paused: false, flow: null });
  }

  return conversationState.get(chatId);
}

function isGreetingOrInfoRequest(text) {
  const triggers = [
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
  ];

  return triggers.some((trigger) => text.includes(trigger));
}

function getMenuOption(text) {
  if (text === '1' || text.includes('servicio')) {
    return 'services';
  }

  if (text === '2' || text.includes('precio') || text.includes('costo')) {
    return 'prices';
  }

  if (text === '4' || text.includes('recordar') || text.includes('fecha')) {
    return 'reminder';
  }

  if (
    text === '5'
    || text.includes('cambiar')
    || text.includes('cancelar')
    || text.includes('concelar')
    || text.includes('reagendar')
  ) {
    return 'reschedule';
  }

  if (text === '3' || text.includes('agendar') || text.includes('cita')) {
    return 'booking';
  }

  if (text === '6' || text.includes('dentista') || text.includes('doctor') || text.includes('humano')) {
    return 'handoff';
  }

  if (text.includes('ubicacion')) {
    return 'location';
  }

  return null;
}

async function buildAutoReply(messageBody, chatId) {
  const text = normalizeKeywordText(messageBody);
  const state = getChatState(chatId);

  if (state.paused) {
    if (text.includes('activar bot') || text === 'bot' || text === 'menu') {
      state.paused = false;
      state.flow = null;
      return menuMessage;
    }

    return null;
  }

  if (state.flow === 'booking_date') {
    try {
      const reply = await buildAvailabilityReplyForMessage(messageBody);
      state.flow = 'booking_time';
      return reply;
    } catch (error) {
      console.error('[whatsapp] Error consultando disponibilidad:', error.message);
      return 'Aun no puedo consultar la agenda. Revisa la conexion de Firebase Admin en el servidor.';
    }
  }

  if (isGreetingOrInfoRequest(text)) {
    state.flow = null;
    return menuMessage;
  }

  const option = getMenuOption(text);

  if (option === 'services') {
    state.flow = null;
    return serviceListMessage;
  }

  if (option === 'prices') {
    state.flow = null;
    return process.env.CLINIC_PRICES_MESSAGE || 'Con gusto te compartimos precios. Limpieza desde $700 MXN y valoracion inicial con agenda previa.';
  }

  if (option === 'booking') {
    state.flow = 'booking_date';
    return bookingDatePrompt;
  }

  if (option === 'reminder') {
    state.flow = null;
    return reminderMessage;
  }

  if (option === 'reschedule') {
    state.flow = null;
    return rescheduleMessage;
  }

  if (option === 'handoff') {
    state.paused = true;
    state.flow = null;
    return dentistHandoffMessage;
  }

  if (option === 'location') {
    state.flow = null;
    return process.env.CLINIC_LOCATION_MESSAGE || 'Estamos en Av. Sonrisa 123. Puedes pedir una cita aqui mismo.';
  }

  return fallbackMessage;
}

function initializeWhatsApp() {
  if (process.env.WHATSAPP_ENABLED === 'false') {
    console.log('[whatsapp] Desactivado por WHATSAPP_ENABLED=false');
    return null;
  }

  if (client || isInitializing) {
    return client;
  }

  isInitializing = true;
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: process.env.WHATSAPP_SESSION_PATH || './session',
    }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.on('qr', async (qr) => {
    latestQr = {
      raw: qr,
      dataUrl: await qrImage.toDataURL(qr, {
        errorCorrectionLevel: 'M',
        margin: 3,
        scale: 8,
      }),
      generatedAt: new Date().toISOString(),
    };

    console.log('[whatsapp] QR listo en http://localhost:4000/api/whatsapp/qr');
    console.log('[whatsapp] Tambien puedes intentar escanear este QR de terminal:');
    qrcode.generate(qr, { small: false });
  });

  client.on('ready', () => {
    isReady = true;
    isInitializing = false;
    latestQr = null;
    console.log('[whatsapp] Sesion lista');
  });

  client.on('authenticated', () => {
    latestQr = null;
    console.log('[whatsapp] Autenticacion recibida');
  });

  client.on('auth_failure', (message) => {
    isReady = false;
    isInitializing = false;
    console.error('[whatsapp] Fallo de autenticacion:', message);
  });

  client.on('disconnected', (reason) => {
    isReady = false;
    isInitializing = false;
    client = null;
    console.log('[whatsapp] Sesion desconectada:', reason);
  });

  client.on('message', async (message) => {
    console.log('[whatsapp] Mensaje recibido:', {
      from: message.from,
      body: message.body,
    });

    const reply = await buildAutoReply(message.body || '', message.from);

    if (reply) {
      await message.reply(reply);
      console.log('[whatsapp] Respuesta automatica enviada:', reply);
    } else {
      console.log('[whatsapp] Chat pausado o sin respuesta automatica:', message.from);
    }
  });

  client.initialize().catch((error) => {
    isReady = false;
    isInitializing = false;
    client = null;
    console.error('[whatsapp] Error iniciando cliente:', error.message);
  });

  return client;
}

async function shutdownWhatsApp() {
  if (!client) {
    return;
  }

  try {
    await client.destroy();
    console.log('[whatsapp] Cliente cerrado');
  } catch (error) {
    console.error('[whatsapp] Error cerrando cliente:', error.message);
  } finally {
    client = null;
    isReady = false;
    isInitializing = false;
    latestQr = null;
  }
}

async function sendWhatsAppMessage(phone, body) {
  if (!client || !isReady) {
    console.log('[whatsapp] Mensaje omitido porque la sesion aun no esta lista:', { phone, body });
    return { sent: false, reason: 'whatsapp_not_ready' };
  }

  const chatId = toWhatsAppId(phone);

  if (!chatId) {
    return { sent: false, reason: 'invalid_phone' };
  }

  await client.sendMessage(chatId, body);
  return { sent: true };
}

function getWhatsAppQr() {
  return latestQr;
}

function getWhatsAppStatus() {
  return {
    enabled: process.env.WHATSAPP_ENABLED !== 'false',
    ready: isReady,
    initializing: isInitializing,
    hasQr: Boolean(latestQr),
  };
}

module.exports = {
  getWhatsAppQr,
  getWhatsAppStatus,
  initializeWhatsApp,
  sendWhatsAppMessage,
  shutdownWhatsApp,
};
