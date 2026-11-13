import jwt from "jsonwebtoken"
import Carpintero from "../models/carpintero.js"
import Cliente from "../models/Cliente.js"
import Administrador from "../models/Administrador.js"
import { sinSecretos } from "../helpers/firestore.js"

const ALGORITMO = "HS256"

// =============================
// CREAR TOKEN
// `tokenVersion` viaja en el claim `tv`: al cerrar sesión o cambiar la contraseña el usuario
// incrementa su versión en la BD y todos los tokens anteriores dejan de valer.
// =============================
const crearTokenJWT = (id, rol, tokenVersion = 0) => {
  return jwt.sign({ id, rol, tv: tokenVersion || 0 }, process.env.JWT_SECRET, {
    expiresIn: "1d",
    algorithm: ALGORITMO,
  })
}

const MODELO_POR_ROL = {
  carpintero: Carpintero,
  cliente: Cliente,
  administrador: Administrador,
}

// Sube la versión de token del usuario: invalida todas sus sesiones abiertas. Devuelve la nueva versión.
const invalidarSesiones = async (rol, id) => {
  const Modelo = MODELO_POR_ROL[rol]
  const usuario = Modelo && (await Modelo.porId(id))
  if (!usuario) return null
  const nueva = (usuario.tokenVersion || 0) + 1
  await Modelo.actualizar(id, { tokenVersion: nueva })
  return nueva
}

// =============================
// AUTENTICAR UN TOKEN (HTTP y Socket.IO comparten esta lógica)
// Devuelve { usuario } o { codigo, msg }.
// =============================
const autenticarToken = async (token) => {
  let decodificado
  try {
    decodificado = jwt.verify(token, process.env.JWT_SECRET, { algorithms: [ALGORITMO] })
  } catch {
    return { codigo: 401, msg: "Token inválido o expirado" }
  }

  const { id, rol, tv } = decodificado
  const Modelo = MODELO_POR_ROL[rol]
  if (!Modelo) return { codigo: 401, msg: "Token inválido o expirado" }

  const usuario = await Modelo.porId(id)
  if (!usuario) return { codigo: 401, msg: "Usuario no encontrado" }
  if (usuario.status === false) return { codigo: 403, msg: "Tu cuenta está desactivada" }
  // Los tokens anteriores a `tokenVersion` no traen `tv`: equivalen a la versión 0
  if ((tv || 0) !== (usuario.tokenVersion || 0)) {
    return { codigo: 401, msg: "La sesión ya no es válida, inicia sesión nuevamente" }
  }

  return { usuario: { ...sinSecretos(usuario), rol } }
}

// =============================
// VERIFICAR TOKEN
// Por defecto un cliente que aún usa la contraseña temporal NO puede usar la API (falla cerrado);
// solo las rutas creadas con `verificarSesion` (perfil, cambio de contraseña, logout) lo permiten.
// =============================
const crearVerificador = ({ permitirPasswordTemporal }) => async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Acceso denegado: token no proporcionado" })
  }

  try {
    const { usuario, codigo, msg } = await autenticarToken(authHeader.split(" ")[1])
    if (!usuario) return res.status(codigo).json({ msg })

    if (!permitirPasswordTemporal && usuario.rol === "cliente" && usuario.passwordTemporal === true) {
      return res.status(403).json({
        msg: "Debes cambiar tu contraseña temporal antes de continuar",
        cambiarPassword: true,
      })
    }

    // Compatibilidad con los controladores existentes
    if (usuario.rol === "carpintero") req.carpinteroHeader = usuario
    if (usuario.rol === "cliente") req.clienteHeader = usuario
    if (usuario.rol === "administrador") req.adminHeader = usuario

    // Estándar nuevo
    req.user = usuario
    next()
  } catch (error) {
    console.error(error)
    return res.status(500).json({ msg: "Error al validar la sesión" })
  }
}

const verificarTokenJWT = crearVerificador({ permitirPasswordTemporal: false })
const verificarSesion = crearVerificador({ permitirPasswordTemporal: true })

export { crearTokenJWT, verificarTokenJWT, verificarSesion, autenticarToken, invalidarSesiones }
