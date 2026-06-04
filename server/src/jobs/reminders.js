const cron = require('node-cron');

function toDateId(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function toDisplayTime(time) {
  const [hoursText, minutesText] = String(time || '00:00').split(':');
  const hours = Number(hoursText);
  const suffix = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 || 12;

  if (minutesText === '00') {
    return `${hour12} ${suffix}`;
  }

  return `${hour12}:${minutesText} ${suffix}`;
}

function getStartsAt(appointment) {
  if (appointment.startsAt?.toDate) {
    return appointment.startsAt.toDate();
  }

  return new Date(`${appointment.date || ''}T${appointment.time || '00:00'}:00`);
}

function canSendTodayReminder(appointment, now) {
  if (appointment.todayReminderSent || appointment.remindedToday) {
    return false;
  }

  if (['realizada', 'no_llego', 'cancelled', 'completed', 'no_show'].includes(appointment.status)) {
    return false;
  }

  const startsAt = getStartsAt(appointment);
  return !Number.isNaN(startsAt.getTime()) && startsAt > now;
}

async function getRegisteredPhone(appointment) {
  if (appointment.phone) {
    return appointment.phone;
  }

  if (!appointment.patientUid) {
    return '';
  }

  const { db } = require('../config/firebase');
  const userSnapshot = await db.collection('users').doc(appointment.patientUid).get();

  if (!userSnapshot.exists) {
    return '';
  }

  return userSnapshot.data().phone || '';
}

async function sendTodayReminders(sendWhatsAppMessage) {
  const { admin, db } = require('../config/firebase');
  const now = new Date();
  const today = toDateId(now);

  const snapshot = await db
    .collection('appointments')
    .where('date', '==', today)
    .get();

  const candidates = snapshot.docs.filter((item) => canSendTodayReminder(item.data(), now));

  await Promise.all(candidates.map(async (item) => {
    const appointment = item.data();
    const phone = await getRegisteredPhone(appointment);

    if (!phone) {
      console.log('[cron] Recordatorio omitido sin telefono registrado:', item.id);
      return;
    }

    const body = [
      `Hola ${appointment.name || 'paciente'}, recuerda que tu cita con la dentista es hoy a las ${toDisplayTime(appointment.time)}.`,
      'Te esperamos en SmileFlow. Si necesitas moverla, responde a este WhatsApp.',
    ].join('\n');

    const result = await sendWhatsAppMessage(phone, body);

    if (result.sent) {
      await item.ref.update({
        reminded: true,
        todayReminderSent: true,
        todayReminderAt: admin.firestore.FieldValue.serverTimestamp(),
        remindedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }));

  return candidates.length;
}

function startReminderJob(sendWhatsAppMessage) {
  if (process.env.REMINDERS_ENABLED === 'false') {
    console.log('[cron] Recordatorios desactivados por REMINDERS_ENABLED=false');
    return null;
  }

  return cron.schedule(process.env.REMINDER_CRON || '*/15 * * * *', async () => {
    try {
      const count = await sendTodayReminders(sendWhatsAppMessage);
      console.log(`[cron] Recordatorios de hoy revisados. Candidatos: ${count}`);
    } catch (error) {
      console.error('[cron] Error enviando recordatorios:', error);
    }
  });
}

module.exports = {
  sendTodayReminders,
  startReminderJob,
};
