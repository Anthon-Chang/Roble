// Firestore y Storage en memoria, con solo lo que usa el backend. Permite probar sin credenciales reales.
import { randomBytes } from "crypto"
import fs from "fs"

const copiar = (v) => structuredClone(v)

class Snap {
    constructor(id, data) { this.id = id; this._d = data }
    get exists() { return this._d !== undefined }
    data() { return copiar(this._d) }
}

class Consulta {
    constructor(coleccion, filtros = [], tope = 0) { this.c = coleccion; this.f = filtros; this.t = tope }
    where(campo, op, valor) {
        if (op !== "==") throw new Error("El simulado solo admite '=='")
        return new Consulta(this.c, [...this.f, [campo, valor]], this.t)
    }
    limit(n) { return new Consulta(this.c, this.f, n) }
    async get() {
        let docs = [...this.c.datos.entries()]
            .filter(([, d]) => this.f.every(([campo, valor]) => d[campo] === valor))
            .map(([id, d]) => new Snap(id, d))
        if (this.t) docs = docs.slice(0, this.t)
        return { docs, empty: docs.length === 0, size: docs.length }
    }
}

class Coleccion extends Consulta {
    constructor() { super(null); this.c = this; this.datos = new Map() }
    doc(id = randomBytes(10).toString("hex")) {
        const col = this
        return {
            id,
            async set(d) { col.datos.set(id, copiar(d)) },
            async get() { return new Snap(id, col.datos.get(id)) },
            async update(c) {
                if (!col.datos.has(id)) throw new Error("NOT_FOUND")
                col.datos.set(id, { ...col.datos.get(id), ...copiar(c) })
            },
            async delete() { col.datos.delete(id) },
        }
    }
}

export const crearFirestoreSimulado = () => {
    const colecciones = new Map()
    // Las transacciones se ejecutan de una en una, como si fueran atómicas
    let cola = Promise.resolve()
    return {
        runTransaction(fn) {
            const tx = { get: (ref) => ref.get(), update: (ref, cambios) => ref.update(cambios) }
            const resultado = cola.then(() => fn(tx))
            cola = resultado.catch(() => {})
            return resultado
        },
        collection(nombre) {
            if (!colecciones.has(nombre)) colecciones.set(nombre, new Coleccion())
            return colecciones.get(nombre)
        },
        settings() {},
    }
}

// Simula el SDK de Cloudinary (solo lo que usa helpers/storage.js).
// `archivos` se indexa por public_id; `tieneRuta` acepta tanto un public_id
// suelto como una ruta empaquetada "resource_type:public_id".
export const crearCloudinarySimulado = () => {
    const archivos = new Map()
    const idDe = (ruta) => {
        const i = ruta.indexOf(":")
        return i === -1 ? ruta : ruta.slice(i + 1)
    }
    return {
        archivos,
        tieneRuta: (ruta) => archivos.has(idDe(ruta)),
        uploader: {
            async upload(origen, { public_id }) {
                const buffer = typeof origen === "string" && origen.startsWith("data:")
                    ? Buffer.from(origen.split(",")[1], "base64")
                    : fs.readFileSync(origen)
                archivos.set(public_id, buffer)
                return { secure_url: `https://cloudinary-simulado.test/${public_id}`, public_id, resource_type: "raw" }
            },
            async destroy(public_id) {
                archivos.delete(public_id)
                return { result: "ok" }
            },
        },
    }
}
