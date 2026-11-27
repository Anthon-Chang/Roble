import "./env.js"
import { v2 as cloudinary } from "cloudinary"

let configurado = false
let instancia = cloudinary

const configurar = () => {
    if (process.env.CLOUDINARY_URL) {
        // El SDK lee CLOUDINARY_URL automáticamente al importarse; solo lo validamos aquí.
        configurado = true
        return
    }
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        throw new Error(
            "Faltan credenciales de Cloudinary: define CLOUDINARY_URL o CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET"
        )
    }
    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true,
    })
    configurado = true
}

export const getCloudinary = () => {
    if (!configurado) configurar()
    return instancia
}

// Solo para pruebas: permite inyectar un cliente de Cloudinary simulado.
export const __usarCloudinarySimulado = (simulado) => {
    instancia = simulado
    configurado = true
}
