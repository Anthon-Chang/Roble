// Migra los datos del emulador (Firestore + Storage) hacia Firebase real + Cloudinary.
//
// Paso 1 — con el backend aún apuntando al EMULADOR (FIRESTORE_EMULATOR_HOST en tu .env)
// y las credenciales de Cloudinary ya puestas, levanta el emulador con los datos importados:
//   firebase emulators:start --only firestore --import=./emulator-data
// y en otra terminal corre:
//   npm run migrar:exportar
// Esto sube cada archivo de emulator-data/storage_export a Cloudinary y guarda todas las
// colecciones (con las URLs ya actualizadas) en scripts/migracion-dump.json.
//
// Paso 2 — cuando tengas tu proyecto de Firebase real y sus credenciales en el .env
// (y hayas comentado FIRESTORE_EMULATOR_HOST), corre:
//   npm run migrar:importar
// Esto escribe cada documento del volcado en tu Firestore real, con el mismo id que tenía
// (se puede correr varias veces sin duplicar nada).
import "../src/config/env.js"
import fs from "fs-extra"
import path from "path"
import { fileURLToPath } from "url"
import { getDb } from "../src/config/firebase.js"
import { getCloudinary } from "../src/config/cloudinary.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RUTA_DUMP = path.join(__dirname, "migracion-dump.json")
const RUTA_STORAGE_EXPORT = path.join(__dirname, "..", "emulator-data", "storage_export")

// Colección -> pares [campoUrl, campoPath] a reescribir. "muebles" se trata aparte (arreglo).
const CAMPOS = {
    administradores: [["fotoUrl", "fotoPath"]],
    carpinteros: [
        ["cvUrl", "cvPath"],
        ["fotoUrl", "fotoPath"],
    ],
    clientes: [["fotoUrl", "fotoPath"]],
    modelos3d: [["modelUrl", "modelPath"]],
    proyectos: [
        ["imagenProyecto", "imagenProyectoPath"],
        ["imagenProyectoIA", "imagenProyectoIAPath"],
    ],
    quejas: [["evidenciaUrl", "evidenciaPath"]],
    sanciones: [["evidenciaUrl", "evidenciaPath"]],
    planos: [["image_url", "image_path"]],
    propuestas: [["modelUrl", "modelPath"]],
}
const COLECCIONES = [...Object.keys(CAMPOS), "muebles"]

// Índice: ruta original en Storage -> { blob en disco, contentType }
const cargarIndiceStorage = async () => {
    const indice = new Map()
    const dirMetadata = path.join(RUTA_STORAGE_EXPORT, "metadata")
    if (!(await fs.pathExists(dirMetadata))) return indice
    for (const archivo of await fs.readdir(dirMetadata)) {
        const meta = await fs.readJson(path.join(dirMetadata, archivo))
        const blobId = path.basename(archivo, ".json")
        indice.set(meta.name, { blob: path.join(RUTA_STORAGE_EXPORT, "blobs", blobId), contentType: meta.contentType })
    }
    return indice
}

// Sube (una sola vez por ruta, con caché) un archivo exportado del emulador a Cloudinary.
const subirACloudinary = async (rutaVieja, info, cache) => {
    if (cache.has(rutaVieja)) return cache.get(rutaVieja)
    const resultado = await getCloudinary().uploader.upload(info.blob, {
        public_id: rutaVieja,
        resource_type: "auto",
        use_filename: false,
        unique_filename: false,
    })
    const nuevo = { url: resultado.secure_url, path: `${resultado.resource_type}:${resultado.public_id}` }
    cache.set(rutaVieja, nuevo)
    return nuevo
}

const exportar = async () => {
    const indiceStorage = await cargarIndiceStorage()
    console.log(`📦 ${indiceStorage.size} archivo(s) encontrados en el export de Storage`)
    const cacheSubidas = new Map()
    const volcado = {}

    for (const coleccion of COLECCIONES) {
        const snap = await getDb().collection(coleccion).get()
        volcado[coleccion] = []
        for (const doc of snap.docs) {
            const datos = doc.data()

            if (coleccion === "muebles" && Array.isArray(datos.imagenes)) {
                datos.imagenes = await Promise.all(
                    datos.imagenes.map(async (img) =>
                        img?.path && indiceStorage.has(img.path)
                            ? subirACloudinary(img.path, indiceStorage.get(img.path), cacheSubidas)
                            : img
                    )
                )
            }

            for (const [campoUrl, campoPath] of CAMPOS[coleccion] || []) {
                const rutaVieja = datos[campoPath]
                if (rutaVieja && indiceStorage.has(rutaVieja)) {
                    const subido = await subirACloudinary(rutaVieja, indiceStorage.get(rutaVieja), cacheSubidas)
                    datos[campoUrl] = subido.url
                    datos[campoPath] = subido.path
                }
            }

            volcado[coleccion].push({ id: doc.id, datos })
        }
        console.log(`  • ${coleccion}: ${volcado[coleccion].length} documento(s)`)
    }

    await fs.writeJson(RUTA_DUMP, volcado, { spaces: 2 })
    console.log(`✅ Volcado guardado en ${RUTA_DUMP} (${cacheSubidas.size} archivo(s) subidos a Cloudinary)`)
}

const importar = async () => {
    if (!(await fs.pathExists(RUTA_DUMP))) {
        console.error(`❌ No existe ${RUTA_DUMP}. Corre primero: npm run migrar:exportar`)
        process.exit(1)
    }
    if (process.env.FIRESTORE_EMULATOR_HOST) {
        console.error(
            "❌ FIRESTORE_EMULATOR_HOST sigue definido en tu .env: esto escribiría en el emulador, no en Firebase real. Coméntalo y vuelve a intentar."
        )
        process.exit(1)
    }
    const volcado = await fs.readJson(RUTA_DUMP)
    const db = getDb()
    for (const [coleccion, documentos] of Object.entries(volcado)) {
        for (const { id, datos } of documentos) {
            await db.collection(coleccion).doc(id).set(datos)
        }
        console.log(`  • ${coleccion}: ${documentos.length} documento(s) escritos`)
    }
    console.log("✅ Migración a Firebase real completada")
}

const modo = process.argv[2]
if (modo === "exportar") await exportar()
else if (modo === "importar") await importar()
else {
    console.log("Uso: node scripts/migrarDatos.js <exportar|importar>")
    process.exit(1)
}
