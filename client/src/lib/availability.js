import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

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

export function toDateId(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function parseRequestedDate(messageBody, now = new Date()) {
  const text = normalizeText(messageBody);
  const numericMatch = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);

  if (numericMatch) {
    const day = Number(numericMatch[1]);
    const month = Number(numericMatch[2]) - 1;
    let year = numericMatch[3] ? Number(numericMatch[3]) : now.getFullYear();

    if (year < 100) year += 2000;

    const date = new Date(year, month, day);

    if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
      return date;
    }
  }

  const wordMatch = text.match(/\b(\d{1,2})\s*(?:de)?\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/);

  if (wordMatch) {
    const day = Number(wordMatch[1]);
    const month = monthMap[wordMatch[2]];
    const date = new Date(now.getFullYear(), month, day);

    if (date.getMonth() === month && date.getDate() === day) {
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

function isSameDay(firstDate, secondDate) {
  return firstDate.getFullYear() === secondDate.getFullYear()
    && firstDate.getMonth() === secondDate.getMonth()
    && firstDate.getDate() === secondDate.getDate();
}

function isFutureSlot(date, time, now = new Date()) {
  const [hours, minutes] = String(time || '00:00').split(':').map(Number);
  const startsAt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);

  return startsAt > now;
}

export function toDisplayTime(time) {
  const [hoursText, minutesText] = time.split(':');
  const hours = Number(hoursText);
  const suffix = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 || 12;

  if (minutesText === '00') return `${hour12} ${suffix}`;

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

export async function getAvailabilityForDate(date) {
  const dayKey = String(date.getDay());
  const dateId = toDateId(date);
  const availabilitySnapshot = await getDoc(doc(db, 'clinicAvailability', dayKey));

  if (!availabilitySnapshot.exists() || availabilitySnapshot.data().enabled === false) {
    return {
      dateId,
      dayName: dayNames[date.getDay()],
      available: false,
      reason: 'closed',
    };
  }

  const availability = availabilitySnapshot.data();
  const slotMinutes = Number(availability.slotMinutes || 60);
  const slots = buildTimeSlots(availability.startTime, availability.endTime, slotMinutes)
    .filter((slot) => isFutureSlot(date, slot));

  return {
    dateId,
    dayName: availability.dayName || dayNames[date.getDay()],
    available: true,
    startTime: availability.startTime,
    endTime: availability.endTime,
    slots,
  };
}

function buildAvailabilityReply(result) {
  if (!result.available) {
    return `Ese dia (${result.dateId}) no hay horario de atencion registrado. Puedes indicarme otra fecha?`;
  }

  const range = `${toDisplayTime(result.startTime)} a ${toDisplayTime(result.endTime)}`;

  if (!result.slots.length) {
    const resultDate = new Date(`${result.dateId}T00:00:00`);

    return isSameDay(resultDate, new Date())
      ? `Para hoy (${result.dateId}) ya no quedan horarios futuros disponibles. Puedes indicarme otra fecha?`
      : `Ese dia (${result.dateId}) ya paso. Puedes indicarme una fecha futura?`;
  }

  return [
    `Para el ${result.dateId} tenemos horario de ${range}.`,
    '',
    `Horarios base: ${result.slots.map(toDisplayTime).join(', ')}.`,
    'La dentista confirmara si el espacio sigue disponible antes de cerrar la cita.',
  ].join('\n');
}

export async function buildAvailabilityReplyForMessage(messageBody) {
  const date = parseRequestedDate(messageBody);

  if (!date) {
    return 'No pude identificar la fecha. Dime que dia quieres agendar en numero y mes, por ejemplo: 15 junio o 15/06.';
  }

  const result = await getAvailabilityForDate(date);
  return buildAvailabilityReply(result);
}
