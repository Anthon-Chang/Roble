import { crear, obtener, actualizar, eliminar, buscar } from "../helpers/firestore.js"

const COLECCION = "quejas"

export const TIPOS = ["queja", "sugerencia"]
export const ESTADOS_QUEJA = ["pendiente", "en_seguimiento", "resuelta"]

// Las sugerencias no tienen flujo de estados: se consultan y se borran directamente.
// Los reclamos (tipo "queja") sí: pendiente -> en_seguimiento -> resuelta, y solo se pueden
// borrar una vez resueltos (HU-016).
export const Queja = {
    crear: (datos) =>
        crear(COLECCION, {
            estado: "pendiente",
            carpintero: null,
            evidenciaUrl: null,
            evidenciaPath: null,
            ...datos,
        }),
    porId: (id) => obtener(COLECCION, id),
    listar: (filtros = {}) => buscar(COLECCION, filtros),
    actualizar: (id, cambios) => actualizar(COLECCION, id, cambios),
    eliminar: (id) => eliminar(COLECCION, id),
}

export default Queja
