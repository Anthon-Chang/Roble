import "../src/config/env.js"
import transporter from "../src/config/mailer.js"

console.log("Usuario:", process.env.GMAIL_USER)
console.log("Largo de la clave:", process.env.GMAIL_PASS?.length)

try {
  await transporter.verify()
  console.log("✅ Conexión y credenciales OK")
} catch (e) {
  console.log("❌", e.code, e.responseCode, e.message)
}
process.exit(0)