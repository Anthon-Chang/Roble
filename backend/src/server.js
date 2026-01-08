import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'

import routerCarpinteros from './routers/carpintero_routes.js'
import planRoutes from "./routers/planRoutes.js";
import furnitureRoutes from './routers/furniture_routes.js';
import model3dRoutes from "./routers/model3d_routes.js";
import routerProyectos from './routers/proyecto_routes.js';

import fileUpload from "express-fileupload";

import authGoogleRoutes from "./routers/authGoogle_routes.js";

const app = express()
dotenv.config()

// Middlewares
app.use(express.json())
app.use(cors())

app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "./uploads",
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

// Rutas de carpinteros
app.use('/api/carpintero', routerCarpinteros)

// Rutas de proyectos
app.use("/api/proyecto", routerProyectos)

// Rutas de planes
app.use("/api/plans", planRoutes)

// Rutas de muebles
app.use('/api/v1/furniture', furnitureRoutes)

// Rutas de modelos 3D
app.use("/api/models", model3dRoutes);
//  Aquí debes ponerlo
app.use("/uploads", express.static("uploads"));
// Ruta no encontrada
app.use((req, res) => res.status(404).send("Endpoint no encontrado - 404"))

export default app
