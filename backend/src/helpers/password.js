import bcrypt from "bcryptjs"
import crypto from "crypto"

export const encryptPassword = async (password) => {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
}

export const matchPassword = (password, hash) => {
    if (!password || !hash) return false
    return bcrypt.compare(String(password), hash)
}

// Token aleatorio criptográficamente seguro (confirmación de correo, recuperación de contraseña).
export const crearTokenAleatorio = () => crypto.randomBytes(24).toString("hex")

// Contraseña temporal legible para el cliente creado por un carpintero.
export const crearPasswordTemporal = () => "CLI" + crypto.randomBytes(8).toString("hex").toUpperCase()

export const emailValido = (email) => typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

export const normalizarEmail = (email) => String(email || "").trim().toLowerCase()
