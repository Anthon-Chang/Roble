import fs from "fs-extra"
import path from "path"

const MB = 1024 * 1024
export const LIMITES = { pdf: 5 * MB, imagen: 5 * MB, modelo3D: 50 * MB }

export const comoLista = (valor) => (valor ? (Array.isArray(valor) ? valor : [valor]) : [])

const leerCabecera = async (ruta, bytes = 512) => {
    const manejador = await fs.open(ruta, "r")
    try {
        const buffer = Buffer.alloc(bytes)
        const { bytesRead } = await fs.read(manejador, buffer, 0, bytes, 0)
        return buffer.subarray(0, bytesRead)
    } finally {
        await fs.close(manejador)
    }
}

const extensionDe = (archivo) => path.extname(archivo.name || "").toLowerCase()

// Cada validador devuelve un mensaje de error o null si el archivo es válido.
export const validarPdf = async (archivo) => {
    if (extensionDe(archivo) !== ".pdf") return "El CV debe estar en formato .pdf"
    if (archivo.size > LIMITES.pdf) return "El CV no puede superar los 5 MB"
    const cabecera = await leerCabecera(archivo.tempFilePath, 5)
    if (cabecera.toString("latin1") !== "%PDF-") return "El archivo no es un PDF válido"
    return null
}

export const validarImagen = async (archivo) => {
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(extensionDe(archivo))) {
        return "La imagen debe ser .jpg, .jpeg, .png o .webp"
    }
    if (archivo.size > LIMITES.imagen) return "Cada imagen no puede superar los 5 MB"
    const c = await leerCabecera(archivo.tempFilePath, 12)
    const esPng = c.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))
    const esJpg = c.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    const esWebp = c.subarray(0, 4).toString("latin1") === "RIFF" && c.subarray(8, 12).toString("latin1") === "WEBP"
    if (!esPng && !esJpg && !esWebp) return "El archivo no es una imagen válida"
    return null
}

export const validarModelo3D = async (archivo) => {
    const extension = extensionDe(archivo)
    if (![".obj", ".glb", ".gltf"].includes(extension)) {
        return "Formato no compatible: usa .obj, .glb o .gltf"
    }
    if (archivo.size > LIMITES.modelo3D) return "El modelo 3D no puede superar los 50 MB"
    const cabecera = await leerCabecera(archivo.tempFilePath, 512)
    if (extension === ".glb" && cabecera.subarray(0, 4).toString("latin1") !== "glTF") {
        return "El archivo no es un .glb válido"
    }
    if (extension === ".gltf" && !cabecera.toString("utf8").trimStart().startsWith("{")) {
        return "El archivo no es un .gltf válido"
    }
    if (extension === ".obj" && cabecera.includes(0)) {
        return "El archivo no es un .obj válido (debe ser texto)"
    }
    return null
}

// Borra los temporales que express-fileupload dejó en ./uploads.
export const limpiarTemporales = async (files) => {
    if (!files) return
    for (const valor of Object.values(files)) {
        for (const archivo of comoLista(valor)) {
            if (archivo?.tempFilePath) await fs.remove(archivo.tempFilePath).catch(() => {})
        }
    }
}
