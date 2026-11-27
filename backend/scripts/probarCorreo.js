import "../src/config/env.js"
import { enviar } from "../src/config/mailer.js"

console.log("RESEND_API_KEY presente:", Boolean(process.env.RESEND_API_KEY))

const destino = process.argv[2]
if (!destino) {
  console.log("Uso: node scripts/probarCorreo.js correo@ejemplo.com")
  process.exit(1)
}

try {
  const resultado = await enviar({ to: [destino], subject: "Prueba ROBLE", html: "<p>Correo de prueba</p>" })
  console.log("✅ Enviado:", resultado)
} catch (e) {
  console.log("❌", e.message)
}
process.exit(0)
