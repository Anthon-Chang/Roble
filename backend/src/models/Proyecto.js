import { crear, obtener, actualizar, buscar } from "../helpers/firestore.js"

const COLECCION = "proyectos"

// Campos que el carpintero puede editar en un proyecto existente.
export const CAMPOS_EDITABLES = [
    "nombreProyecto",
    "descripcionProyecto",
    "tipoMadera",
    "fechaEntrega",
    "nombreCliente",
    "cedulaCliente",
    "celularCliente",
]

export const Proyecto = {
    crear: (datos) =>
        crear(COLECCION, {
            tipoMadera: null,
            imagenProyecto: null,
            imagenProyectoPath: null,
            imagenProyectoIA: null,
            imagenProyectoIAPath: null,
            estadoProyecto: true,
            ...datos,
        }),
    porId: (id) => obtener(COLECCION, id),
    listar: (filtros = {}) => buscar(COLECCION, filtros),
    actualizar: (id, cambios) => actualizar(COLECCION, id, cambios),
}

export default Proyecto
