import { OAuth2Client } from "google-auth-library"
import Carpintero from "../models/carpintero.js"
import { crearTokenJWT } from "../middlewares/JWT.js"
import { crearTokenAleatorio, encryptPassword } from "../helpers/password.js"

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export const loginGoogle = async (req, res) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({ msg: "Falta el token de Google" })
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const { email, given_name, family_name, email_verified } = ticket.getPayload()

    if (!email || !email_verified) {
      return res.status(401).json({ msg: "La cuenta de Google no tiene el correo verificado" })
    }

    let user = await Carpintero.porEmail(email)

    if (user) {
      // Cuenta existente (registro normal): se vincula con Google y queda confirmada
      if (user.status === false) {
        return res.status(403).json({ msg: "Tu cuenta está desactivada" })
      }
      if (!user.confirmEmail || user.provider !== "google") {
        user = await Carpintero.actualizar(user._id, { confirmEmail: true, provider: "google" })
      }
    } else {
      // Cuenta nueva: queda pendiente de aprobación hasta que el admin revise su CV
      user = await Carpintero.crear({
        nombre: given_name || "Usuario",
        apellido: family_name || "",
        email,
        password: await encryptPassword(crearTokenAleatorio()),
        confirmEmail: true,
        provider: "google",
      })
    }

    res.json({
      token: crearTokenJWT(user._id, user.rol, user.tokenVersion),
      rol: user.rol,
      estadoAprobacion: user.estadoAprobacion,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Error al iniciar sesión con Google" })
  }
}
