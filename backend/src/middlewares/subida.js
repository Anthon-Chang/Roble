import fileUpload from "express-fileupload"

// Recibe archivos multipart. Se monta POR RUTA y siempre después de verificarTokenJWT y del control de
// rol: así un usuario anónimo o sin permiso nunca llega a escribir archivos temporales en ./uploads.
// Cada tipo de archivo valida además su propio límite (5 MB imágenes y PDF, 50 MB modelos 3D).
export const subidaArchivos = fileUpload({
    useTempFiles: true,
    tempFileDir: "./uploads",
    limits: { fileSize: 50 * 1024 * 1024 },
    abortOnLimit: true,
    limitHandler: (req, res) => res.status(413).json({ msg: "El archivo supera el tamaño máximo permitido" }),
})
