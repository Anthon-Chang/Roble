import Proyecto from "../models/Proyecto.js"
import { sendMailToOwner } from "../helpers/sendMail.js"
import { subirBase64Cloudinary, subirImagenCloudinary } from "../helpers/uploadCloudinary.js"

// =====================================================
// REGISTRAR PROYECTO
// =====================================================
const registrarProyecto = async (req, res) => {
    try {

        // Validar campos vacíos
        if (Object.values(req.body).includes(""))
            return res.status(400).json({ msg: "Debes llenar todos los campos" })

        const { emailCliente } = req.body

        // Validar si el email ya está registrado
        const proyectoExistente = await Proyecto.findOne({ emailCliente })
        if (proyectoExistente)
            return res.status(400).json({ msg: "El email ya se encuentra registrado" })

        // Generar password temporal para el cliente
        const passwordTemp = Math.random().toString(36).toUpperCase().slice(2, 6)
        const passwordFinal = "CLI" + passwordTemp

        // Crear el proyecto con el password cifrado
        const nuevoProyecto = new Proyecto({
            ...req.body,
            passwordCliente: await Proyecto.prototype.encryptPassword(passwordFinal),
            //carpintero: req.carpinteroHeader._id
            carpintero: null
        })

        // =============================
        // Subir imagen física (multer)
        // =============================
        if (req.files?.imagenProyecto) {
            const { secure_url, public_id } = await subirImagenCloudinary(
                req.files.imagenProyecto.tempFilePath,
                "Proyectos"
            )

            nuevoProyecto.imagenProyecto = secure_url
            nuevoProyecto.imagenProyectoID = public_id
        }

        // =============================
        // Subir imagen IA (base64)
        // =============================
        if (req.body?.imagenProyectoIA) {
            const secure_url = await subirBase64Cloudinary(
                req.body.imagenProyectoIA,
                "Proyectos"
            )
            nuevoProyecto.imagenProyectoIA = secure_url
        }

        await nuevoProyecto.save()

        // =============================
        // Enviar correo al cliente
        // =============================
        await sendMailToOwner(emailCliente, passwordFinal)

        res.status(201).json({
            msg: "Proyecto registrado correctamente y correo enviado al cliente",
            proyecto: nuevoProyecto
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}

export {
    registrarProyecto,
}
