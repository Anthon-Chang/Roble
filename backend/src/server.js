import './config/env.js'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import routerCarpinteros from './routers/carpintero_routes.js'
import planRoutes from "./routers/planRoutes.js";
import model3dRoutes from "./routers/model3d_routes.js";
import routerProyectos from './routers/proyecto_routes.js';
import routerEstado from './routers/estado_routes.js';
import routerAdmin from './routers/admin_routes.js';
import routerCliente from './routers/cliente_routes.js';
import routerMueble from './routers/mueble_routes.js';

import authGoogleRoutes from "./routers/authGoogle_routes.js";

import { opcionesCors } from './config/cors.js'
import { limitadorGeneral, limitadorLogin, limitadorCuentas } from './middlewares/limitadores.js'

const app = express()

// Detrás del proxy de la plataforma (Render) la IP real viene en X-Forwarded-For.
// TRUST_PROXY = número de proxies de confianza (1 en producción, 0 en local).
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? (process.env.NODE_ENV === 'production' ? 1 : 0)))

// Middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors(opcionesCors))
app.use(express.json())

// Límites de peticiones (por IP)
app.use('/api', limitadorGeneral)
app.post(
    [
        '/api/admin/login',
        '/api/carpintero/login',
        '/api/cliente/login',
        '/api/proyecto/login',
        '/api/auth/google',
    ],
    limitadorLogin
)
app.post(
    [
        '/api/carpintero/registro',
        '/api/cliente/registro',
        '/api/carpintero/recuperarpassword',
        '/api/cliente/recuperarpassword',
    ],
    limitadorCuentas
)

// Variables globales
app.set('port', process.env.PORT || 4000)

// Ruta principal
app.get('/', (req, res) => res.send("Server on"))

// Endpoint de diagnóstico (no expone configuración del servidor)
app.get('/api/ping', (req, res) => {
    res.status(200).json({ msg: 'pong' })
})

// -------------------------------
//  Rutas principales de la API
// -------------------------------

// Rutas de autenticación con Google y cierre de sesión
app.use("/api/auth", authGoogleRoutes);

// Rutas de administrador
app.use('/api/admin', routerAdmin)

// Rutas de carpinteros
app.use('/api/carpintero', routerCarpinteros)

// Rutas de clientes
app.use('/api/cliente', routerCliente)

// Rutas de mobiliario
app.use('/api/mueble', routerMueble)

// Rutas de proyectos
app.use("/api/proyecto", routerProyectos)

// Rutas de estados
app.use("/api/estado", routerEstado)

// Rutas de planes
app.use("/api/plans", planRoutes)

// Rutas de modelos 3D
app.use("/api/models", model3dRoutes);

// Ruta no encontrada
app.use((req, res) => res.status(404).send("Endpoint no encontrado - 404"))

// Errores no controlados: nunca se devuelve el mensaje interno al cliente
app.use((error, req, res, next) => {
    if (res.headersSent) return next(error)
    if (error.type === 'entity.parse.failed') return res.status(400).json({ msg: 'El cuerpo de la petición no es un JSON válido' })
    if (error.type === 'entity.too.large') return res.status(413).json({ msg: 'La petición es demasiado grande' })
    console.error(error)
    res.status(500).json({ msg: '❌ Error en el servidor' })
})

export default app
