// Crea (o actualiza la contraseña de) el administrador inicial.
// Uso: npm run crear-admin   (lee ADMIN_EMAIL, ADMIN_PASSWORD y ADMIN_NOMBRE del .env)
import "../src/config/env.js"
import { getDb } from "../src/config/firebase.js"
import Administrador from "../src/models/Administrador.js"
import { encryptPassword, emailValido } from "../src/helpers/password.js"
import { actualizar } from "../src/helpers/firestore.js"

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NOMBRE } = process.env

if (!emailValido(ADMIN_EMAIL) || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
    console.error("❌ Define ADMIN_EMAIL (válido) y ADMIN_PASSWORD (mínimo 8 caracteres) en el .env")
    process.exit(1)
}

getDb()
const password = await encryptPassword(ADMIN_PASSWORD)
const existente = await Administrador.porEmail(ADMIN_EMAIL)

if (existente) {
    await actualizar("administradores", existente._id, { password })
    console.log(`✅ Contraseña del administrador ${existente.email} actualizada`)
} else {
    const admin = await Administrador.crear({ nombre: ADMIN_NOMBRE || "Administrador", email: ADMIN_EMAIL, password })
    console.log(`✅ Administrador ${admin.email} creado`)
}
process.exit(0)
