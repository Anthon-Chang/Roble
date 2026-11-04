import { crear, obtener, actualizar, buscar, buscarUno } from "../helpers/firestore.js"
import { normalizarEmail } from "../helpers/password.js"

const COLECCION = "carpinteros"

export const ESTADOS_APROBACION = ["pendiente", "aprobado", "rechazado"]

// Solo estos campos se aceptan al registrar un carpintero (evita que el cliente envíe rol, estadoAprobacion, etc.).
export const CAMPOS_REGISTRO = ["nombre", "apellido", "direccion", "celular", "email", "password", "anios_experiencia"]

export const Carpintero = {
    crear: (datos) =>
        crear(COLECCION, {
            nombre: "",
            apellido: "",
            direccion: null,
            celular: null,
            anios_experiencia: 0,
            status: true,
            token: null,
            tokenExpira: null,
            confirmEmail: false,
            rol: "carpintero",
            provider: "local",
            estadoAprobacion: "pendiente",
            motivoRechazo: null,
            cvUrl: null,
            cvPath: null,
            cvActualizado: null,
            ...datos,
            email: normalizarEmail(datos.email),
        }),
    porId: (id) => obtener(COLECCION, id),
    porEmail: (email) => buscarUno(COLECCION, { email: normalizarEmail(email) }),
    porToken: (token) => (token ? buscarUno(COLECCION, { token }) : null),
    listar: (filtros = {}) => buscar(COLECCION, filtros),
    actualizar: (id, cambios) => actualizar(COLECCION, id, cambios),
}

export default Carpintero
