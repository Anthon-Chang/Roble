import Proyecto, { CAMPOS_EDITABLES } from "../models/Proyecto.js"
import Cliente from "../models/Cliente.js"
import Carpintero from "../models/carpintero.js"
import Estado from "../models/Estado.js"
import { sendMailToOwner } from "../helpers/sendMail.js"
import { subirArchivo, subirBase64, eliminarArchivo } from "../helpers/storage.js"
import { limpiarTemporales, validarImagen } from "../helpers/archivos.js"
import { crearPasswordTemporal, emailValido, encryptPassword } from "../helpers/password.js"
import { masRecientesPrimero } from "../helpers/firestore.js"

const texto = (valor) => (typeof valor === "string" ? valor.trim() : "")

// Valida la fecha de entrega: debe ser una fecha válida y no estar en el pasado.
const leerFechaEntrega = (valor) => {
    const fecha = new Date(valor)
    if (Number.isNaN(fecha.getTime())) return { error: "La fecha de entrega no es válida" }
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    if (fecha < hoy) return { error: "La fecha de entrega no puede estar en el pasado" }
    return { fecha }
}

// Sube la imagen física (multipart) y/o la imagen generada con IA (base64). Devuelve los campos a guardar.
const procesarImagenes = async (req) => {
    const campos = {}
    const archivo = req.files?.imagenProyecto
    if (archivo) {
        if (Array.isArray(archivo)) throw Object.assign(new Error("Sube una sola imagen en 'imagenProyecto'"), { codigo: 400 })
        const error = await validarImagen(archivo)
        if (error) throw Object.assign(new Error(error), { codigo: 400 })
        const { url, path } = await subirArchivo(archivo, "proyectos")
        campos.imagenProyecto = url
        campos.imagenProyectoPath = path
    }
    if (typeof req.body.imagenProyectoIA === "string" && req.body.imagenProyectoIA.startsWith("data:image")) {
        try {
            const { url, path } = await subirBase64(req.body.imagenProyectoIA, "proyectos")
            campos.imagenProyectoIA = url
            campos.imagenProyectoIAPath = path
        } catch (error) {
            await eliminarArchivo(campos.imagenProyectoPath)
            throw Object.assign(error, { codigo: 400 })
        }
    }
    return campos
}

const borrarImagenes = (campos) =>
    Promise.all([eliminarArchivo(campos.imagenProyectoPath), eliminarArchivo(campos.imagenProyectoIAPath)])

const responderError = (res, error) => {
    if (error.codigo === 400) return res.status(400).json({ msg: error.message })
    console.error(error)
    return res.status(500).json({ msg: "❌ Error en el servidor" })
}

// Quita campos internos y reemplaza el id del carpintero por un resumen (equivale al populate de Mongoose).
const presentarProyectos = async (proyectos) => {
    const ids = [...new Set(proyectos.map((p) => p.carpintero).filter(Boolean))]
    const carpinteros = new Map()
    await Promise.all(
        ids.map(async (id) => {
            const c = await Carpintero.porId(id)
            if (c) carpinteros.set(id, { _id: c._id, nombre: c.nombre, apellido: c.apellido })
        })
    )
    return proyectos.map(({ imagenProyectoPath, imagenProyectoIAPath, ...resto }) => ({
        ...resto,
        carpintero: carpinteros.get(resto.carpintero) || { _id: resto.carpintero },
    }))
}

// Datos denormalizados del cliente que se copian al proyecto (el frontend los muestra directamente).
const datosCliente = (cliente) => ({
    cliente: cliente._id,
    nombreCliente: `${cliente.nombre} ${cliente.apellido}`.trim(),
    cedulaCliente: cliente.cedula || "",
    emailCliente: cliente.email,
    celularCliente: cliente.celular || "",
})

// Campos del proyecto comunes a las dos formas de crearlo
const leerDatosProyecto = (body) => {
    for (const campo of ["nombreProyecto", "descripcionProyecto", "fechaEntrega"]) {
        if (!texto(body[campo])) return { error: `Debes llenar el campo ${campo}` }
    }
    const { fecha, error } = leerFechaEntrega(body.fechaEntrega)
    if (error) return { error }
    return {
        datos: {
            nombreProyecto: texto(body.nombreProyecto),
            descripcionProyecto: texto(body.descripcionProyecto),
            tipoMadera: texto(body.tipoMadera) || null,
            fechaEntrega: fecha,
        },
    }
}

// =====================================================
// GENERAR PROYECTO COMO CLIENTE (HU-010)
// El cliente elige un carpintero aprobado; el pedido le llega como requerimiento.
// =====================================================
const solicitarProyecto = async (req, res) => {
    let imagenes = {}
    try {
        const { datos, error } = leerDatosProyecto(req.body)
        if (error) return res.status(400).json({ msg: error })

        const carpintero = await Carpintero.porId(texto(req.body.carpintero))
        if (!carpintero || carpintero.estadoAprobacion !== "aprobado") {
            return res.status(400).json({ msg: "El carpintero no existe o no está aprobado" })
        }

        imagenes = await procesarImagenes(req)
        const proyecto = await Proyecto.crear({
            ...datos,
            ...imagenes,
            ...datosCliente(req.user),
            carpintero: carpintero._id,
        })

        res.status(201).json({ msg: "Proyecto generado correctamente", proyecto: (await presentarProyectos([proyecto]))[0] })
    } catch (error) {
        await borrarImagenes(imagenes)
        responderError(res, error)
    } finally {
        await limpiarTemporales(req.files)
    }
}

// =====================================================
// REGISTRAR PROYECTO COMO CARPINTERO (flujo existente del frontend)
// Crea la cuenta del cliente si no existe y le envía una contraseña temporal.
// =====================================================
const registrarProyecto = async (req, res) => {
    let imagenes = {}
    try {
        for (const campo of ["nombreCliente", "cedulaCliente", "emailCliente", "celularCliente"]) {
            if (!texto(req.body[campo])) return res.status(400).json({ msg: `Debes llenar el campo ${campo}` })
        }
        const { datos, error } = leerDatosProyecto(req.body)
        if (error) return res.status(400).json({ msg: error })
        if (!emailValido(req.body.emailCliente)) {
            return res.status(400).json({ msg: "El formato del correo del cliente no es válido" })
        }

        // Cliente existente o nuevo con contraseña temporal
        let cliente = await Cliente.porEmail(req.body.emailCliente)
        let passwordTemporal = null
        if (!cliente) {
            const [nombre, ...resto] = texto(req.body.nombreCliente).split(/\s+/)
            passwordTemporal = crearPasswordTemporal()
            cliente = await Cliente.crear({
                nombre,
                apellido: resto.join(" "),
                cedula: texto(req.body.cedulaCliente),
                celular: texto(req.body.celularCliente),
                email: req.body.emailCliente,
                password: await encryptPassword(passwordTemporal),
                passwordTemporal: true,
            })
        }

        imagenes = await procesarImagenes(req)
        await Proyecto.crear({
            ...datos,
            ...imagenes,
            ...datosCliente(cliente),
            // Se conservan los datos que escribió el carpintero para este proyecto
            nombreCliente: texto(req.body.nombreCliente),
            cedulaCliente: texto(req.body.cedulaCliente),
            celularCliente: texto(req.body.celularCliente),
            carpintero: req.user._id,
        })

        if (passwordTemporal) {
            try {
                await sendMailToOwner(cliente.email, passwordTemporal)
            } catch (errorCorreo) {
                console.error("❌ No se pudo enviar el correo al cliente:", errorCorreo.message)
                return res.status(201).json({ msg: "El proyecto se creó, pero el correo NO pudo enviarse" })
            }
            return res.status(201).json({ msg: "Proyecto registrado y correo enviado al cliente" })
        }
        res.status(201).json({ msg: "Proyecto registrado para un cliente ya existente" })
    } catch (error) {
        await borrarImagenes(imagenes)
        responderError(res, error)
    } finally {
        await limpiarTemporales(req.files)
    }
}

const consultaPorRol = (user) => {
    if (user.rol === "carpintero") return { carpintero: user._id, estadoProyecto: true }
    if (user.rol === "cliente") return { cliente: user._id, estadoProyecto: true }
    return { estadoProyecto: true } // administrador
}

// =====================================================
// LISTAR PROYECTOS ACTIVOS (carpintero: los suyos; cliente: los suyos)
// =====================================================
const listarProyectos = async (req, res) => {
    try {
        const proyectos = masRecientesPrimero(await Proyecto.listar(consultaPorRol(req.user)))
        if (proyectos.length === 0) {
            return res.status(404).json({ msg: "No hay proyectos disponibles" })
        }
        res.status(200).json(await presentarProyectos(proyectos))
    } catch (error) {
        responderError(res, error)
    }
}

// =====================================================
// REQUERIMIENTOS DE PEDIDO DEL CARPINTERO (HU-011)
// Lista vacía (200) si aún no tiene pedidos asignados.
// =====================================================
const listarRequerimientos = async (req, res) => {
    try {
        const proyectos = masRecientesPrimero(await Proyecto.listar(consultaPorRol(req.user)))
        res.status(200).json(await presentarProyectos(proyectos))
    } catch (error) {
        responderError(res, error)
    }
}

// =====================================================
// DETALLE DE UN PROYECTO
// =====================================================
const detalleProyecto = async (req, res) => {
    try {
        const proyecto = await Proyecto.porId(req.params.id)
        if (!proyecto) return res.status(404).json({ msg: "Proyecto no encontrado" })

        const { rol, _id } = req.user
        const permitido =
            rol === "administrador" ||
            (rol === "carpintero" && proyecto.carpintero === _id) ||
            (rol === "cliente" && proyecto.cliente === _id)
        if (!permitido) return res.status(403).json({ msg: "Acción no permitida" })

        const estados = (await Estado.porProyecto(proyecto._id))
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .map(({ createdAt, updatedAt, pagoEnCurso, ...resto }) => resto)

        const [presentado] = await presentarProyectos([proyecto])
        res.status(200).json({ ...presentado, estados })
    } catch (error) {
        responderError(res, error)
    }
}

// Carga el proyecto y verifica que pertenezca al carpintero autenticado.
const proyectoDelCarpintero = async (req, res) => {
    const proyecto = await Proyecto.porId(req.params.id)
    if (!proyecto) {
        res.status(404).json({ msg: "Proyecto no encontrado" })
        return null
    }
    if (proyecto.carpintero !== req.user._id) {
        res.status(403).json({ msg: "Acción no permitida" })
        return null
    }
    return proyecto
}

// =====================================================
// ELIMINAR (LÓGICO) PROYECTO
// =====================================================
const eliminarProyecto = async (req, res) => {
    try {
        const proyecto = await proyectoDelCarpintero(req, res)
        if (!proyecto) return

        await Proyecto.actualizar(proyecto._id, { estadoProyecto: false })
        res.status(200).json({ msg: "Proyecto eliminado exitosamente" })
    } catch (error) {
        responderError(res, error)
    }
}

// =====================================================
// ACTUALIZAR PROYECTO
// Solo se aplican los campos permitidos; nunca el cliente, el carpintero ni credenciales.
// =====================================================
const actualizarProyecto = async (req, res) => {
    let imagenes = {}
    try {
        const proyecto = await proyectoDelCarpintero(req, res)
        if (!proyecto) return

        const cambios = {}
        for (const campo of CAMPOS_EDITABLES) {
            if (req.body[campo] === undefined) continue
            if (!texto(req.body[campo])) return res.status(400).json({ msg: `Debes llenar el campo ${campo}` })
            cambios[campo] = texto(req.body[campo])
        }
        if (cambios.fechaEntrega !== undefined) {
            const { fecha, error } = leerFechaEntrega(cambios.fechaEntrega)
            if (error) return res.status(400).json({ msg: error })
            cambios.fechaEntrega = fecha
        }

        imagenes = await procesarImagenes(req)
        const actualizado = await Proyecto.actualizar(proyecto._id, { ...cambios, ...imagenes })

        // Se borran las imágenes anteriores solo cuando la actualización ya se guardó
        if (imagenes.imagenProyectoPath) await eliminarArchivo(proyecto.imagenProyectoPath)
        if (imagenes.imagenProyectoIAPath) await eliminarArchivo(proyecto.imagenProyectoIAPath)

        res.status(200).json({ msg: "Proyecto actualizado correctamente", proyecto: (await presentarProyectos([actualizado]))[0] })
    } catch (error) {
        await borrarImagenes(imagenes)
        responderError(res, error)
    } finally {
        await limpiarTemporales(req.files)
    }
}

export {
    registrarProyecto,
    solicitarProyecto,
    listarProyectos,
    listarRequerimientos,
    detalleProyecto,
    eliminarProyecto,
    actualizarProyecto,
}
