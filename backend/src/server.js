import './config/env.js'
import express from 'express'
import cors from 'cors'

import routerCarpinteros from './routers/carpintero_routes.js'
import planRoutes from "./routers/planRoutes.js";
import furnitureRoutes from './routers/furniture_routes.js';
import model3dRoutes from "./routers/model3d_routes.js";
import routerProyectos from './routers/proyecto_routes.js';
import routerEstado from './routers/estado_routes.js';
import routerAdmin from './routers/admin_routes.js';
import routerCliente from './routers/cliente_routes.js';
import routerMueble from './routers/mueble_routes.js';

import fileUpload from "express-fileupload";

import authGoogleRoutes from "./routers/authGoogle_routes.js";

const app = express()

// Middlewares
app.use(express.json())


app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? "https://rob1e.netlify.app"
    : true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));


// 👇 MUY IMPORTANTE para preflight
//app.options("*", cors());


app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "./uploads",
        limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB (modelos 3D); cada tipo de archivo valida su propio límite
        abortOnLimit: true,
        limitHandler: (req, res) => res.status(413).json({ msg: "El archivo supera el tamaño máximo permitido" }),
    })
);

// Variables globales
app.set('port', process.env.PORT || 4000)

// Ruta principal
app.get('/', (req, res) => res.send("Server on"))

// Endpoint de diagnóstico general
app.get('/api/ping', (req, res) => {
    res.status(200).json({ msg: 'pong', env: process.env.NODE_ENV || 'development' })
})

// Endpoint de prueba específico para proyectos
app.get('/api/proyecto/test', (req, res) => {
    res.status(200).json({ msg: 'proyecto test OK' })
})

// Endpoint que lista rutas registradas (incluye routers anidados)
app.get('/api/routes', (req, res) => {
    const routes = [];
    const debug = [];

    const router = app._router || null;
    const stack = router && router.stack ? router.stack : [];
    stack.forEach((layer, idx) => {
        const info = {
            index: idx,
            name: layer.name,
            path: layer.route ? layer.route.path : undefined,
            methods: layer.route ? Object.keys(layer.route.methods) : undefined,
            regexp: layer.regexp ? layer.regexp.source : undefined,
            handleStackLength: layer.handle && layer.handle.stack ? layer.handle.stack.length : undefined
        };
        debug.push(info);
        // try to parse nested router routes
        if (layer.name === 'router' && layer.handle && layer.handle.stack) {
            const mountPrefix = layer.regexp && layer.regexp.source ? layer.regexp.source.replace('^','').replace('\\/?(?=\\/|$)','').replace(/\\\//g,'/') : '';
            layer.handle.stack.forEach((nl) => {
                if (nl.route && nl.route.path) {
                    const methods = Object.keys(nl.route.methods).map(m => m.toUpperCase()).join(',');
                    routes.push({ path: mountPrefix + nl.route.path, methods });
                }
            })
        } else if (layer.route && layer.route.path) {
            const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(',');
            routes.push({ path: layer.route.path, methods });
        }
    });

    // Deduplicate and sort
    const unique = Array.from(new Map(routes.map(r => [r.methods + ' ' + r.path, r])).values());
    unique.sort((a,b) => a.path.localeCompare(b.path));

    res.json({ routes: unique, debug, hasRouter: !!router, routerKeys: router ? Object.keys(router) : [] });
});

// -------------------------------
//  Rutas principales de la API
// -------------------------------

// Rutas de autenticación con Google
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

// Rutas de muebles
app.use('/api/v1/furniture', furnitureRoutes)

// Rutas de modelos 3D
app.use("/api/models", model3dRoutes);
// Ruta no encontrada
app.use((req, res) => res.status(404).send("Endpoint no encontrado - 404"))

export default app
