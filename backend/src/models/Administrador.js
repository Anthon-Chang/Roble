import { crear, obtener, buscarUno } from "../helpers/firestore.js"
import { normalizarEmail } from "../helpers/password.js"

const COLECCION = "administradores"

export const Administrador = {
    crear: (datos) =>
        crear(COLECCION, { nombre: "Administrador", status: true, rol: "administrador", ...datos, email: normalizarEmail(datos.email) }),
    porId: (id) => obtener(COLECCION, id),
    porEmail: (email) => buscarUno(COLECCION, { email: normalizarEmail(email) }),
}

export default Administrador
