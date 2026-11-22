import { crear, obtener, actualizar, buscar } from "../helpers/firestore.js"

const COLECCION = "sanciones"

// Niveles de gravedad (HU-017): retención del pago del mueble, suspensión temporal o permanente.
export const NIVELES_SANCION = ["retencion_pago", "suspension_temporal", "suspension_permanente"]

export const Sancion = {
    crear: (datos) =>
        crear(COLECCION, {
            activa: true,
            evidenciaUrl: null,
            evidenciaPath: null,
            quejaRelacionada: null,
            diasSuspension: null,
            finSuspension: null,
            ...datos,
        }),
    porId: (id) => obtener(COLECCION, id),
    listar: (filtros = {}) => buscar(COLECCION, filtros),
    actualizar: (id, cambios) => actualizar(COLECCION, id, cambios),
}

export default Sancion
