import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'

import routerCarpinteros from './routers/carpintero_routes.js'
import planRoutes from "./routers/planRoutes.js";

const app = express()
dotenv.config()

// Middlewares
app.use(express.json())
app.use(cors())

// Variables globales
app.set('port', process.env.PORT || 4000)

// Ruta principal
app.get('/', (req, res) => res.send("Server on"))

// -------------------------------
//  Rutas principales de la API
// -------------------------------

// Todo lo de carpinteros va aquí:
app.use('/api/carpintero', routerCarpinteros)

// Rutas de planes
app.use("/api/plans", planRoutes)

// Ruta no encontrada
app.use((req, res) => res.status(404).send("Endpoint no encontrado - 404"))

export default app
