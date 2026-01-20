import Proyecto from "../models/Proyecto.js"
import { sendMailToOwner } from "../helpers/sendMail.js"
import { subirBase64Cloudinary, subirImagenCloudinary } from "../helpers/uploadCloudinary.js"
import mongoose from "mongoose"
import cloudinary from "cloudinary"
import fs from "fs-extra"
import { crearTokenJWT } from "../middlewares/JWT.js"
import Estado from "../models/Estado.js"

// =====================================================
// REGISTRAR PROYECTO
// =====================================================
const registrarProyecto = async (req, res) => {
    try {

        console.log('--- registrarProyecto request ---')
        console.log('headers.authorization=', req.headers.authorization)
        console.log('body keys=', Object.keys(req.body || {}))
        try { console.log('body sample=', JSON.stringify(req.body).slice(0,200)) } catch(e) {}
        console.log('files keys=', Object.keys(req.files || {}))

        // Validar campos requeridos (evitar forzar que campos opcionales estén presentes)
        const requiredFields = [
            "nombreCliente",
            "cedulaCliente",
            "emailCliente",
            "celularCliente",
            "nombreProyecto",
            "descripcionProyecto",
            "fechaEntrega",
        ]

        for (const field of requiredFields) {
            if (req.body[field] === undefined || req.body[field] === "") {
                console.log(`Missing field detected: ${field}`, { value: req.body[field] })
                console.log('Full req.body sample:', JSON.stringify(req.body).slice(0,400))
                return res.status(400).json({ msg: `Debes llenar el campo ${field}` })
            }
        }

        const { emailCliente } = req.body

        // Validar si el email ya está registrado
        const proyectoExistente = await Proyecto.findOne({ emailCliente })
        if (proyectoExistente)
            return res.status(400).json({ msg: "El email ya se encuentra registrado" })

        // Generar password temporal para el cliente
        const passwordTemp = Math.random().toString(36).toUpperCase().slice(2, 6)
        const passwordFinal = "CLI" + passwordTemp

        const {
        imagenProyecto,
        imagenProyectoIA,
        ...bodyLimpio
        } = req.body

        // Crear el proyecto con el password cifrado
        const nuevoProyecto = new Proyecto({
            ...bodyLimpio,
            passwordCliente: await Proyecto.prototype.encryptPassword(passwordFinal),
            carpintero: req.carpinteroHeader._id   
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
        // Enviar correo al cliente (no bloquear la respuesta)
        // =============================
        // Disparar el envío de correo de forma asíncrona sin await
        sendMailToOwner(emailCliente, passwordFinal)
            .then(() => console.log('Correo de credenciales enviado (async)'))
            .catch(err => console.error('Error enviando correo (async):', err))

        res.status(201).json({
            msg: "Proyecto registrado correctamente y correo enviado al cliente",
            proyecto: nuevoProyecto
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}

// =====================================================
// LISTAR PROYECTOS ACTIVOS DEL CARPINTERO
// =====================================================
const listarProyectos = async (req, res) => {
    try {
        const proyectos = await Proyecto.find({
            estadoProyecto: true,
            carpintero: req.carpinteroHeader._id
        })
        .select("-entrega -createdAt -updatedAt -__v")
        .populate("carpintero", "_id nombre apellido")

        res.status(200).json(proyectos)

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}


// =====================================================
// DETALLE DE UN PROYECTO
// =====================================================
const detalleProyecto = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ msg: `No existe el proyecto con id ${id}` });
        }

        const proyecto = await Proyecto.findById(id)
            .populate("carpintero", "_id nombre apellido");

        if (!proyecto) {
            return res.status(404).json({ msg: "Proyecto no encontrado" });
        }

        // 🔹 Validar acceso según rol
        if (req.carpinteroHeader) {
            // Solo los carpinteros tienen carpinteroHeader
            if (proyecto.carpintero._id.toString() !== req.carpinteroHeader._id.toString()) {
                return res.status(403).json({ msg: "Acción no permitida" });
            }
        } else if (req.proyectoHeader) {
            // Si es un cliente, opcional: validar que el proyecto sea suyo
            if (proyecto._id.toString() !== req.proyectoHeader._id.toString()) {
                return res.status(403).json({ msg: "Acción no permitida" });
            }
        }

        // Buscar estados del proyecto
        const estados = await Estado.find()
            .where("proyecto")
            .equals(id)
            .select("-createdAt -updatedAt -__v");

        proyecto.estados = estados;

        res.status(200).json(proyecto);

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` });
    }
};



// =====================================================
// ELIMINAR (LÓGICO) PROYECTO
// =====================================================
const eliminarProyecto = async (req, res) => {
    try {
        const { id } = req.params

        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ msg: `No existe el proyecto ${id}` })
        }

        const proyecto = await Proyecto.findById(id)

        // Proyecto no existe
        if (!proyecto) {
            return res.status(404).json({ msg: "Proyecto no encontrado" })
        }

        // Validar pertenencia al carpintero
        if (proyecto.carpintero.toString() !== req.carpinteroHeader._id.toString()) {
            return res.status(403).json({ msg: "Acción no permitida" })
        }

        // Eliminado lógico
        proyecto.estadoProyecto = false
        await proyecto.save()

        res.status(200).json({ msg: "Fecha de entrega registrado exitosamente" })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}

// =====================================================
// ACTUALIZAR PROYECTO
// =====================================================
const actualizarProyecto = async (req, res) => {
    try {
        const { id } = req.params

        // Validaciones: comprobar sólo los campos requeridos para actualizar
        const requiredUpdateFields = [
            "nombreCliente",
            "cedulaCliente",
            "emailCliente",
            "celularCliente",
            "nombreProyecto",
            "descripcionProyecto",
            "fechaEntrega",
        ]

        for (const field of requiredUpdateFields) {
            if (req.body[field] === undefined || req.body[field] === "") {
                console.log(`Missing update field: ${field}`, { value: req.body[field] })
                return res.status(400).json({ msg: `Debes llenar el campo ${field}` })
            }
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ msg: `No existe el proyecto ${id}` })
        }

        const proyecto = await Proyecto.findById(id)

        if (!proyecto) {
            return res.status(404).json({ msg: "Proyecto no encontrado" })
        }

        // Validar pertenencia
        if (proyecto.carpintero.toString() !== req.carpinteroHeader._id.toString()) {
            return res.status(403).json({ msg: "Acción no permitida" })
        }

        // =============================
        // Actualizar imagen física
        // =============================
        if (req.files?.imagenProyecto) {

            // Eliminar imagen anterior
            if (proyecto.imagenProyectoID) {
                await cloudinary.uploader.destroy(proyecto.imagenProyectoID)
            }

            // Subir nueva imagen
            const cloudiResponse = await cloudinary.uploader.upload(
                req.files.imagenProyecto.tempFilePath,
                { folder: "Proyectos" }
            )

            req.body.imagenProyecto = cloudiResponse.secure_url
            req.body.imagenProyectoID = cloudiResponse.public_id

            await fs.unlink(req.files.imagenProyecto.tempFilePath)
        }

        await Proyecto.findByIdAndUpdate(id, req.body, { new: true })

        res.status(200).json({ msg: "Proyecto actualizado correctamente" })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}

// =====================================================
// LOGIN CLIENTE 
// =====================================================
const loginClienteProyecto = async (req, res) => {
    try {
        const { emailCliente, passwordCliente } = req.body

        if (!emailCliente || !passwordCliente) {
            return res.status(400).json({ msg: "Debes llenar todos los campos" })
        }

        const proyectoBDD = await Proyecto.findOne({ emailCliente })
        if (!proyectoBDD) {
            return res.status(404).json({ msg: "El cliente no se encuentra registrado" })
        }

        if (!proyectoBDD.passwordCliente) {
            return res.status(500).json({ msg: "Error interno: password no definido" })
        }

        const verificarPassword = await proyectoBDD.matchPassword(passwordCliente)
        if (!verificarPassword) {
            return res.status(401).json({ msg: "El password no es correcto" })
        }

        const token = crearTokenJWT(proyectoBDD._id, "cliente")

        res.status(200).json({
            token,
            rol: "cliente",
            _id: proyectoBDD._id
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

// =====================================================
// PERFIL CLIENTE
// =====================================================
export const perfilClienteProyecto = async (req, res) => {
    try {
        // Devuelve los datos del cliente que ya fueron obtenidos en el middleware
        res.json(req.clienteHeader);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error del servidor" });
    }
};


export {
    registrarProyecto,
    listarProyectos,
    detalleProyecto,
    eliminarProyecto,
    actualizarProyecto,
    loginClienteProyecto
    /* perfilClienteProyecto */
}
