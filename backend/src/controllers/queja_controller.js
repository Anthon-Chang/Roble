import Queja, { TIPOS, ESTADOS_QUEJA } from "../models/Queja.js"
import Carpintero from "../models/carpintero.js"
import { masRecientesPrimero } from "../helpers/firestore.js"
import { subirArchivo, eliminarArchivo } from "../helpers/storage.js"
import { validarImagen, limpiarTemporales } from "../helpers/archivos.js"

const texto = (valor) => (typeof valor === "string" ? valor.trim() : "")

const LIMITE_MOTIVO = 500

// =============================
// CREAR QUEJA O SUGERENCIA (HU-016) - cliente autenticado
// Campos: tipo ("queja" | "sugerencia"), motivo, carpintero (obligatorio si tipo = "queja") + evidencia (archivo opcional)
// =============================
export const crearQueja = async (req, res) => {
    try {
        const tipo = texto(req.body.tipo)
        const motivo = texto(req.body.motivo)
        const carpinteroId = texto(req.body.carpintero)

        if (!TIPOS.includes(tipo)) return res.status(400).json({ msg: `El tipo debe ser: ${TIPOS.join(" o ")}` })
        if (!motivo) return res.status(400).json({ msg: "Debes indicar el motivo" })
        if (motivo.length > LIMITE_MOTIVO) return res.status(400).json({ msg: `El motivo no puede superar ${LIMITE_MOTIVO} caracteres` })

        let carpintero = null
        if (tipo === "queja") {
            if (!carpinteroId) return res.status(400).json({ msg: "Debes indicar el carpintero asociado al reclamo" })
            carpintero = await Carpintero.porId(carpinteroId)
            if (!carpintero) return res.status(404).json({ msg: "Carpintero no encontrado" })
        }

        let evidenciaUrl = null
        let evidenciaPath = null
        const archivo = req.files?.evidencia
        if (archivo && !Array.isArray(archivo)) {
            const errorImagen = await validarImagen(archivo)
            if (errorImagen) return res.status(400).json({ msg: errorImagen })
            const subida = await subirArchivo(archivo, "quejas")
            evidenciaUrl = subida.url
            evidenciaPath = subida.path
        }

        const queja = await Queja.crear({
            tipo,
            motivo,
            cliente: req.user._id,
            carpintero: carpintero ? carpintero._id : null,
            evidenciaUrl,
            evidenciaPath,
        })

        res.status(201).json({ msg: tipo === "queja" ? "Reclamo registrado correctamente" : "Sugerencia registrada correctamente", queja })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    } finally {
        await limpiarTemporales(req.files)
    }
}

// =============================
// LISTAR QUEJAS Y SUGERENCIAS (HU-016) - solo administrador
// GET /api/queja?tipo=queja|sugerencia&estado=pendiente|en_seguimiento|resuelta
// =============================
export const listarQuejas = async (req, res) => {
    try {
        const { tipo, estado } = req.query
        if (tipo && !TIPOS.includes(tipo)) return res.status(400).json({ msg: `El tipo debe ser: ${TIPOS.join(" o ")}` })
        if (estado && !ESTADOS_QUEJA.includes(estado)) return res.status(400).json({ msg: "estado no válido" })

        const filtros = {}
        if (tipo) filtros.tipo = tipo
        if (estado) filtros.estado = estado

        const quejas = await Queja.listar(filtros)
        res.status(200).json(masRecientesPrimero(quejas))
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// =============================
// DETALLE DE UNA QUEJA O SUGERENCIA (HU-016) - solo administrador
// =============================
export const detalleQueja = async (req, res) => {
    try {
        const queja = await Queja.porId(req.params.id)
        if (!queja) return res.status(404).json({ msg: "Registro no encontrado" })
        res.status(200).json(queja)
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// =============================
// DAR SEGUIMIENTO A UN RECLAMO (HU-016) - solo administrador
// Solo aplica a quejas (las sugerencias no tienen flujo de estados).
// =============================
export const seguimientoQueja = async (req, res) => {
    try {
        const queja = await Queja.porId(req.params.id)
        if (!queja) return res.status(404).json({ msg: "Registro no encontrado" })
        if (queja.tipo !== "queja") return res.status(400).json({ msg: "Las sugerencias no tienen seguimiento" })

        const estado = texto(req.body.estado)
        if (!["en_seguimiento", "resuelta"].includes(estado)) {
            return res.status(400).json({ msg: "El estado debe ser: en_seguimiento o resuelta" })
        }

        const actualizada = await Queja.actualizar(queja._id, { estado })
        res.status(200).json({ msg: "Seguimiento actualizado correctamente", queja: actualizada })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// =============================
// ELIMINAR QUEJA O SUGERENCIA (HU-016) - solo administrador
// Una sugerencia se borra en cualquier momento; un reclamo solo cuando ya está resuelto.
// =============================
export const eliminarQueja = async (req, res) => {
    try {
        const queja = await Queja.porId(req.params.id)
        if (!queja) return res.status(404).json({ msg: "Registro no encontrado" })

        if (queja.tipo === "queja" && queja.estado !== "resuelta") {
            return res.status(400).json({ msg: "El reclamo solo se puede eliminar cuando esté resuelto" })
        }

        await eliminarArchivo(queja.evidenciaPath)
        await Queja.eliminar(queja._id)
        res.status(200).json({ msg: "Eliminado correctamente" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}
