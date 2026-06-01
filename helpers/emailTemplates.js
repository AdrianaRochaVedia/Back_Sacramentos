function resetPasswordEmail({ appName, resetUrl, minutes = 30 }) {
  const subject = `${appName} – Restablecer contraseña`;
  const text =
`Recibimos una solicitud para restablecer tu contraseña de ${appName}.
Haz clic en el enlace (o cópialo en tu navegador):
${resetUrl}

Este enlace vence en ${minutes} minutos. Si no fuiste tú, ignora este mensaje.`;

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
    <h2>${appName} – Restablecer contraseña</h2>
    <p>Recibimos una solicitud para restablecer tu contraseña.</p>
    <p>Haz clic en el botón para continuar. El enlace vence en <strong>${minutes} minutos</strong>.</p>
    <p style="text-align:center;">
      <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;text-decoration:none;border-radius:8px;background:#111;color:#fff;">
        Restablecer contraseña
      </a>
    </p>
    <p style="font-size:13px;color:#555;">Si el botón no funciona, copia y pega este enlace:</p>
    <p style="word-break:break-all;font-size:13px;color:#0a5;">${resetUrl}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="font-size:12px;color:#666;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
  </div>`;

  return { subject, text, html };
}

function twoFactorEmail({ appName, codigo, minutes = 10 }) {
  const subject = `${appName} – Código de verificación`;

  const text =
`Tu código de verificación para ${appName} es:

${codigo}

Este código vence en ${minutes} minutos. Si no fuiste tú, ignora este mensaje.`;

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
    <h2>${appName} – Verificación en dos pasos</h2>
    <p>Usa el siguiente código para completar tu inicio de sesión:</p>
    <div style="font-size:34px;font-weight:700;letter-spacing:8px;text-align:center;background:#f4f4f4;padding:18px;border-radius:10px;margin:22px 0;">
      ${codigo}
    </div>
    <p>Este código vence en <strong>${minutes} minutos</strong>.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="font-size:12px;color:#666;">Si no intentaste iniciar sesión, puedes ignorar este correo.</p>
  </div>`;

  return { subject, text, html };
}

function cuentaBloqueadaEmail({ appName, nombre, tiempoBloqueo }) {
  const subject = `${appName} – Cuenta bloqueada`;

  const text =
`Hola ${nombre || ''}.

Tu cuenta fue bloqueada temporalmente por demasiados intentos fallidos de inicio de sesión.

Tiempo de bloqueo: ${tiempoBloqueo} minuto(s).

Si fuiste tú, espera el tiempo indicado o contacta al administrador.
Si no fuiste tú, te recomendamos cambiar tu contraseña cuando recuperes el acceso.`;

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
    <h2 style="color:#b91c1c;margin:0 0 12px;">${appName} – Cuenta bloqueada</h2>
    <p>Hola <strong>${nombre || 'usuario'}</strong>.</p>
    <p>Tu cuenta fue bloqueada temporalmente por demasiados intentos fallidos de inicio de sesión.</p>
    <p>Si fuiste tú, contacta al administrador.</p>
    <p>Si no fuiste tú, te recomendamos cambiar tu contraseña cuando recuperes el acceso.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="font-size:12px;color:#666;">Este mensaje fue generado automáticamente por seguridad.</p>
  </div>`;

  return { subject, text, html };
}

function cuentaDesbloqueadaEmail({ appName, nombre }) {
  const subject = `${appName} – Cuenta desbloqueada`;

  const text =
`Hola ${nombre || ''}.

Tu cuenta ha sido desbloqueada correctamente.

Ya puedes volver a iniciar sesión en el sistema.`;

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
    <h2 style="color:#15803d;margin:0 0 12px;">${appName} – Cuenta desbloqueada</h2>
    <p>Hola <strong>${nombre || 'usuario'}</strong>.</p>
    <p>Tu cuenta ha sido desbloqueada correctamente.</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;padding:14px;border-radius:10px;margin:18px 0;">
      Ya puedes volver a iniciar sesión en el sistema.
    </div>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="font-size:12px;color:#666;">Este mensaje fue generado automáticamente por seguridad.</p>
  </div>`;

  return { subject, text, html };
}

module.exports = {
  resetPasswordEmail,
  twoFactorEmail,
  cuentaBloqueadaEmail,
  cuentaDesbloqueadaEmail
};