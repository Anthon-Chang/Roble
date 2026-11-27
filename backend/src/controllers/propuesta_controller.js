import path from "path"
import Propuesta from "../models/Propuesta.js"
import Proyecto from "../models/Proyecto.js"
import { masRecientesPrimero } from "../helpers/firestore.js"
import { subirArchivo } from "../helpers/storage.js"
import { limpiarTemporales, validarModelo3D } from "../helpers/archivos.js"
import { prepararModeloParaSubir, LIMITE_SUBIDA_CLOUDINARY } from "../helpers/comprimirModelo.js"

const MODELO_DEMASIADO_PESADO = "El modelo 3D sigue pesando más de 10 MB incluso comprimido: reduce la cantidad de polígonos o la resolución de las texturas e inténtalo de nuevo"

const texto = (valor) => (typeof valor === "string" ? valor.trim() : "")

// Carga el proyecto y comprueba que el carpintero autenticado sea su dueño.
const proyectoDelCarpintero = async (proyectoId, user) => {
    const proyecto = await Proyecto.porId(proyectoId)
    if (!proyecto) return { codigo: 404, msg: "Proyecto no encontrado" }
    if (proyecto.carpintero !== user._id) return { codigo: 403, msg: "Acción no permitida" }
    return { proyecto }
}

// =======================================
// ENVIAR PROPUESTA DE DISEÑO 3D (HU-011 - carpintero dueño del proyecto)
// multipart: proyecto, description (opcional) y el archivo en el campo "modelo" (.obj, .glb, .gltf)
// =======================================
const enviarPropuesta = async (req, res) => {
    try {
        const proyectoId = texto(req.body.proyecto)
        if (!proyectoId) return res.status(400).json({ msg: "Debes indicar el proyecto" })

        const { proyecto, codigo, msg } = await proyectoDelCarpintero(proyectoId, req.user)
        if (!proyecto) return res.status(codigo).json({ msg })

        const archivo = req.files?.modelo
        if (!archivo || Array.isArray(archivo)) {
            return res.status(400).json({ msg: "Debes subir un único archivo 3D en el campo 'modelo'" })
        }
        const errorArchivo = await validarModelo3D(archivo)
        if (errorArchivo) return res.status(400).json({ msg: errorArchivo })

        await prepararModeloParaSubir(archivo)
        if (archivo.size > LIMITE_SUBIDA_CLOUDINARY) {
            return res.status(400).json({ msg: MODELO_DEMASIADO_PESADO })
        }

        const { url, path: ruta } = await subirArchivo(archivo, "propuestas3d")
        const propuesta = await Propuesta.crear({
            proyecto: proyecto._id,
            carpintero: req.user._id,
            description: texto(req.body.description) || null,
            modelUrl: url,
            modelPath: ruta,
            formato: path.extname(archivo.name).toLowerCase().slice(1),
        })

        res.status(201).json({ msg: "Propuesta enviada correctamente", propuesta })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    } finally {
        await limpiarTemporales(req.files)
    }
}

// =======================================
// LISTAR PROPUESTAS DE UN PROYECTO (HU-011 cliente; también el carpintero dueño y el administrador)
// =======================================
const listarPropuestas = async (req, res) => {
    try {
        const proyecto = await Proyecto.porId(req.params.proyectoId)
        if (!proyecto) return res.status(404).json({ msg: "Proyecto no encontrado" })

        const { rol, _id } = req.user
        const permitido =
            rol === "administrador" ||
            (rol === "carpintero" && proyecto.carpintero === _id) ||
            (rol === "cliente" && proyecto.cliente === _id)
        if (!permitido) return res.status(403).json({ msg: "Acción no permitida" })

        res.status(200).json(masRecientesPrimero(await Propuesta.porProyecto(proyecto._id)))
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// Carga la propuesta junto con su proyecto y comprueba que el cliente autenticado sea el dueño.
const propuestaDelCliente = async (req, res) => {
    const propuesta = await Propuesta.porId(req.params.id)
    if (!propuesta) {
        res.status(404).json({ msg: "Propuesta no encontrada" })
        return null
    }
    const proyecto = await Proyecto.porId(propuesta.proyecto)
    if (!proyecto || proyecto.cliente !== req.user._id) {
        res.status(403).json({ msg: "Acción no permitida" })
        return null
    }
    return { propuesta, proyecto }
}

// =======================================
// APROBAR MODELO 3D PROPUESTO (HU-012 - cliente dueño del proyecto)
// Queda registrada en el proyecto como requisito para iniciar la fabricación.
// =======================================
const aprobarPropuesta = async (req, res) => {
    try {
        const datos = await propuestaDelCliente(req, res)
        if (!datos) return
        const { propuesta, proyecto } = datos

        if (propuesta.estado === "Aprobada") {
            return res.status(400).json({ msg: "Esta propuesta ya fue aprobada" })
        }

        const actualizada = await Propuesta.actualizar(propuesta._id, { estado: "Aprobada", motivoRechazo: null })
        await Proyecto.actualizar(proyecto._id, { aprobacionModelo: true })

        res.status(200).json({ msg: "Propuesta aprobada correctamente", propuesta: actualizada })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// =======================================
// RECHAZAR MODELO 3D PROPUESTO (cliente dueño del proyecto)
// =======================================
const rechazarPropuesta = async (req, res) => {
    try {
        const datos = await propuestaDelCliente(req, res)
        if (!datos) return
        const { propuesta } = datos

        if (propuesta.estado === "Aprobada") {
            return res.status(400).json({ msg: "No se puede rechazar una propuesta ya aprobada" })
        }

        const actualizada = await Propuesta.actualizar(propuesta._id, {
            estado: "Rechazada",
            motivoRechazo: texto(req.body.motivo) || null,
        })

        res.status(200).json({ msg: "Propuesta rechazada", propuesta: actualizada })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

export { enviarPropuesta, listarPropuestas, aprobarPropuesta, rechazarPropuesta }
