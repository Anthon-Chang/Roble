import { crear, obtener, actualizar, buscar, buscarUno } from "../helpers/firestore.js"
import { normalizarEmail } from "../helpers/password.js"

const COLECCION = "clientes"

export const Cliente = {
    crear: (datos) =>
        crear(COLECCION, {
            nombre: "",
            apellido: "",
            cedula: "",
            celular: "",
            status: true,
            rol: "cliente",
            // true cuando el cliente aún usa la contraseña temporal enviada por un carpintero
            passwordTemporal: false,
            token: null,
            tokenExpira: null,
            ...datos,
            email: normalizarEmail(datos.email),
        }),
    porId: (id) => obtener(COLECCION, id),
    porEmail: (email) => buscarUno(COLECCION, { email: normalizarEmail(email) }),
    porToken: (token) => (token ? buscarUno(COLECCION, { token }) : null),
    porCedula: (cedula) => buscarUno(COLECCION, { cedula: String(cedula).trim() }),
    listar: (filtros = {}) => buscar(COLECCION, filtros),
    actualizar: (id, cambios) => actualizar(COLECCION, id, cambios),
}

export default Cliente
