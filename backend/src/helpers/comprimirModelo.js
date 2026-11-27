// Comprime modelos 3D (.glb/.gltf) antes de subirlos: reduce geometría (Draco) y texturas
// (WebP + redimensionado) para entrar en el límite de 10MB del plan gratuito de Cloudinary.
// Los .obj no se comprimen aquí (no es un formato soportado por esta herramienta).
import fs from "fs-extra"
import path from "path"
import crypto from "crypto"
import { NodeIO } from "@gltf-transform/core"
import { ALL_EXTENSIONS } from "@gltf-transform/extensions"
import { dedup, prune, weld, quantize, textureCompress, draco } from "@gltf-transform/functions"
import draco3d from "draco3dgltf"
import sharp from "sharp"

let ioPromise = null
const getIO = async () => {
    if (!ioPromise) {
        ioPromise = (async () => {
            const [decoder, encoder] = await Promise.all([draco3d.createDecoderModule(), draco3d.createEncoderModule()])
            return new NodeIO()
                .registerExtensions(ALL_EXTENSIONS)
                .registerDependencies({ "draco3d.decoder": decoder, "draco3d.encoder": encoder })
        })()
    }
    return ioPromise
}

// Solo tiene sentido intentarlo con glTF binario o de texto.
export const esComprimible = (nombreArchivo) => [".glb", ".gltf"].includes(path.extname(nombreArchivo || "").toLowerCase())

// Comprime el archivo en rutaEntrada y devuelve la ruta de un nuevo archivo .glb temporal.
// Si algo falla en la compresión, se queda con el original (nunca bloquea la subida por esto).
export const comprimirModelo3D = async (rutaEntrada) => {
    const rutaSalida = path.join(path.dirname(rutaEntrada), `${crypto.randomBytes(6).toString("hex")}-comprimido.glb`)
    try {
        const io = await getIO()
        const documento = await io.read(rutaEntrada)
        await documento.transform(
            dedup(),
            prune(),
            weld(),
            quantize(),
            textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024] }),
            draco({ method: "edgebreaker" })
        )
        await io.write(rutaSalida, documento)
        return rutaSalida
    } catch (error) {
        console.error("⚠️ No se pudo comprimir el modelo 3D, se sube el original:", error.message)
        await fs.remove(rutaSalida).catch(() => {})
        return null
    }
}

// Tope real de subida de Cloudinary en el plan gratuito.
export const LIMITE_SUBIDA_CLOUDINARY = 10 * 1024 * 1024

// Si el archivo es .glb/.gltf lo comprime y reemplaza sus datos (tempFilePath, size, name) en el
// mismo objeto `archivo` de express-fileupload. Si no es comprimible, lo deja tal cual.
export const prepararModeloParaSubir = async (archivo) => {
    if (!esComprimible(archivo.name)) return
    const rutaOriginal = archivo.tempFilePath
    const rutaComprimida = await comprimirModelo3D(rutaOriginal)
    if (!rutaComprimida) return
    const { size } = await fs.stat(rutaComprimida)
    await fs.remove(rutaOriginal).catch(() => {})
    archivo.tempFilePath = rutaComprimida
    archivo.size = size
    archivo.name = `${path.basename(archivo.name, path.extname(archivo.name))}.glb`
    archivo.mimetype = "model/gltf-binary"
}
