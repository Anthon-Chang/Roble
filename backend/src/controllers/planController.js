import Plan from "../models/Plan.js"
import { subirArchivo, eliminarArchivo } from "../helpers/storage.js"
import { limpiarTemporales, validarImagen } from "../helpers/archivos.js"

const texto = (valor) => (typeof valor === "string" ? valor.trim() : "")

const leerNumero = (valor) => {
  if (valor === undefined || valor === "") return undefined
  const numero = Number(valor)
  return Number.isFinite(numero) && numero >= 0 ? numero : NaN
}

// Un plano lo gestionan los administradores y su creador. Los planos anteriores a este control no
// tienen propietario (creadoPor) y por tanto solo los gestiona un administrador.
const puedeGestionar = (plan, user) => user.rol === "administrador" || (!!plan.creadoPor && plan.creadoPor === user._id)

// Crear un nuevo plano (imagen en Firebase Storage, campo multipart "image")
const createPlan = async (req, res) => {
  try {
    const { name, style, description } = req.body
    const archivo = req.files?.image

    if (!texto(name)) return res.status(400).json({ message: "El nombre es obligatorio" })
    if (!archivo || Array.isArray(archivo)) return res.status(400).json({ message: "La imagen es obligatoria" })

    const rooms = leerNumero(req.body.rooms)
    const area_m2 = leerNumero(req.body.area_m2)
    if (Number.isNaN(rooms) || Number.isNaN(area_m2)) {
      return res.status(400).json({ message: "rooms y area_m2 deben ser números válidos" })
    }

    const errorImagen = await validarImagen(archivo)
    if (errorImagen) return res.status(400).json({ message: errorImagen })

    const { url, path } = await subirArchivo(archivo, "planos_interiores")
    const nuevoPlano = await Plan.crear({
      name: texto(name),
      rooms: rooms ?? null,
      style: texto(style) || null,
      area_m2: area_m2 ?? null,
      description: texto(description) || null,
      image_url: url,
      image_path: path,
      // Propietario: solo él (o un administrador) podrá modificar o borrar el plano
      creadoPor: req.user._id,
      creadoPorRol: req.user.rol,
    })

    res.status(201).json(nuevoPlano)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al crear el plano" })
  } finally {
    await limpiarTemporales(req.files)
  }
}

// Obtener todos los planos
const getPlans = async (req, res) => {
  try {
    res.json(await Plan.listar())
  } catch (error) {
    res.status(500).json({ message: "Error al obtener planos" })
  }
}

// Obtener un plano por ID
const getPlanById = async (req, res) => {
  try {
    const plan = await Plan.porId(req.params.id)
    if (!plan) return res.status(404).json({ message: "Plano no encontrado" })
    res.json(plan)
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el plano" })
  }
}

// Actualizar un plano (solo campos permitidos)
const updatePlan = async (req, res) => {
  try {
    const plan = await Plan.porId(req.params.id)
    if (!plan) return res.status(404).json({ message: "Plano no encontrado" })
    if (!puedeGestionar(plan, req.user)) return res.status(403).json({ message: "Acción no permitida" })

    const cambios = {}
    for (const campo of ["name", "style", "description"]) {
      if (req.body[campo] !== undefined) cambios[campo] = texto(req.body[campo])
    }
    for (const campo of ["rooms", "area_m2"]) {
      const valor = leerNumero(req.body[campo])
      if (Number.isNaN(valor)) return res.status(400).json({ message: `${campo} debe ser un número válido` })
      if (valor !== undefined) cambios[campo] = valor
    }
    if (cambios.name === "") return res.status(400).json({ message: "El nombre no puede estar vacío" })

    res.json(await Plan.actualizar(plan._id, cambios))
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar el plano" })
  }
}

// Eliminar un plano
const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.porId(req.params.id)
    if (!plan) return res.status(404).json({ message: "Plano no encontrado" })
    if (!puedeGestionar(plan, req.user)) return res.status(403).json({ message: "Acción no permitida" })

    await Plan.eliminar(plan._id)
    await eliminarArchivo(plan.image_path)
    res.json({ message: "Plano eliminado" })
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el plano" })
  }
}

export { createPlan, getPlans, getPlanById, updatePlan, deletePlan }
