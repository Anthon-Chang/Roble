import Estado from "../models/Estado.js"
import Proyecto from "../models/Proyecto.js"
import mongoose from "mongoose"

// =======================================
// REGISTRAR ESTADO DEL PROYECTO
// =======================================
const registrarEstado = async (req, res) => {
    try {
        const { proyecto } = req.body

        // Validar campos vacíos
        if (Object.values(req.body).includes("")) {
            return res.status(400).json({ msg: "Debes llenar todos los campos" })
        }

        // Validar ObjectId del proyecto
        if (!mongoose.Types.ObjectId.isValid(proyecto)) {
            return res.status(404).json({ msg: `No existe el proyecto ${proyecto}` })
        }

        // Verificar que el proyecto exista
        const proyectoExistente = await Proyecto.findById(proyecto)
        if (!proyectoExistente) {
            return res.status(404).json({ msg: "Proyecto no encontrado" })
        }

        // Crear el estado
        const nuevoEstado = await Estado.create(req.body)

        // Asociar el estado al proyecto
        proyectoExistente.estados.push(nuevoEstado._id)
        await proyectoExistente.save()

        res.status(201).json({ msg: "Estado registrado correctamente" })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}

// =======================================
// ELIMINAR ESTADO DEL PROYECTO
// =======================================

const eliminarEstado = async (req, res) => {
    try {
        const { id } = req.params

        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ msg: `No existe el estado ${id}` })
        }

        // Buscar estado
        const estado = await Estado.findById(id)
        if (!estado) {
            return res.status(404).json({ msg: "Estado no encontrado" })
        }

        // Eliminar referencia en Proyecto
        await Proyecto.findByIdAndUpdate(
            estado.proyecto,
            { $pull: { estados: estado._id } }
        )

        // Eliminar estado
        await Estado.findByIdAndDelete(id)

        res.status(200).json({ msg: "Estado eliminado exitosamente" })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

export {
    registrarEstado,
    eliminarEstado
}
