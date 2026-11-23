import { crear, buscar } from "../helpers/firestore.js"

const COLECCION = "mensajes"

// Chat persistente por proyecto (antes era un simple relay de Socket.IO sin guardar nada).
// remitente/remitenteRol/remitenteNombre se copian del usuario autenticado en el momento
// de enviar (no se confía en lo que mande el cliente).
export const Mensaje = {
    crear: (datos) => crear(COLECCION, datos),
    porProyecto: async (proyectoId) => {
        const mensajes = await buscar(COLECCION, { proyecto: proyectoId })
        return mensajes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    },
}

export default Mensaje
