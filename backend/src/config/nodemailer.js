import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Config Gmail
const gmailConfig = {
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
};

// Config Outlook
const outlookConfig = {
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.OUTLOOK_USER,
        pass: process.env.OUTLOOK_PASS,
    },
    tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
    },
};

// Config Mailtrap
const mailtrapConfig = {
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
    },
};

// Selección dinámica
const getTransportConfig = () => {
    switch (process.env.EMAIL_PROVIDER) {
        case "gmail":
            return gmailConfig;
        case "outlook":
            return outlookConfig;
        case "mailtrap":
            return mailtrapConfig;
        default:
            throw new Error("EMAIL_PROVIDER inválido (usa gmail | outlook | mailtrap)");
    }
};

const transporter = nodemailer.createTransport(getTransportConfig());

const sendMail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Roble" <${transporter.options.auth.user}>`,
            to,
            subject,
            html,
        });

        console.log("📨 Email enviado:", info.messageId);
    } catch (error) {
        console.log("❌ Error enviando email:", error.message);
    }
};

export default sendMail;
