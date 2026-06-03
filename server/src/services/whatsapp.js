const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { toWhatsAppId } = require('../utils/phone');

let client;
let isReady = false;
let isInitializing = false;

function buildAutoReply(messageBody) {
  const text = messageBody.trim().toLowerCase();

  if (text.includes('ubicacion') || text.includes('ubicación')) {
    return process.env.CLINIC_LOCATION_MESSAGE || 'Estamos en Av. Sonrisa 123. Puedes pedir una cita aqui mismo.';
  }

  if (text.includes('precio') || text.includes('precios')) {
    return process.env.CLINIC_PRICES_MESSAGE || 'Con gusto te compartimos precios. Limpieza desde $700 MXN y valoracion inicial con agenda previa.';
  }

  return null;
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

  client.on('qr', (qr) => {
    console.log('[whatsapp] Escanea este QR con el telefono del consultorio:');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    isReady = true;
    isInitializing = false;
    console.log('[whatsapp] Sesion lista');
  });

  client.on('authenticated', () => {
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
    const reply = buildAutoReply(message.body || '');

    if (reply) {
      await message.reply(reply);
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

function getWhatsAppStatus() {
  return {
    enabled: process.env.WHATSAPP_ENABLED !== 'false',
    ready: isReady,
    initializing: isInitializing,
  };
}

module.exports = {
  getWhatsAppStatus,
  initializeWhatsApp,
  sendWhatsAppMessage,
  shutdownWhatsApp,
};
