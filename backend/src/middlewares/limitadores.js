import { rateLimit } from "express-rate-limit"

// Los límites se cuentan por IP. Detrás de un proxy (Render, Netlify) hay que indicar TRUST_PROXY
// en server.js; si no, todos los usuarios compartirían la IP del proxy.
// RATE_LIMIT_DISABLED=true los desactiva (solo para pruebas automáticas); se lee en cada petición.
const crearLimitador = ({ ventanaMin, limite, msg, saltarExitosas = false }) =>
    rateLimit({
        windowMs: ventanaMin * 60 * 1000,
        limit: limite,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        skipSuccessfulRequests: saltarExitosas,
        skip: () => process.env.RATE_LIMIT_DISABLED === "true",
        message: { msg },
    })

// Toda la API
export const limitadorGeneral = crearLimitador({
    ventanaMin: 15,
    limite: 600,
    msg: "Demasiadas peticiones, intenta de nuevo más tarde",
})

// Inicios de sesión: frena la fuerza bruta de contraseñas (los éxitos no cuentan)
export const limitadorLogin = crearLimitador({
    ventanaMin: 15,
    limite: 10,
    saltarExitosas: true,
    msg: "Demasiados intentos de inicio de sesión, intenta de nuevo en unos minutos",
})

// Registro y recuperación de contraseña: evitan el abuso del envío de correos y la creación masiva de cuentas
export const limitadorCuentas = crearLimitador({
    ventanaMin: 60,
    limite: 10,
    msg: "Demasiadas solicitudes, intenta de nuevo más tarde",
})
