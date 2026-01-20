import jwt from "jsonwebtoken"
import carpintero from "../models/carpintero.js"
import Proyecto from "../models/Proyecto.js"

// =============================
// CREAR TOKEN
// =============================
const crearTokenJWT = (id, rol) => {
    return jwt.sign({ id, rol }, process.env.JWT_SECRET, { expiresIn: "1d" })
}

// =============================
// VERIFICAR TOKEN
// =============================
const verificarTokenJWT = async (req, res, next) => {

    const { authorization } = req.headers
    if (!authorization) {
        return res.status(401).json({ msg: "Acceso denegado: token no proporcionado" })
    }
    try {
        const token = authorization.split(" ")[1]
        const { id, rol } = jwt.verify(token, process.env.JWT_SECRET)
        if (rol === "carpintero") {
            const carpinteroBDD = await carpintero.findById(id).lean().select("-password")
            if (!carpinteroBDD) {
                return res.status(401).json({ msg: "Usuario no encontrado" })
            }
            req.carpinteroHeader = carpinteroBDD
            next()
        }
       else {
            const clienteBDD = await Proyecto.findById(id).lean().select("-passwordCliente");
            if (!clienteBDD) {
                return res.status(401).json({ msg: "Usuario no encontrado" });
            }
            req.clienteHeader = clienteBDD;
            next();
        }

} catch (error) {
    console.log(error)
    return res.status(401).json({ msg: `Token inválido o expirado - ${error}` })
}

}

export {
crearTokenJWT,
verificarTokenJWT
}
