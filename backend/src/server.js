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
