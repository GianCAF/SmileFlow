const express = require('express');
const { admin, db } = require('../config/firebase');
const { normalizePhone } = require('../utils/phone');

function createBookingRouter({ sendWhatsAppMessage }) {
  const router = express.Router();

  router.post('/booking', async (req, res) => {
    try {
      const { name, phone, date, time, serviceId, serviceTitle } = req.body;

      if (!name || !phone || !date || !time || !serviceTitle) {
        return res.status(400).json({ error: 'Faltan datos para crear la cita.' });
      }

      const startsAt = new Date(`${date}T${time}:00`);

      if (Number.isNaN(startsAt.getTime())) {
        return res.status(400).json({ error: 'Fecha u hora invalida.' });
      }

      const normalizedPhone = normalizePhone(phone);
      const appointment = {
        name: String(name).trim(),
        phone: normalizedPhone,
        serviceId: serviceId || null,
        serviceTitle,
        date,
        time,
        startsAt: admin.firestore.Timestamp.fromDate(startsAt),
        status: 'pending',
        reminded: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection('appointments').add(appointment);
      const confirmation = [
        `Hola ${appointment.name}, recibimos tu solicitud para ${serviceTitle}.`,
        `Fecha: ${date} a las ${time}.`,
        'Te confirmaremos disponibilidad en breve. Gracias por elegir SmileFlow.',
      ].join('\n');

      const whatsapp = await sendWhatsAppMessage(normalizedPhone, confirmation);

      return res.status(201).json({
        id: docRef.id,
        message: whatsapp.sent
          ? 'Cita registrada. Enviamos la confirmacion por WhatsApp.'
          : 'Cita registrada. WhatsApp aun no esta conectado, pero la reserva quedo guardada.',
        whatsapp,
      });
    } catch (error) {
      console.error('[booking] Error al crear cita:', error);
      return res.status(500).json({ error: 'No pudimos crear la cita. Intenta de nuevo.' });
    }
  });

  return router;
}

module.exports = createBookingRouter;
