const passwordFuerte = (valor) => {
    const regexFuerte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#\$%\^&\*()_\+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

    if (!regexFuerte.test(valor)) {
        throw new Error('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo');
    }

    return true;
};

module.exports = {
    passwordFuerte
};
