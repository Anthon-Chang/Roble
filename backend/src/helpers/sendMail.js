import sendMail from "../config/nodemailer.js"

// =====================================
// ENVÍO DE CORREO PARA REGISTRO
// =====================================
const sendMailToRegister = (userMail, token) => {
    return sendMail(
        userMail,
        "Bienvenido a SMARTCARP 🪚🧰", 
        ` 
            <h1>Confirma tu cuenta</h1> 
            <p>Hola, haz clic en el siguiente enlace para confirmar tu cuenta:</p> 
            <a href="${process.env.URL_FRONTEND}confirm/${token}"> 
            Confirmar cuenta 
            </a> 
            <hr> 
            <footer>El equipo de SMARTCARP te da la bienvenida.</footer> 
        `
    )
}

// =====================================
// ENVÍO DE CORREO PARA RECUPERAR PASSWORD
// =====================================
const sendMailToRecoveryPassword = (userMail, token) => {

    return sendMail(
        userMail,
        "Recupera tu contraseña - SMARTCARP",
        `
            <h1>SMARTCARP 🪚🧰</h1>
            <p>Has solicitado restablecer tu contraseña.</p>
            <a href="${process.env.URL_FRONTEND}reset/${token}">
            Clic para restablecer tu contraseña
            </a>
            <hr>
            <footer>El equipo de SMARTCARP está para ayudarte.</footer>
        `
    )
}

export {
sendMailToRegister,
sendMailToRecoveryPassword
}