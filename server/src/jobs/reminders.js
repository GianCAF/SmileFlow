const cron = require('node-cron');
const { admin, db } = require('../config/firebase');

function formatDate(date) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date);
}

async function sendPendingReminders(sendWhatsAppMessage) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  start.setMinutes(0, 0, 0);

  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  const snapshot = await db
    .collection('appointments')
    .where('reminded', '==', false)
    .where('startsAt', '>=', admin.firestore.Timestamp.fromDate(start))
    .where('startsAt', '<', admin.firestore.Timestamp.fromDate(end))
    .get();

  await Promise.all(snapshot.docs.map(async (doc) => {
    const appointment = doc.data();
    const startsAt = appointment.startsAt.toDate();
    const body = [
      `Hola ${appointment.name}, te recordamos tu cita de ${appointment.serviceTitle}.`,
      `Te esperamos el ${formatDate(startsAt)}.`,
      'Si necesitas moverla, responde a este WhatsApp.',
    ].join('\n');

    const result = await sendWhatsAppMessage(appointment.phone, body);

    if (result.sent) {
      await doc.ref.update({
        reminded: true,
        remindedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }));

  return snapshot.size;
}

function startReminderJob(sendWhatsAppMessage) {
  if (process.env.REMINDERS_ENABLED === 'false') {
    console.log('[cron] Recordatorios desactivados por REMINDERS_ENABLED=false');
    return null;
  }

  return cron.schedule(process.env.REMINDER_CRON || '0 * * * *', async () => {
    try {
      const count = await sendPendingReminders(sendWhatsAppMessage);
      console.log(`[cron] Recordatorios revisados. Candidatos: ${count}`);
    } catch (error) {
      console.error('[cron] Error enviando recordatorios:', error);
    }
  });
}

module.exports = {
  sendPendingReminders,
  startReminderJob,
};
