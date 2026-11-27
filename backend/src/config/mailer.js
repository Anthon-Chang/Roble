import "./env.js"

// Render (y otros hosts gratuitos) bloquean el tráfico saliente por los puertos SMTP
// (25, 465, 587), así que Gmail/nodemailer nunca llega a conectar en producción y el
// correo falla en silencio (el error se atrapa y solo se loguea). Resend usa su API
// HTTP sobre el puerto 443, que esos hosts sí permiten.
const RESEND_API_URL = "https://api.resend.com/emails"

export const REMITENTE = process.env.RESEND_FROM || "ROBLE <onboarding@resend.dev>"

// Lanza una excepción si el envío falla, igual que antes, así los try/catch existentes siguen funcionando
export const enviar = async ({ to, subject, html }) => {
  const respuesta = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: REMITENTE, to, subject, html }),
  })

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "")
    throw new Error(`Resend respondió ${respuesta.status}: ${detalle}`)
  }

  return respuesta.json()
}

export default { enviar }
