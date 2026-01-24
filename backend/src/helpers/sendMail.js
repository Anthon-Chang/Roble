import sendMail from "../config/nodemailer.js"
import resend from "../config/resend.js";

// =====================================
// ENVÍO DE CORREO PARA REGISTRO
// =====================================
const sendMailToRegister = async (userMail, token) => {
  return await resend.emails.send({
    from: "ROBLE <onboarding@resend.dev>", // Cambia por tu dominio en producción
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
  });
};

// =====================================
// ENVÍO DE CORREO PARA RECUPERAR PASSWORD
// =====================================
const sendMailToRecoveryPassword = async(userMail, token) => {
    return await resend.emails.send({
    from: "ROBLE <onboarding@resend.dev>", // sin dominio
    to: [userMail],
    subject: "Recupera tu contraseña - SMARTCARP",
    html: `
      <h1>ROBLE 🪚🧰</h1>
      <p>Has solicitado restablecer tu contraseña.</p>
      <a href="${process.env.URL_FRONTEND}reset/${token}">
        Clic para restablecer tu contraseña
      </a>
      <hr>
      <footer>El equipo de ROBLE está para ayudarte.</footer>
    `,
  });
};

// =====================================
// ENVÍO DE CORREO CON CREDENCIALES PARA CLIENTE
// =====================================
const sendMailToOwner  = async(userMail, password) => {
    return await resend.emails.send({
        from: "ROBLE <onboarding@resend.dev>", // sin dominio
        to: [userMail],
        subject: "Bienvenido a ROBLE - Tus credenciales de acceso",
        html: `
            <h1>ROBLE 🪚🧰</h1>
            <p>Gracias por unirte a nuestra plataforma.</p>
            <p>A continuación encontrarás tus credenciales de acceso:</p>

            <p><strong>Contraseña temporal:</strong> ${password}</p>

            <a href="${process.env.URL_FRONTEND}login">Iniciar sesión</a>

            <hr>
            <footer>El equipo de <strong>ROBLE</strong> está para servirte.</footer>
        `
    });
}

export {
    sendMailToRegister,
    sendMailToRecoveryPassword,
    sendMailToOwner 
}