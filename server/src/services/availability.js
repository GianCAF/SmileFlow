const monthMap = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function toDateId(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function parseRequestedDate(messageBody, now = new Date()) {
  const text = normalizeText(messageBody);
  const numericMatch = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);

  if (numericMatch) {
    const day = Number(numericMatch[1]);
    const month = Number(numericMatch[2]) - 1;
    let year = numericMatch[3] ? Number(numericMatch[3]) : now.getFullYear();

    if (year < 100) {
      year += 2000;
    }

    const date = new Date(year, month, day);

    if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
      if (!numericMatch[3] && date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        date.setFullYear(date.getFullYear() + 1);
      }

      return date;
    }
  }

  const wordMatch = text.match(/\b(\d{1,2})\s*(?:de)?\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/);

  if (wordMatch) {
    const day = Number(wordMatch[1]);
    const month = monthMap[wordMatch[2]];
    const date = new Date(now.getFullYear(), month, day);

    if (date.getMonth() === month && date.getDate() === day) {
      if (date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        date.setFullYear(date.getFullYear() + 1);
      }

      return date;
    }
  }

  return null;
}

function timeToMinutes(time) {
  const [hours, minutes] = String(time || '00:00').split(':').map(Number);
  return (hours * 60) + minutes;
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function toDisplayTime(time) {
  const [hoursText, minutesText] = time.split(':');
  const hours = Number(hoursText);
  const suffix = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 || 12;

  if (minutesText === '00') {
    return `${hour12} ${suffix}`;
  }

  return `${hour12}:${minutesText} ${suffix}`;
}

function buildTimeSlots(startTime, endTime, slotMinutes) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const slots = [];

  for (let cursor = start; cursor < end; cursor += slotMinutes) {
    slots.push(minutesToTime(cursor));
  }

  return slots;
}

async function getAvailabilityForDate(date) {
  const { db } = require('../config/firebase');
  const dayKey = String(date.getDay());
  const dateId = toDateId(date);
  const availabilitySnapshot = await db.collection('clinicAvailability').doc(dayKey).get();

  if (!availabilitySnapshot.exists || availabilitySnapshot.data().enabled === false) {
    return {
      dateId,
      dayName: dayNames[date.getDay()],
      available: false,
      reason: 'closed',
    };
  }

  const availability = availabilitySnapshot.data();
  const slotMinutes = Number(availability.slotMinutes || 60);
  const slots = buildTimeSlots(availability.startTime, availability.endTime, slotMinutes);
  const appointmentSnapshot = await db
    .collection('appointments')
    .where('date', '==', dateId)
    .get();
  const booked = appointmentSnapshot.docs
    .map((doc) => doc.data().time)
    .filter(Boolean);
  const bookedSet = new Set(booked);
  const availableSlots = slots.filter((slot) => !bookedSet.has(slot));

  return {
    dateId,
    dayName: availability.dayName || dayNames[date.getDay()],
    available: true,
    startTime: availability.startTime,
    endTime: availability.endTime,
    slots,
    booked,
    availableSlots,
  };
}

function buildAvailabilityReply(result) {
  if (!result.available) {
    return `Ese dia (${result.dateId}) no hay horario de atencion registrado. Puedes indicarme otra fecha?`;
  }

  const range = `${toDisplayTime(result.startTime)} a ${toDisplayTime(result.endTime)}`;

  if (!result.booked.length) {
    return [
      `Para el ${result.dateId} tenemos horario de ${range}.`,
      'Aun no hay citas agendadas ese dia.',
      '',
      `Horarios disponibles: ${result.availableSlots.map(toDisplayTime).join(', ')}.`,
      'Responde con el horario que prefieras.',
    ].join('\n');
  }

  if (!result.availableSlots.length) {
    return [
      `Para el ${result.dateId} atendemos de ${range}, pero ese dia ya esta lleno.`,
      `Horarios ocupados: ${result.booked.map(toDisplayTime).join(', ')}.`,
      'Puedes indicarme otra fecha?',
    ].join('\n');
  }

  return [
    `Para el ${result.dateId} tenemos horario de ${range} excepto a las ${result.booked.map(toDisplayTime).join(', ')}.`,
    '',
    `Horarios disponibles: ${result.availableSlots.map(toDisplayTime).join(', ')}.`,
    'Responde con el horario que prefieras.',
  ].join('\n');
}

async function buildAvailabilityReplyForMessage(messageBody) {
  const date = parseRequestedDate(messageBody);

  if (!date) {
    return 'No pude identificar la fecha. Dime que dia quieres agendar en numero y mes, por ejemplo: 15 junio o 15/06.';
  }

  const result = await getAvailabilityForDate(date);
  return buildAvailabilityReply(result);
}

module.exports = {
  buildAvailabilityReply,
  buildAvailabilityReplyForMessage,
  parseRequestedDate,
  toDateId,
};
