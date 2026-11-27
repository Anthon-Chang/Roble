import fs from "fs-extra"
import crypto from "crypto"
import { getCloudinary } from "../config/cloudinary.js"

const rutaUnica = (carpeta, nombreOriginal = "archivo") => {
    const limpio = String(nombreOriginal).replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80)
    return `${carpeta}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${limpio}`
}

// `path` viaja como "<resource_type>:<public_id>" para poder borrar el archivo
// correcto más tarde (Cloudinary exige el resource_type exacto al eliminar).
const empaquetarRuta = (resourceType, publicId) => `${resourceType}:${publicId}`
const desempaquetarRuta = (ruta) => {
    const i = ruta.indexOf(":")
    return i === -1 ? { resourceType: "image", publicId: ruta } : { resourceType: ruta.slice(0, i), publicId: ruta.slice(i + 1) }
}

// Sube un archivo temporal (de express-fileupload) a Cloudinary y borra el temporal.
export const subirArchivo = async (archivo, carpeta, { rutaFija } = {}) => {
    const cloudinary = getCloudinary()
    const publicId = rutaFija || rutaUnica(carpeta, archivo.name)
    try {
        const resultado = await cloudinary.uploader.upload(archivo.tempFilePath, {
            public_id: publicId,
            resource_type: "auto",
            overwrite: Boolean(rutaFija),
            invalidate: Boolean(rutaFija),
            use_filename: false,
            unique_filename: false,
        })
        return { url: resultado.secure_url, path: empaquetarRuta(resultado.resource_type, resultado.public_id) }
    } catch (error) {
        console.error("❌ Error al subir a Cloudinary:", error.message)
        throw new Error("Error al subir el archivo")
    } finally {
        await fs.remove(archivo.tempFilePath).catch(() => {})
    }
}

// Sube una imagen recibida en base64 (por ejemplo, la generada con IA).
export const subirBase64 = async (base64, carpeta) => {
    const coincidencia = /^data:(image\/(?:png|jpe?g|webp|gif));base64,(.+)$/i.exec(String(base64))
    if (!coincidencia) throw new Error("Imagen en base64 no válida")
    const [, mimetype, contenido] = coincidencia
    const buffer = Buffer.from(contenido, "base64")
    if (buffer.length > 8 * 1024 * 1024) throw new Error("La imagen supera los 8 MB")

    const cloudinary = getCloudinary()
    const publicId = rutaUnica(carpeta, "ia")
    try {
        const resultado = await cloudinary.uploader.upload(`data:${mimetype};base64,${contenido}`, {
            public_id: publicId,
            resource_type: "image",
        })
        return { url: resultado.secure_url, path: empaquetarRuta(resultado.resource_type, resultado.public_id) }
    } catch (error) {
        console.error("❌ Error al subir base64 a Cloudinary:", error.message)
        throw new Error("Error al subir la imagen en base64")
    }
}

export const eliminarArchivo = async (ruta) => {
    if (!ruta) return
    const { resourceType, publicId } = desempaquetarRuta(ruta)
    try {
        await getCloudinary().uploader.destroy(publicId, { resource_type: resourceType, invalidate: true })
    } catch (error) {
        console.error("⚠️ No se pudo eliminar el archivo de Cloudinary:", ruta, error.message)
    }
}
