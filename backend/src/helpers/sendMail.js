import resend from "../config/resend.js"

const REMITENTE = "ROBLE <onboarding@resend.dev>" // Cambia por tu dominio verificado en producción

const escaparHtml = (texto) =>
  String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]))

// =====================================
// ENVÍO DE CORREO PARA REGISTRO
// =====================================
const sendMailToRegister = async (userMail, token) => {
  return await resend.emails.send({
    from: REMITENTE,
    to: [userMail],
    subject: "Bienvenido a ROBLE 🪚🧰",
    html: `
      <h1>Confirma tu cuenta</h1>
      <p>Hola, haz clic en el siguiente enlace para confirmar tu cuenta:</p>
      <a href="${process.env.URL_FRONTEND}confirm/${token}">
        Confirmar cuenta
      </a>
      <hr>
      <footer>El equipo de ROBLE te da la bienvenida.</footer>
    `,
  })
}

// =====================================
// ENVÍO DE CORREO PARA RECUPERAR PASSWORD
// =====================================
const sendMailToRecoveryPassword = async (userMail, token) => {
  return await resend.emails.send({
    from: REMITENTE,
    to: [userMail],
    subject: "Recupera tu contraseña - ROBLE",
    html: `
      <h1>ROBLE 🪚🧰</h1>
      <p>Has solicitado restablecer tu contraseña. El enlace es válido por 1 hora.</p>
      <a href="${process.env.URL_FRONTEND}reset/${token}">
        Clic para restablecer tu contraseña
      </a>
      <hr>
      <footer>El equipo de ROBLE está para ayudarte.</footer>
    `,
  })
}

// =====================================
// ENVÍO DE CORREO CON CREDENCIALES PARA CLIENTE
// =====================================
const sendMailToOwner = async (userMail, password) => {
  return await resend.emails.send({
    from: REMITENTE,
    to: [userMail],
    subject: "Bienvenido a ROBLE - Tus credenciales de acceso",
    html: `
      <h1>ROBLE 🪚🧰</h1>
      <p>Gracias por unirte a nuestra plataforma.</p>
      <p>A continuación encontrarás tus credenciales de acceso:</p>

      <p><strong>Contraseña temporal:</strong> ${escaparHtml(password)}</p>

      <a href="${process.env.URL_FRONTEND}login">Iniciar sesión</a>

      <hr>
      <footer>El equipo de <strong>ROBLE</strong> está para servirte.</footer>
    `,
  })
}

// =====================================
// RESULTADO DE LA REVISIÓN DEL PERFIL DEL CARPINTERO (HU-002)
// =====================================
const sendMailEstadoPerfil = async (userMail, estado, motivo) => {
  const aprobado = estado === "aprobado"
  return await resend.emails.send({
    from: REMITENTE,
    to: [userMail],
    subject: aprobado ? "Tu perfil fue aprobado - ROBLE" : "Tu perfil fue rechazado - ROBLE",
    html: aprobado
      ? `<h1>ROBLE 🪚🧰</h1>
         <p>Tu perfil fue aprobado. Ya puedes publicar mobiliario, modelos 3D y recibir proyectos.</p>
         <a href="${process.env.URL_FRONTEND}login">Iniciar sesión</a>`
      : `<h1>ROBLE 🪚🧰</h1>
         <p>Tu perfil fue rechazado por el administrador.</p>
         <p><strong>Motivo:</strong> ${escaparHtml(motivo || "No especificado")}</p>
         <p>Puedes corregir tu información, subir nuevamente tu CV y se revisará otra vez.</p>`,
  })
}

// =====================================
// AVISO AL ADMINISTRADOR: NUEVO CV POR REVISAR (HU-004)
// =====================================
const sendMailNuevoCV = async (adminMail, nombreCarpintero) => {
  return await resend.emails.send({
    from: REMITENTE,
    to: [adminMail],
    subject: "Nuevo CV pendiente de revisión - ROBLE",
    html: `
      <h1>ROBLE 🪚🧰</h1>
      <p>El carpintero <strong>${escaparHtml(nombreCarpintero)}</strong> subió su CV y su perfil está pendiente de revisión.</p>
    `,
  })
}

export { sendMailToRegister, sendMailToRecoveryPassword, sendMailToOwner, sendMailEstadoPerfil, sendMailNuevoCV }
