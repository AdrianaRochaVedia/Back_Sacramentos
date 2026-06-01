const express = require('express');
const router = express.Router();

const { sendMail } = require('../helpers/mailer');

router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;

    const result = await sendMail({
      to: email,
      subject: 'Prueba ZeroBounce',
      html: '<h1>Correo de prueba</h1>',
      text: 'Correo de prueba',
    });

    res.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      ok: false,
      msg: error.message,
    });
  }
});

module.exports = router;
