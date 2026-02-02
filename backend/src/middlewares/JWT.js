import jwt from "jsonwebtoken"
import Carpintero from "../models/carpintero.js"
import Proyecto from "../models/Proyecto.js"

// =============================
// CREAR TOKEN
// =============================
const crearTokenJWT = (id, rol) => {
  return jwt.sign({ id, rol }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  })
}

// =============================
// VERIFICAR TOKEN
// =============================
const verificarTokenJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      msg: "Acceso denegado: token no proporcionado",
    })
  }

  try {
    const token = authHeader.split(" ")[1]
    const { id, rol } = jwt.verify(token, process.env.JWT_SECRET)

    let user

    if (rol === "carpintero") {
      user = await Carpintero.findById(id).select("-password")
    } else {
      user = await Proyecto.findById(id).select("-passwordCliente")
    }

    if (!user) {
      return res.status(401).json({ msg: "Usuario no encontrado" })
    }

    req.user = user
    req.user.rol = rol

    next()
  } catch (error) {
    console.error(error)
    return res.status(401).json({ msg: "Token inválido o expirado" })
  }
}

export {
  crearTokenJWT,
  verificarTokenJWT
}
