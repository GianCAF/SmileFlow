const express = require('express');
const { normalizePhone } = require('../utils/phone');

function createWhatsAppTestRouter({ sendWhatsAppMessage }) {
  const router = express.Router();

  router.post('/whatsapp/test', async (req, res) => {
    try {
      const phone = normalizePhone(req.body.phone || process.env.TEST_WHATSAPP_NUMBER);
      const message = req.body.message || process.env.TEST_WHATSAPP_MESSAGE || 'Prueba SmileFlow: WhatsApp esta conectado correctamente.';

      if (!phone) {
        return res.status(400).json({
          error: 'Agrega phone en el body o TEST_WHATSAPP_NUMBER en .env.',
        });
      }

      const whatsapp = await sendWhatsAppMessage(phone, message);

      if (!whatsapp.sent) {
        return res.status(503).json({
          error: 'WhatsApp aun no esta listo. Escanea el QR y espera el mensaje de sesion lista.',
          whatsapp,
        });
      }

      return res.json({
        message: 'Mensaje de prueba enviado por WhatsApp.',
        phone,
        whatsapp,
      });
    } catch (error) {
      console.error('[whatsapp-test] Error enviando prueba:', error);
      return res.status(500).json({ error: 'No pudimos enviar el mensaje de prueba.' });
    }
  });

  return router;
}

module.exports = createWhatsAppTestRouter;
