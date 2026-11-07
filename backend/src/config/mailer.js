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
})

export const REMITENTE = `"ROBLE" <${process.env.GMAIL_USER}>`

// nodemailer lanza una excepción si el envío falla, así los try/catch sí funcionan
export const enviar = (datos) => transporter.sendMail({ from: REMITENTE, ...datos })

export default transporter