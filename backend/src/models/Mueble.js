import { crear, obtener, actualizar, eliminar, buscar } from "../helpers/firestore.js"

const COLECCION = "muebles"

export const Mueble = {
    // fechaEntrega: fecha de entrega del mueble, la fija el carpintero en el catálogo
    crear: (datos) => crear(COLECCION, { imagenes: [], fechaEntrega: null, ...datos }),
    porId: (id) => obtener(COLECCION, id),
    listar: (filtros = {}) => buscar(COLECCION, filtros),
    actualizar: (id, cambios) => actualizar(COLECCION, id, cambios),
    eliminar: (id) => eliminar(COLECCION, id),
}

export default Mueble
