const express = require('express');

function createWhatsAppQrRouter({ getWhatsAppQr, getWhatsAppStatus }) {
  const router = express.Router();

  router.get('/whatsapp/qr', (_req, res) => {
    const status = getWhatsAppStatus();
    const qr = getWhatsAppQr();

    res.type('html').send(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="8" />
    <title>SmileFlow WhatsApp QR</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #ffe8ee;
        color: #171717;
        font-family: Arial, sans-serif;
      }
      main {
        width: min(92vw, 620px);
        text-align: center;
        background: white;
        border-radius: 24px;
        padding: 32px;
        box-shadow: 0 24px 60px rgba(211, 126, 145, 0.22);
      }
      img {
        width: min(78vw, 420px);
        height: auto;
        image-rendering: pixelated;
      }
      code {
        display: inline-block;
        margin-top: 12px;
        padding: 8px 10px;
        border-radius: 10px;
        background: #f4f4f5;
      }
      p {
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>SmileFlow WhatsApp</h1>
      ${status.ready ? '<h2>Sesion lista</h2><p>WhatsApp ya esta vinculado.</p>' : ''}
      ${!status.ready && qr ? `<img src="${qr.dataUrl}" alt="QR para vincular WhatsApp" /><p>Abre WhatsApp en tu celular y entra a <strong>Dispositivos vinculados</strong>. Escanea este QR desde ahi.</p><code>Se actualiza automaticamente</code>` : ''}
      ${!status.ready && !qr ? '<p>Aun no hay QR disponible. Espera unos segundos y recarga esta pagina.</p>' : ''}
    </main>
  </body>
</html>`);
  });

  return router;
}

module.exports = createWhatsAppQrRouter;
