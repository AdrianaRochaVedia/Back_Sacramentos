const verificarExpiracion = (usuario) => {
    if (!usuario.fecha_expiracion_password) return { expirada: false };
    const ahora = new Date();
    const expiracion = new Date(usuario.fecha_expiracion_password);

    if (ahora > expiracion) {
        return {
            expirada: true,
            msg: 'Tu contraseña ha expirado, debes cambiarla para continuar'
        };
    }

    return { expirada: false };
};

module.exports = verificarExpiracion;