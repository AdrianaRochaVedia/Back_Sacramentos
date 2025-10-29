function resetPasswordEmail({ appName, resetUrl, minutes = 30 }) {
  const subject = `${appName} – Restablecer contraseña`;
  const text =
`Recibimos una solicitud para restablecer tu contraseña de ${appName}.
Haz clic en el enlace (o cópialo en tu navegador):
${resetUrl}

Este enlace vence en ${minutes} minutos. Si no fuiste tú, ignora este mensaje.`;

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
    <h2 style="margin:0 0 12px;">${appName} – Restablecer contraseña</h2>
    <p style="margin:0 0 16px;">Recibimos una solicitud para restablecer tu contraseña.</p>
    <p style="margin:0 0 24px;">Haz clic en el botón para continuar. El enlace vence en <strong>${minutes} minutos</strong>.</p>
    <p style="text-align:center;margin:0 0 24px;">
      <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;text-decoration:none;border-radius:8px;background:#111;color:#fff;">
        Restablecer contraseña
      </a>
    </p>
    <p style="font-size:13px;color:#555;margin:0 0 8px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
    <p style="word-break:break-all;font-size:13px;color:#0a5;">${resetUrl}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="font-size:12px;color:#666;margin:0;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
  </div>`;

  return { subject, text, html };
}

module.exports = { resetPasswordEmail };