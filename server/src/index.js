require('dotenv').config();

const express = require('express');
const cors = require('cors');
const createBookingRouter = require('./routes/bookings');
const createWhatsAppTestRouter = require('./routes/whatsappTest');
const {
  getWhatsAppStatus,
  initializeWhatsApp,
  sendWhatsAppMessage,
  shutdownWhatsApp,
} = require('./services/whatsapp');
const { startReminderJob } = require('./jobs/reminders');

const app = express();
const port = process.env.PORT || 4000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    whatsapp: getWhatsAppStatus(),
  });
});

app.use('/api', createWhatsAppTestRouter({ sendWhatsAppMessage }));
app.use('/api', createBookingRouter({ sendWhatsAppMessage }));

const server = app.listen(port, () => {
  console.log(`[api] SmileFlow escuchando en http://localhost:${port}`);
  initializeWhatsApp();
  startReminderJob(sendWhatsAppMessage);
});

async function shutdown(signal) {
  console.log(`[api] Cerrando servidor por ${signal}`);
  server.close(async () => {
    await shutdownWhatsApp();
    process.exit(0);
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
