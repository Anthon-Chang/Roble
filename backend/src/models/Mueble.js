import { crear, obtener, actualizar, eliminar, buscar } from "../helpers/firestore.js"

const COLECCION = "muebles"

export const Mueble = {
    crear: (datos) => crear(COLECCION, { imagenes: [], ...datos }),
    porId: (id) => obtener(COLECCION, id),
    listar: (filtros = {}) => buscar(COLECCION, filtros),
    actualizar: (id, cambios) => actualizar(COLECCION, id, cambios),
    eliminar: (id) => eliminar(COLECCION, id),
}

export default Mueble
