import "./env.js"
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  // El certificado del SMTP se valida siempre; solo se relaja con una variable explícita (p. ej. un servidor local de pruebas)
  tls: { rejectUnauthorized: process.env.SMTP_ALLOW_SELF_SIGNED !== "true" },
})

export const REMITENTE = `"ROBLE" <${process.env.GMAIL_USER}>`

// nodemailer lanza una excepción si el envío falla, así los try/catch sí funcionan
export const enviar = (datos) => transporter.sendMail({ from: REMITENTE, ...datos })

export default transporter