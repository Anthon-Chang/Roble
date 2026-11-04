import { getDb } from "../config/firebase.js"

// Convierte Timestamps de Firestore a Date para que JSON los serialice como ISO.
const convertirFechas = (valor) => {
    if (valor && typeof valor.toDate === "function") return valor.toDate()
    if (Array.isArray(valor)) return valor.map(convertirFechas)
    if (valor && typeof valor === "object" && !(valor instanceof Date)) {
        return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, convertirFechas(v)]))
    }
    return valor
}

// Devuelve el documento con `_id` (compatible con el frontend, que venía de MongoDB) e `id`.
export const aDocumento = (snap) => {
    if (!snap || !snap.exists) return null
    return { _id: snap.id, id: snap.id, ...convertirFechas(snap.data()) }
}

export const crear = async (coleccion, datos) => {
    const ahora = new Date()
    const ref = getDb().collection(coleccion).doc()
    const documento = { ...datos, createdAt: ahora, updatedAt: ahora }
    await ref.set(documento)
    return { _id: ref.id, id: ref.id, ...documento }
}

export const obtener = async (coleccion, id) => {
    if (!id || typeof id !== "string") return null
    const snap = await getDb().collection(coleccion).doc(id).get()
    return aDocumento(snap)
}

export const actualizar = async (coleccion, id, cambios) => {
    const ref = getDb().collection(coleccion).doc(id)
    await ref.update({ ...cambios, updatedAt: new Date() })
    return aDocumento(await ref.get())
}

export const eliminar = async (coleccion, id) => {
    await getDb().collection(coleccion).doc(id).delete()
}

// Búsqueda por igualdad de campos (no requiere índices compuestos en Firestore).
export const buscar = async (coleccion, filtros = {}, limite = 0) => {
    let consulta = getDb().collection(coleccion)
    for (const [campo, valor] of Object.entries(filtros)) {
        consulta = consulta.where(campo, "==", valor)
    }
    if (limite > 0) consulta = consulta.limit(limite)
    const resultado = await consulta.get()
    return resultado.docs.map(aDocumento)
}

export const buscarUno = async (coleccion, filtros) => {
    const [primero] = await buscar(coleccion, filtros, 1)
    return primero || null
}

// Ordena por createdAt descendente en memoria.
export const masRecientesPrimero = (lista) =>
    [...lista].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

// Quita campos sensibles antes de enviar un usuario al cliente.
export const sinSecretos = (usuario, extra = []) => {
    if (!usuario) return usuario
    const ocultos = new Set(["password", "token", "tokenExpira", ...extra])
    return Object.fromEntries(Object.entries(usuario).filter(([clave]) => !ocultos.has(clave)))
}
