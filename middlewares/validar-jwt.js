const { response } = require('express');
const jwt = require('jsonwebtoken');
const decode = require('jsonwebtoken/decode');

const validarJWT = (req, res = response, next) => {
    //x-tpken headers
    const token = req.header('x-token');
    console.log(token);
    console.log(decode(token, { complete: true }));
    if(!token){
        return res.status(401).json({
            ok: false,
            msg: 'No hay token en la petición'
        });
    }

    try{
        const { uid, email } = jwt.verify(
            token, 
            process.env.SECRET_JWT_SEED
        );

        req.uid = uid;
        req.email = email;

    }catch(error){
        console.log(error);
        return res.status(401).json({
            ok: false,
            msg: 'Token no válido'
        });
    }


    next();

}

module.exports = {
    validarJWT
}