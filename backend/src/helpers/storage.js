import crypto from "crypto"
import fs from "fs-extra"
import { getBucket } from "../config/firebase.js"

// URL pública con token de descarga (funciona aunque el bucket tenga acceso uniforme).
const construirUrl = (bucket, ruta, token) => {
    // Con el emulador de Storage la URL apunta al servidor local
    const emulador = process.env.FIREBASE_STORAGE_EMULATOR_HOST
    const origen = emulador ? `http://${emulador}` : "https://firebasestorage.googleapis.com"
    return `${origen}/v0/b/${bucket.name}/o/${encodeURIComponent(ruta)}?alt=media&token=${token}`
}

const rutaUnica = (carpeta, nombreOriginal = "archivo") => {
    const limpio = String(nombreOriginal).replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80)
    return `${carpeta}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${limpio}`
}

// Sube un archivo temporal (de express-fileupload) a Firebase Storage y borra el temporal.
export const subirArchivo = async (archivo, carpeta, { rutaFija } = {}) => {
    const bucket = getBucket()
    const destino = rutaFija || rutaUnica(carpeta, archivo.name)
    const token = crypto.randomUUID()
    try {
        await bucket.upload(archivo.tempFilePath, {
            destination: destino,
            metadata: {
                contentType: archivo.mimetype,
                metadata: { firebaseStorageDownloadTokens: token },
            },
        })
    } catch (error) {
        console.error("❌ Error al subir a Firebase Storage:", error.message)
        throw new Error("Error al subir el archivo")
    } finally {
        await fs.remove(archivo.tempFilePath).catch(() => {})
    }
    return { url: construirUrl(bucket, destino, token), path: destino }
}

// Sube una imagen recibida en base64 (por ejemplo, la generada con IA).
export const subirBase64 = async (base64, carpeta) => {
    const coincidencia = /^data:(image\/(?:png|jpe?g|webp|gif));base64,(.+)$/i.exec(String(base64))
    if (!coincidencia) throw new Error("Imagen en base64 no válida")
    const [, mimetype, contenido] = coincidencia
    const buffer = Buffer.from(contenido, "base64")
    if (buffer.length > 8 * 1024 * 1024) throw new Error("La imagen supera los 8 MB")

    const bucket = getBucket()
    const extension = mimetype.split("/")[1].replace("jpeg", "jpg")
    const destino = rutaUnica(carpeta, `ia.${extension}`)
    const token = crypto.randomUUID()
    try {
        await bucket.file(destino).save(buffer, {
            metadata: { contentType: mimetype, metadata: { firebaseStorageDownloadTokens: token } },
        })
    } catch (error) {
        console.error("❌ Error al subir base64 a Firebase Storage:", error.message)
        throw new Error("Error al subir la imagen en base64")
    }
    return { url: construirUrl(bucket, destino, token), path: destino }
}

export const eliminarArchivo = async (ruta) => {
    if (!ruta) return
    try {
        await getBucket().file(ruta).delete({ ignoreNotFound: true })
    } catch (error) {
        console.error("⚠️ No se pudo eliminar el archivo de Storage:", ruta, error.message)
    }
}
