const jwt = require('jsonwebtoken');

//Trabajar en base a promesas, envez de callbacks

const generarJWT = ( uid, correo) => {

    return new Promise( (resolve, reject) => {

        const payload = { uid, correo };

        jwt.sign( payload, process.env.SECRET_JWT_SEED, { //Sign para firmar un token, 
            expiresIn: '7h'//Para la duracion del token
        }, (err, token) => { 
            if(err){
                console.log(err);
                reject('No se pudo generar el token');
            }
            resolve(token);
        });
    });
    
}
module.exports = {
    generarJWT
}