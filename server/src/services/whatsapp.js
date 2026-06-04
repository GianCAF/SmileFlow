const qrImage = require('qrcode');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { buildAvailabilityReplyForMessage } = require('./availability');
const { normalizePhone, toWhatsAppId } = require('../utils/phone');

let client;
let isReady = false;
let isInitializing = false;
let latestQr = null;
let readyWaiters = [];

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

function resolveReadyWaiters(value) {
  readyWaiters.forEach((resolve) => resolve(value));
  readyWaiters = [];
}

function markWhatsAppReady(source) {
  isReady = true;
  isInitializing = false;
  latestQr = null;
  resolveReadyWaiters(true);
  console.log(`[whatsapp] Sesion lista (${source})`);
}

async function refreshReadyState() {
  if (!client || isReady) {
    return isReady;
  }

  try {
    const state = await client.getState();
    console.log('[whatsapp] Estado actual:', state);

    if (state === 'CONNECTED') {
      markWhatsAppReady('getState');
      return true;
    }
  } catch (error) {
    console.log('[whatsapp] Estado aun no disponible:', error.message);
  }

  return false;
}

async function waitForReady(timeoutMs = 30000) {
  if (isReady) {
    return true;
  }

  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      if (await refreshReadyState()) {
        clearInterval(interval);
        readyWaiters = readyWaiters.filter((waiter) => waiter !== resolve);
        resolve(true);
      }
    }, 2000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      readyWaiters = readyWaiters.filter((waiter) => waiter !== resolve);
      resolve(false);
    }, timeoutMs);

    readyWaiters.push((value) => {
      clearInterval(interval);
      clearTimeout(timeout);
      resolve(value);
    });
  });
}

function getWhatsAppPhoneCandidates(rawPhone) {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  const normalizedPhone = normalizePhone(rawPhone);
  const candidates = [normalizedPhone];

  if ((process.env.DEFAULT_COUNTRY_CODE || '52') === '52' && digits.length === 10) {
    candidates.push(`521${digits}`);
  }

  return [...new Set(candidates.filter(Boolean))];
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
    markWhatsAppReady('ready');
  });

  client.on('authenticated', () => {
    latestQr = null;
    console.log('[whatsapp] Autenticacion recibida');
    setTimeout(() => {
      refreshReadyState();
    }, 2000);
  });

  client.on('auth_failure', (message) => {
    isReady = false;
    isInitializing = false;
    resolveReadyWaiters(false);
    console.error('[whatsapp] Fallo de autenticacion:', message);
  });

  client.on('disconnected', (reason) => {
    isReady = false;
    isInitializing = false;
    client = null;
    resolveReadyWaiters(false);
    console.log('[whatsapp] Sesion desconectada:', reason);
  });

  client.on('message', async (message) => {
    const chat = await message.getChat();

    if (message.from.endsWith('@g.us') || chat.isGroup) {
      console.log('[whatsapp] Mensaje de grupo ignorado:', {
        from: message.from,
        name: chat.name,
        body: message.body,
      });
      return;
    }

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
  if (!client) {
    console.log('[whatsapp] Mensaje omitido porque no hay cliente WhatsApp:', { phone, body });
    return { sent: false, reason: 'whatsapp_client_missing' };
  }

  if (!isReady) {
    console.log('[whatsapp] Esperando sesion lista antes de enviar mensaje:', { phone });
    const becameReady = await waitForReady(Number(process.env.WHATSAPP_READY_TIMEOUT_MS || 30000));

    if (!becameReady || !isReady) {
      console.log('[whatsapp] Mensaje omitido porque la sesion aun no esta lista:', { phone, body });
      return { sent: false, reason: 'whatsapp_not_ready' };
    }
  }

  const phoneCandidates = getWhatsAppPhoneCandidates(phone);
  const chatId = toWhatsAppId(phoneCandidates[0]);

  if (!chatId) {
    return { sent: false, reason: 'invalid_phone' };
  }

  const errors = [];

  for (const phoneCandidate of phoneCandidates) {
    try {
      const numberId = await client.getNumberId(phoneCandidate);

      if (!numberId?._serialized) {
        errors.push(`${phoneCandidate}: phone_not_on_whatsapp`);
        continue;
      }

      await client.sendMessage(numberId._serialized, body);
      return { sent: true, phone: phoneCandidate };
    } catch (error) {
      errors.push(`${phoneCandidate}: ${error.message}`);
    }
  }

  console.error('[whatsapp] No se pudo enviar mensaje:', {
    phoneCandidates,
    reason: errors.join(' | '),
  });

  return {
    sent: false,
    reason: errors.join(' | ') || 'whatsapp_send_failed',
  };
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
