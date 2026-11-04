import Mueble from "../models/Mueble.js"
import Carpintero from "../models/carpintero.js"
import { masRecientesPrimero } from "../helpers/firestore.js"
import { subirArchivo, eliminarArchivo } from "../helpers/storage.js"
import { comoLista, limpiarTemporales, validarImagen } from "../helpers/archivos.js"

const MAX_IMAGENES = 5

// Texto obligatorio no vacío
const texto = (valor) => (typeof valor === "string" ? valor.trim() : "")

const leerDimension = (valor) => {
    if (valor === undefined || valor === "") return null
    const numero = Number(valor)
    return Number.isFinite(numero) && numero > 0 ? numero : NaN
}

// Valida y normaliza los campos de texto/número del mueble. Devuelve { datos } o { error }.
const leerCampos = (body, { parcial = false } = {}) => {
    const datos = {}

    for (const campo of ["nombre", "descripcion"]) {
        if (body[campo] === undefined && parcial) continue
        if (!texto(body[campo])) return { error: `El campo ${campo} es obligatorio` }
        datos[campo] = texto(body[campo])
    }
    if (body.tipoMadera !== undefined) datos.tipoMadera = texto(body.tipoMadera) || null
    if (body.categoria !== undefined) datos.categoria = texto(body.categoria) || null

    for (const campo of ["precio", "alto", "ancho", "profundidad"]) {
        if (body[campo] === undefined) continue
        const valor = leerDimension(body[campo])
        if (Number.isNaN(valor)) return { error: `El campo ${campo} debe ser un número mayor a 0` }
        datos[campo] = valor
    }
    return { datos }
}

// Sube las imágenes recibidas; si una falla, borra las ya subidas.
const subirImagenes = async (archivos) => {
    const subidas = []
    try {
        for (const archivo of archivos) {
            const { url, path } = await subirArchivo(archivo, "muebles")
            subidas.push({ url, path })
        }
        return subidas
    } catch (error) {
        await Promise.all(subidas.map((i) => eliminarArchivo(i.path)))
        throw error
    }
}

const validarImagenes = async (archivos) => {
    if (archivos.length > MAX_IMAGENES) return `Puedes subir máximo ${MAX_IMAGENES} imágenes`
    for (const archivo of archivos) {
        const error = await validarImagen(archivo)
        if (error) return error
    }
    return null
}

// =============================
// CREAR MUEBLE (HU-006) - solo carpinteros aprobados
// Campos: nombre, descripcion, tipoMadera, categoria, precio, alto, ancho, profundidad + imagenes (archivos)
// =============================
export const crearMueble = async (req, res) => {
    try {
        const { datos, error } = leerCampos(req.body)
        if (error) return res.status(400).json({ msg: error })

        const archivos = comoLista(req.files?.imagenes)
        const errorImagenes = await validarImagenes(archivos)
        if (errorImagenes) return res.status(400).json({ msg: errorImagenes })

        const imagenes = await subirImagenes(archivos)
        const mueble = await Mueble.crear({ ...datos, imagenes, carpintero: req.user._id })

        res.status(201).json({ msg: "Mueble registrado correctamente", mueble })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    } finally {
        await limpiarTemporales(req.files)
    }
}

// =============================
// LISTAR MIS MUEBLES (carpintero)
// =============================
export const listarMisMuebles = async (req, res) => {
    try {
        const muebles = await Mueble.listar({ carpintero: req.user._id })
        res.status(200).json(masRecientesPrimero(muebles))
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

// =============================
// LISTAR MUEBLES PUBLICADOS (cualquier usuario autenticado): solo de carpinteros aprobados
// =============================
export const listarMuebles = async (req, res) => {
    try {
        const aprobados = new Set((await Carpintero.listar({ estadoAprobacion: "aprobado" })).map((c) => c._id))
        const filtros = req.query.carpintero ? { carpintero: String(req.query.carpintero) } : {}
        const muebles = (await Mueble.listar(filtros)).filter((m) => aprobados.has(m.carpintero))
        res.status(200).json(masRecientesPrimero(muebles))
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

export const detalleMueble = async (req, res) => {
    try {
        const mueble = await Mueble.porId(req.params.id)
        if (!mueble) return res.status(404).json({ msg: "Mueble no encontrado" })

        // Los demás usuarios solo ven muebles de carpinteros aprobados; el dueño siempre ve los suyos
        const esDueno = req.user.rol === "carpintero" && mueble.carpintero === req.user._id
        if (!esDueno && req.user.rol !== "administrador") {
            const dueno = await Carpintero.porId(mueble.carpintero)
            if (!dueno || dueno.estadoAprobacion !== "aprobado") {
                return res.status(404).json({ msg: "Mueble no encontrado" })
            }
        }
        res.status(200).json(mueble)
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

// Carga el mueble y verifica que pertenezca al carpintero autenticado.
const muebleDelDueno = async (req, res) => {
    const mueble = await Mueble.porId(req.params.id)
    if (!mueble) {
        res.status(404).json({ msg: "Mueble no encontrado" })
        return null
    }
    if (mueble.carpintero !== req.user._id) {
        res.status(403).json({ msg: "Acción no permitida: este mueble pertenece a otro carpintero" })
        return null
    }
    return mueble
}

// =============================
// ACTUALIZAR MUEBLE (solo el dueño)
// Campos de texto/número parciales; `imagenes` nuevas se agregan; `eliminarImagenes` (JSON o lista de paths) las quita.
// =============================
export const actualizarMueble = async (req, res) => {
    try {
        const mueble = await muebleDelDueno(req, res)
        if (!mueble) return

        const { datos, error } = leerCampos(req.body, { parcial: true })
        if (error) return res.status(400).json({ msg: error })

        const nuevas = comoLista(req.files?.imagenes)
        let quitar = req.body.eliminarImagenes ?? []
        if (typeof quitar === "string") {
            try { quitar = JSON.parse(quitar) } catch { quitar = [quitar] }
        }
        quitar = comoLista(quitar).filter((p) => mueble.imagenes.some((i) => i.path === p))

        const restantes = mueble.imagenes.filter((i) => !quitar.includes(i.path))
        const errorImagenes = await validarImagenes(nuevas)
        if (errorImagenes) return res.status(400).json({ msg: errorImagenes })
        if (restantes.length + nuevas.length > MAX_IMAGENES) {
            return res.status(400).json({ msg: `Un mueble puede tener máximo ${MAX_IMAGENES} imágenes` })
        }

        const subidas = await subirImagenes(nuevas)
        const actualizado = await Mueble.actualizar(mueble._id, { ...datos, imagenes: [...restantes, ...subidas] })
        await Promise.all(quitar.map(eliminarArchivo))

        res.status(200).json({ msg: "Mueble actualizado correctamente", mueble: actualizado })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    } finally {
        await limpiarTemporales(req.files)
    }
}

// =============================
// ELIMINAR MUEBLE (solo el dueño)
// =============================
export const eliminarMueble = async (req, res) => {
    try {
        const mueble = await muebleDelDueno(req, res)
        if (!mueble) return

        await Mueble.eliminar(mueble._id)
        await Promise.all(mueble.imagenes.map((i) => eliminarArchivo(i.path)))
        res.status(200).json({ msg: "Mueble eliminado correctamente" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}
