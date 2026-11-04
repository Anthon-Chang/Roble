import path from "path"
import Model3D from "../models/modelo3D.js"
import Carpintero from "../models/carpintero.js"
import { masRecientesPrimero } from "../helpers/firestore.js"
import { subirArchivo, eliminarArchivo } from "../helpers/storage.js"
import { comoLista, limpiarTemporales, validarModelo3D } from "../helpers/archivos.js"

const texto = (valor) => (typeof valor === "string" ? valor.trim() : "")

const urlHttpsValida = (valor) => {
    try {
        return new URL(valor).protocol === "https:"
    } catch {
        return false
    }
}

// Modelos visibles en el catálogo: de carpinteros aprobados o del sistema (sin dueño).
const modelosVisibles = async () => {
    const aprobados = new Set((await Carpintero.listar({ estadoAprobacion: "aprobado" })).map((c) => c._id))
    const modelos = await Model3D.listar()
    return masRecientesPrimero(modelos.filter((m) => !m.carpintero || aprobados.has(m.carpintero)))
}

// =============================
// EXPLORAR CATÁLOGO (HU-008) - cualquier usuario autenticado
// Lista vacía sin error si no hay modelos publicados.
// =============================
export const getAllModels = async (req, res) => {
    try {
        const modelos = await modelosVisibles()
        res.status(200).json({ status: "success", count: modelos.length, data: modelos })
    } catch (err) {
        console.error(err)
        res.status(500).json({ status: "error", message: "Error obteniendo modelos", details: err.message })
    }
}

export const getModelById = async (req, res) => {
    try {
        const modelo = await Model3D.porId(req.params.id)
        if (!modelo) return res.status(404).json({ status: "error", message: "Modelo no encontrado" })

        const esDueno = req.user.rol === "carpintero" && modelo.carpintero === req.user._id
        if (modelo.carpintero && !esDueno && req.user.rol !== "administrador") {
            const dueno = await Carpintero.porId(modelo.carpintero)
            if (!dueno || dueno.estadoAprobacion !== "aprobado") {
                return res.status(404).json({ status: "error", message: "Modelo no encontrado" })
            }
        }
        res.status(200).json({ status: "success", data: modelo })
    } catch (err) {
        console.error(err)
        res.status(500).json({ status: "error", message: "Error al obtener el modelo", details: err.message })
    }
}

export const searchModelByName = async (req, res) => {
    try {
        const nombre = texto(req.query.name).toLowerCase()
        if (!nombre) {
            return res.status(400).json({ status: "error", message: "El parámetro 'name' es obligatorio" })
        }

        // Búsqueda por texto contenido (sin expresiones regulares, así no se puede inyectar un patrón)
        const modelo = (await modelosVisibles()).find((m) => String(m.name).toLowerCase().includes(nombre))
        if (!modelo) return res.status(404).json({ status: "error", message: "Modelo no encontrado" })

        res.status(200).json({ status: "success", data: modelo })
    } catch (err) {
        console.error(err)
        res.status(500).json({ status: "error", message: "Error al buscar el modelo", details: err.message })
    }
}

export const getMyModels = async (req, res) => {
    try {
        const modelos = masRecientesPrimero(await Model3D.listar({ carpintero: req.user._id }))
        res.status(200).json({ status: "success", count: modelos.length, data: modelos })
    } catch (err) {
        console.error(err)
        res.status(500).json({ status: "error", message: "Error obteniendo modelos", details: err.message })
    }
}

// =============================
// PUBLICAR MODELO 3D (HU-007) - carpintero aprobado
// multipart: name, description, y el archivo en el campo `modelo` (.obj, .glb, .gltf)
// Alternativa: enviar `modelUrl` (https) de un archivo ya alojado.
// =============================
export const createModel = async (req, res) => {
    try {
        const name = texto(req.body.name)
        const description = texto(req.body.description)
        if (!name) return res.status(400).json({ status: "error", message: "El nombre es obligatorio" })

        const archivo = req.files?.modelo
        if (Array.isArray(archivo)) {
            return res.status(400).json({ status: "error", message: "Sube un único archivo en el campo 'modelo'" })
        }

        let modelUrl, modelPath = null, formato
        if (archivo) {
            const error = await validarModelo3D(archivo)
            if (error) return res.status(400).json({ status: "error", message: error })
            ;({ url: modelUrl, path: modelPath } = await subirArchivo(archivo, "modelos3d"))
            formato = path.extname(archivo.name).toLowerCase().slice(1)
        } else if (texto(req.body.modelUrl)) {
            if (!urlHttpsValida(req.body.modelUrl)) {
                return res.status(400).json({ status: "error", message: "modelUrl debe ser una URL https válida" })
            }
            modelUrl = req.body.modelUrl.trim()
            formato = path.extname(new URL(modelUrl).pathname).toLowerCase().slice(1) || null
        } else {
            return res.status(400).json({ status: "error", message: "Debes subir un archivo 3D en el campo 'modelo'" })
        }

        const modelo = await Model3D.crear({ name, description, modelUrl, modelPath, formato, carpintero: req.user._id })
        res.status(201).json({ status: "success", data: modelo })
    } catch (err) {
        console.error(err)
        res.status(500).json({ status: "error", message: "No se pudo crear el modelo", details: err.message })
    } finally {
        await limpiarTemporales(req.files)
    }
}

const modeloDelDueno = async (req, res) => {
    const modelo = await Model3D.porId(req.params.id)
    if (!modelo) {
        res.status(404).json({ status: "error", message: "Modelo no encontrado" })
        return null
    }
    if (modelo.carpintero !== req.user._id) {
        res.status(403).json({ status: "error", message: "Acción no permitida: este modelo pertenece a otro carpintero" })
        return null
    }
    return modelo
}

// =============================
// EDITAR MODELO (solo el dueño): name, description y, opcionalmente, un archivo nuevo
// =============================
export const updateModel = async (req, res) => {
    try {
        const modelo = await modeloDelDueno(req, res)
        if (!modelo) return

        const cambios = {}
        if (req.body.name !== undefined) {
            if (!texto(req.body.name)) return res.status(400).json({ status: "error", message: "El nombre no puede estar vacío" })
            cambios.name = texto(req.body.name)
        }
        if (req.body.description !== undefined) cambios.description = texto(req.body.description)

        const archivo = req.files?.modelo
        if (archivo) {
            if (Array.isArray(archivo)) {
                return res.status(400).json({ status: "error", message: "Sube un único archivo en el campo 'modelo'" })
            }
            const error = await validarModelo3D(archivo)
            if (error) return res.status(400).json({ status: "error", message: error })
            const { url, path: ruta } = await subirArchivo(archivo, "modelos3d")
            Object.assign(cambios, { modelUrl: url, modelPath: ruta, formato: path.extname(archivo.name).toLowerCase().slice(1) })
        }

        const actualizado = await Model3D.actualizar(modelo._id, cambios)
        if (cambios.modelPath) await eliminarArchivo(modelo.modelPath)

        res.status(200).json({ status: "success", data: actualizado })
    } catch (err) {
        console.error(err)
        res.status(500).json({ status: "error", message: "No se pudo actualizar el modelo", details: err.message })
    } finally {
        await limpiarTemporales(req.files)
    }
}

// =============================
// ELIMINAR MODELO (solo el dueño)
// =============================
export const deleteModel = async (req, res) => {
    try {
        const modelo = await modeloDelDueno(req, res)
        if (!modelo) return

        await Model3D.eliminar(modelo._id)
        await eliminarArchivo(modelo.modelPath)
        res.status(200).json({ status: "success", message: "Modelo eliminado correctamente" })
    } catch (err) {
        console.error(err)
        res.status(500).json({ status: "error", message: "No se pudo eliminar el modelo", details: err.message })
    }
}
