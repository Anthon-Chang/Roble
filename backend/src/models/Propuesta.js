import { crear, obtener, actualizar, eliminar, buscar } from "../helpers/firestore.js"

const COLECCION = "propuestas"

export const ESTADOS_PROPUESTA = ["Pendiente", "Aprobada", "Rechazada"]

export const Propuesta = {
    crear: (datos) => crear(COLECCION, { estado: "Pendiente", motivoRechazo: null, ...datos }),
    porId: (id) => obtener(COLECCION, id),
    porProyecto: (proyectoId) => buscar(COLECCION, { proyecto: proyectoId }),
    actualizar: (id, cambios) => actualizar(COLECCION, id, cambios),
    eliminar: (id) => eliminar(COLECCION, id),
}

export default Propuesta
