import jwt from "jsonwebtoken"
import Carpintero from "../models/carpintero.js"
import Cliente from "../models/Cliente.js"
import Administrador from "../models/Administrador.js"
import { sinSecretos } from "../helpers/firestore.js"

// =============================
// CREAR TOKEN
// =============================
const crearTokenJWT = (id, rol) => {
  return jwt.sign({ id, rol }, process.env.JWT_SECRET, { expiresIn: "1d" })
}

const BUSCAR_POR_ROL = {
  carpintero: (id) => Carpintero.porId(id),
  cliente: (id) => Cliente.porId(id),
  administrador: (id) => Administrador.porId(id),
}

// =============================
// VERIFICAR TOKEN
// =============================
const verificarTokenJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Acceso denegado: token no proporcionado" })
  }

  let decodificado
  try {
    decodificado = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET)
  } catch (error) {
    return res.status(401).json({ msg: "Token inválido o expirado" })
  }

  try {
    const { id, rol } = decodificado
    const buscar = BUSCAR_POR_ROL[rol]
    if (!buscar) return res.status(401).json({ msg: "Token inválido o expirado" })

    const usuario = await buscar(id)
    if (!usuario) return res.status(401).json({ msg: "Usuario no encontrado" })
    if (usuario.status === false) return res.status(403).json({ msg: "Tu cuenta está desactivada" })

    const usuarioSeguro = { ...sinSecretos(usuario), rol }

    // Compatibilidad con los controladores existentes
    if (rol === "carpintero") req.carpinteroHeader = usuarioSeguro
    if (rol === "cliente") req.clienteHeader = usuarioSeguro
    if (rol === "administrador") req.adminHeader = usuarioSeguro

    // Estándar nuevo
    req.user = usuarioSeguro
    next()
  } catch (error) {
    console.error(error)
    return res.status(500).json({ msg: "Error al validar la sesión" })
  }
}

export { crearTokenJWT, verificarTokenJWT }
