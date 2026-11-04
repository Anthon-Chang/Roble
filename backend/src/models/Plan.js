import { crear, obtener, actualizar, eliminar, buscar } from "../helpers/firestore.js"

const COLECCION = "planos"

export const Plan = {
    crear: (datos) => crear(COLECCION, datos),
    porId: (id) => obtener(COLECCION, id),
    listar: () => buscar(COLECCION),
    actualizar: (id, cambios) => actualizar(COLECCION, id, cambios),
    eliminar: (id) => eliminar(COLECCION, id),
}

export default Plan
