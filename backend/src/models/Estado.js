import { crear, obtener, actualizar, eliminar, buscar } from "../helpers/firestore.js"

const COLECCION = "estados"

export const PRIORIDADES = ["Baja", "Media", "Alta"]

export const Estado = {
    crear: (datos) => crear(COLECCION, { estadoPago: "Pendiente", ...datos }),
    porId: (id) => obtener(COLECCION, id),
    porProyecto: (proyectoId) => buscar(COLECCION, { proyecto: proyectoId }),
    actualizar: (id, cambios) => actualizar(COLECCION, id, cambios),
    eliminar: (id) => eliminar(COLECCION, id),
}

export default Estado
