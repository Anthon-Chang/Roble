// Allowlist de orígenes (CORS y Socket.IO). Cerrada por defecto: un origen que no esté en la lista
// no recibe cabeceras CORS y el navegador bloquea la respuesta.
//
// - CORS_ORIGINS (separados por comas) reemplaza la lista por defecto cuando está definida.
// - Sin la variable: el frontend de producción y, fuera de producción, el servidor de desarrollo local.
const FRONTEND_PRODUCCION = ["https://rob1e.netlify.app"]
const FRONTEND_LOCAL = ["http://localhost:5173", "http://127.0.0.1:5173"]

const normalizar = (origen) => String(origen).trim().replace(/\/+$/, "")

export const origenesPermitidos = () => {
    const configurados = (process.env.CORS_ORIGINS || "").split(",").map(normalizar).filter(Boolean)
    if (configurados.length > 0) return configurados
    return process.env.NODE_ENV === "production" ? FRONTEND_PRODUCCION : [...FRONTEND_PRODUCCION, ...FRONTEND_LOCAL]
}

// Las peticiones sin cabecera Origin (curl, servidor a servidor, mismo origen) no son de navegador
// cross-origin: no necesitan CORS y se autentican igualmente con el JWT.
export const origenPermitido = (origen) => !origen || origenesPermitidos().includes(normalizar(origen))

export const opcionesCors = {
    origin: (origen, callback) => callback(null, origenPermitido(origen)),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}
