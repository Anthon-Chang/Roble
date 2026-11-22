import Sancion, { NIVELES_SANCION } from "../models/Sancion.js"
import Carpintero from "../models/carpintero.js"
import Queja from "../models/Queja.js"
import { masRecientesPrimero } from "../helpers/firestore.js"
import { subirArchivo } from "../helpers/storage.js"
import { validarImagen, limpiarTemporales } from "../helpers/archivos.js"

const texto = (valor) => (typeof valor === "string" ? valor.trim() : "")
const LIMITE_MOTIVO = 500
const DIA_MS = 24 * 60 * 60 * 1000

// Aplica (o revierte) el efecto de la sanción sobre la cuenta del carpintero.
const aplicarEfecto = async (carpinteroId, nivel, activa) => {
    if (nivel === "retencion_pago") return // no afecta el acceso a la cuenta
    await Carpintero.actualizar(carpinteroId, { status: !activa })
}

// =============================
// REGISTRAR SANCIÓN A UN CARPINTERO (HU-017) - solo administrador
// Campos: carpintero, motivo, nivel, diasSuspension (obligatorio si nivel = suspension_temporal),
// quejaRelacionada (opcional) + evidencia (archivo opcional)
// =============================
export const crearSancion = async (req, res) => {
    try {
        const carpinteroId = texto(req.body.carpintero)
        const motivo = texto(req.body.motivo)
        const nivel = texto(req.body.nivel)

        if (!carpinteroId) return res.status(400).json({ msg: "Debes indicar el carpintero" })
        if (!motivo) return res.status(400).json({ msg: "Debes indicar el motivo de la sanción" })
        if (motivo.length > LIMITE_MOTIVO) return res.status(400).json({ msg: `El motivo no puede superar ${LIMITE_MOTIVO} caracteres` })
        if (!NIVELES_SANCION.includes(nivel)) return res.status(400).json({ msg: `El nivel debe ser: ${NIVELES_SANCION.join(", ")}` })

        const carpintero = await Carpintero.porId(carpinteroId)
        if (!carpintero) return res.status(404).json({ msg: "Carpintero no encontrado" })

        let diasSuspension = null
        let finSuspension = null
        if (nivel === "suspension_temporal") {
            diasSuspension = Number(req.body.diasSuspension)
            if (!Number.isInteger(diasSuspension) || diasSuspension < 1) {
                return res.status(400).json({ msg: "Debes indicar los días de suspensión (número entero mayor a 0)" })
            }
            finSuspension = new Date(Date.now() + diasSuspension * DIA_MS)
        }

        let quejaRelacionada = null
        const quejaId = texto(req.body.quejaRelacionada)
        if (quejaId) {
            const queja = await Queja.porId(quejaId)
            if (!queja) return res.status(404).json({ msg: "La queja relacionada no existe" })
            quejaRelacionada = queja._id
        }

        let evidenciaUrl = null
        let evidenciaPath = null
        const archivo = req.files?.evidencia
        if (archivo && !Array.isArray(archivo)) {
            const errorImagen = await validarImagen(archivo)
            if (errorImagen) return res.status(400).json({ msg: errorImagen })
            const subida = await subirArchivo(archivo, "sanciones")
            evidenciaUrl = subida.url
            evidenciaPath = subida.path
        }

        const sancion = await Sancion.crear({
            carpintero: carpintero._id,
            motivo,
            nivel,
            diasSuspension,
            finSuspension,
            quejaRelacionada,
            evidenciaUrl,
            evidenciaPath,
        })

        await aplicarEfecto(carpintero._id, nivel, true)

        res.status(201).json({ msg: "Sanción registrada correctamente", sancion })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    } finally {
        await limpiarTemporales(req.files)
    }
}

// =============================
// LISTAR SANCIONES (HU-017) - solo administrador
// GET /api/sancion?carpintero=id
// =============================
export const listarSanciones = async (req, res) => {
    try {
        const { carpintero } = req.query
        const filtros = carpintero ? { carpintero } : {}
        const sanciones = await Sancion.listar(filtros)
        res.status(200).json(masRecientesPrimero(sanciones))
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// =============================
// DETALLE DE UNA SANCIÓN (HU-017) - solo administrador
// =============================
export const detalleSancion = async (req, res) => {
    try {
        const sancion = await Sancion.porId(req.params.id)
        if (!sancion) return res.status(404).json({ msg: "Sanción no encontrada" })
        res.status(200).json(sancion)
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// =============================
// MIS SANCIONES (carpintero autenticado consulta las suyas)
// =============================
export const misSanciones = async (req, res) => {
    try {
        const sanciones = await Sancion.listar({ carpintero: req.user._id })
        res.status(200).json(masRecientesPrimero(sanciones))
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// =============================
// MODIFICAR / REVOCAR UNA SANCIÓN (HU-017) - solo administrador
// Body opcional: motivo, y/o activa=false para revocarla (reactiva la cuenta si estaba suspendida)
// =============================
export const actualizarSancion = async (req, res) => {
    try {
        const sancion = await Sancion.porId(req.params.id)
        if (!sancion) return res.status(404).json({ msg: "Sanción no encontrada" })

        const cambios = {}
        if (req.body.motivo !== undefined) {
            const motivo = texto(req.body.motivo)
            if (!motivo) return res.status(400).json({ msg: "El motivo no puede quedar vacío" })
            if (motivo.length > LIMITE_MOTIVO) return res.status(400).json({ msg: `El motivo no puede superar ${LIMITE_MOTIVO} caracteres` })
            cambios.motivo = motivo
        }

        if (req.body.activa !== undefined) {
            const activa = req.body.activa === true || req.body.activa === "true"
            cambios.activa = activa
            if (activa !== sancion.activa) await aplicarEfecto(sancion.carpintero, sancion.nivel, activa)
        }

        if (Object.keys(cambios).length === 0) return res.status(400).json({ msg: "No se enviaron cambios" })

        const actualizada = await Sancion.actualizar(sancion._id, cambios)
        res.status(200).json({ msg: "Sanción actualizada correctamente", sancion: actualizada })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}
