import { crear, obtener, actualizar, eliminar, buscar } from "../helpers/firestore.js"

const COLECCION = "modelos3d"

export const Model3D = {
    crear: (datos) => crear(COLECCION, { description: "", modelPath: null, formato: null, ...datos }),
    porId: (id) => obtener(COLECCION, id),
    listar: (filtros = {}) => buscar(COLECCION, filtros),
    actualizar: (id, cambios) => actualizar(COLECCION, id, cambios),
    eliminar: (id) => eliminar(COLECCION, id),
}

export default Model3D
