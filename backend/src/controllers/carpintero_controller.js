import Carpintero, { CAMPOS_REGISTRO } from "../models/carpintero.js"
import Mueble from "../models/Mueble.js"
import Model3D from "../models/modelo3D.js"
import {
    sendMailToRecoveryPassword,
    sendMailToRegister,
    sendMailNuevoCV,
} from "../helpers/sendMail.js"
import { crearTokenJWT } from "../middlewares/JWT.js"
import {
    crearTokenAleatorio,
    emailValido,
    encryptPassword,
    matchPassword,
    normalizarEmail,
} from "../helpers/password.js"
import { sinSecretos } from "../helpers/firestore.js"
import { subirArchivo } from "../helpers/storage.js"
import { limpiarTemporales, validarPdf } from "../helpers/archivos.js"

const PASSWORD_MINIMO = 8
const HORA_MS = 60 * 60 * 1000

// Campos visibles para cualquier usuario autenticado (nunca contraseña, token ni correo).
const camposPublicos = (c) => ({
    _id: c._id,
    nombre: c.nombre,
    apellido: c.apellido,
    direccion: c.direccion,
    celular: c.celular,
    anios_experiencia: c.anios_experiencia,
    cvUrl: c.cvUrl,
})

// =============================
// REGISTRO (HU-003)
// =============================
const registro = async (req, res) => {
    try {
        // Solo se toman los campos permitidos: el cliente no puede enviar rol, estadoAprobacion, etc.
        const datos = {}
        for (const campo of CAMPOS_REGISTRO) {
            if (req.body[campo] !== undefined) datos[campo] = req.body[campo]
        }

        for (const campo of ["nombre", "apellido", "email", "password"]) {
            if (typeof datos[campo] !== "string" || datos[campo].trim() === "") {
                return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" })
            }
        }
        if (!emailValido(datos.email)) {
            return res.status(400).json({ msg: "El formato del correo electrónico no es válido" })
        }
        if (datos.password.length < PASSWORD_MINIMO) {
            return res.status(400).json({ msg: `El password debe tener al menos ${PASSWORD_MINIMO} caracteres` })
        }

        const email = normalizarEmail(datos.email)
        if (await Carpintero.porEmail(email)) {
            return res.status(400).json({ msg: "Lo sentimos, el email ya se encuentra registrado" })
        }

        const token = crearTokenAleatorio()
        await Carpintero.crear({
            nombre: datos.nombre.trim(),
            apellido: datos.apellido.trim(),
            direccion: datos.direccion?.trim() || null,
            celular: datos.celular?.trim() || null,
            anios_experiencia: Number(datos.anios_experiencia) || 0,
            email,
            password: await encryptPassword(datos.password),
            token,
        })

        try {
            await sendMailToRegister(email, token)
        } catch (error) {
            console.error("❌ No se pudo enviar el correo de confirmación:", error.message)
            return res.status(201).json({ msg: "Cuenta creada, pero no se pudo enviar el correo de confirmación" })
        }

        res.status(201).json({ msg: "Revisa tu correo electrónico para confirmar tu cuenta" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

// =============================
// CONFIRMAR CORREO
// =============================
const confirmarMail = async (req, res) => {
    try {
        const carpinteroBDD = await Carpintero.porToken(req.params.token)
        if (!carpinteroBDD || carpinteroBDD.tokenExpira) {
            return res.status(404).json({ msg: "Token inválido o cuenta ya confirmada" })
        }

        await Carpintero.actualizar(carpinteroBDD._id, { token: null, confirmEmail: true })
        res.status(200).json({ msg: "Cuenta confirmada, ya puedes iniciar sesión" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

// =============================
// RECUPERAR PASSWORD
// =============================
const recuperarPassword = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) {
            return res.status(400).json({ msg: "Debes ingresar un correo electrónico" })
        }

        const carpinteroBDD = await Carpintero.porEmail(email)
        if (!carpinteroBDD) {
            return res.status(404).json({ msg: "El usuario no se encuentra registrado" })
        }

        const token = crearTokenAleatorio()
        await Carpintero.actualizar(carpinteroBDD._id, { token, tokenExpira: new Date(Date.now() + HORA_MS) })
        await sendMailToRecoveryPassword(carpinteroBDD.email, token)

        res.status(200).json({ msg: "Revisa tu correo electrónico para reestablecer tu password" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const tokenRecuperacionVigente = (carpintero) =>
    carpintero && carpintero.tokenExpira && new Date(carpintero.tokenExpira) > new Date()

// =============================
// COMPROBAR TOKEN DE PASSWORD
// =============================
const comprobarTokenPassword = async (req, res) => {
    try {
        const carpinteroBDD = await Carpintero.porToken(req.params.token)
        if (!tokenRecuperacionVigente(carpinteroBDD)) {
            return res.status(404).json({ msg: "Lo sentimos, no se puede validar el token" })
        }
        res.status(200).json({ msg: "Token confirmado, ya puedes crear tu nuevo password" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

// =============================
// CREAR NUEVO PASSWORD
// =============================
const crearNuevoPassword = async (req, res) => {
    try {
        const { password, confirmpassword } = req.body

        if (!password || !confirmpassword) {
            return res.status(400).json({ msg: "Debes llenar todos los campos" })
        }
        if (password !== confirmpassword) {
            return res.status(400).json({ msg: "Los passwords no coinciden" })
        }
        if (password.length < PASSWORD_MINIMO) {
            return res.status(400).json({ msg: `El password debe tener al menos ${PASSWORD_MINIMO} caracteres` })
        }

        const carpinteroBDD = await Carpintero.porToken(req.params.token)
        if (!tokenRecuperacionVigente(carpinteroBDD)) {
            return res.status(404).json({ msg: "No se puede validar la cuenta" })
        }

        await Carpintero.actualizar(carpinteroBDD._id, {
            token: null,
            tokenExpira: null,
            password: await encryptPassword(password),
        })
        res.status(200).json({ msg: "Felicitaciones, ya puedes iniciar sesión con tu nuevo password" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

// =============================
// LOGIN
// =============================
const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ msg: "Debes llenar todos los campos" })
        }

        const carpinteroBDD = await Carpintero.porEmail(email)
        if (!carpinteroBDD) {
            return res.status(404).json({ msg: "El usuario no se encuentra registrado" })
        }
        if (carpinteroBDD.status === false) {
            return res.status(403).json({ msg: "Tu cuenta está desactivada" })
        }
        if (!carpinteroBDD.confirmEmail) {
            return res.status(403).json({ msg: "Debes verificar tu cuenta antes de iniciar sesión" })
        }
        if (!(await matchPassword(password, carpinteroBDD.password))) {
            return res.status(401).json({ msg: "El password no es correcto" })
        }

        const token = crearTokenJWT(carpinteroBDD._id, carpinteroBDD.rol)

        res.status(200).json({
            token,
            rol: carpinteroBDD.rol,
            nombre: carpinteroBDD.nombre,
            apellido: carpinteroBDD.apellido,
            direccion: carpinteroBDD.direccion,
            celular: carpinteroBDD.celular,
            telefono: carpinteroBDD.celular,
            _id: carpinteroBDD._id,
            email: carpinteroBDD.email,
            estadoAprobacion: carpinteroBDD.estadoAprobacion,
            cvUrl: carpinteroBDD.cvUrl,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

// =============================
// PERFIL
// =============================
const perfil = (req, res) => {
    const { token, confirmEmail, createdAt, updatedAt, __v, cvPath, ...datosPerfil } = req.user
    res.status(200).json(datosPerfil)
}

// =============================
// ACTUALIZAR PERFIL
// =============================
const actualizarPerfil = async (req, res) => {
    try {
        const { id } = req.params
        // Cada carpintero solo puede editar su propio perfil
        if (id !== req.user._id) {
            return res.status(403).json({ msg: "Acción no permitida" })
        }

        const editables = ["nombre", "apellido", "direccion", "celular", "email"]
        const cambios = {}
        for (const campo of editables) {
            if (req.body[campo] === undefined) continue
            if (typeof req.body[campo] !== "string" || req.body[campo].trim() === "") {
                return res.status(400).json({ msg: "Debes llenar todos los campos" })
            }
            cambios[campo] = req.body[campo].trim()
        }

        if (cambios.email !== undefined) {
            if (!emailValido(cambios.email)) {
                return res.status(400).json({ msg: "El formato del correo electrónico no es válido" })
            }
            cambios.email = normalizarEmail(cambios.email)
            if (cambios.email !== req.user.email) {
                const existente = await Carpintero.porEmail(cambios.email)
                if (existente) return res.status(400).json({ msg: "El email ya se encuentra registrado" })
            }
        }

        const actualizado = await Carpintero.actualizar(id, cambios)
        res.status(200).json(sinSecretos(actualizado, ["cvPath"]))
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

// =============================
// ACTUALIZAR PASSWORD
// =============================
const actualizarPassword = async (req, res) => {
    try {
        if (req.params.id !== req.user._id) {
            return res.status(403).json({ msg: "Acción no permitida" })
        }
        const { passwordactual, passwordnuevo } = req.body
        if (!passwordactual || !passwordnuevo) {
            return res.status(400).json({ msg: "Debes llenar todos los campos" })
        }
        if (passwordnuevo.length < PASSWORD_MINIMO) {
            return res.status(400).json({ msg: `El password debe tener al menos ${PASSWORD_MINIMO} caracteres` })
        }

        const carpinteroBDD = await Carpintero.porId(req.user._id)
        if (!carpinteroBDD) {
            return res.status(404).json({ msg: "Lo sentimos, no existe el carpintero" })
        }
        if (!(await matchPassword(passwordactual, carpinteroBDD.password))) {
            return res.status(400).json({ msg: "Lo sentimos, el password actual no es el correcto" })
        }

        await Carpintero.actualizar(carpinteroBDD._id, { password: await encryptPassword(passwordnuevo) })
        res.status(200).json({ msg: "Password actualizado correctamente" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

// =============================
// CARGAR / ACTUALIZAR CV EN PDF (HU-004)
// =============================
const subirCV = async (req, res) => {
    try {
        const archivo = req.files?.cv
        if (!archivo || Array.isArray(archivo)) {
            return res.status(400).json({ msg: "Debes enviar un único archivo PDF en el campo 'cv'" })
        }

        const error = await validarPdf(archivo)
        if (error) return res.status(400).json({ msg: error })

        const { url, path } = await subirArchivo(archivo, "cvs", { rutaFija: `cvs/${req.user._id}/cv.pdf` })

        const cambios = { cvUrl: url, cvPath: path, cvActualizado: new Date() }
        // Un perfil rechazado vuelve a revisión al subir un CV nuevo
        if (req.user.estadoAprobacion === "rechazado") {
            cambios.estadoAprobacion = "pendiente"
            cambios.motivoRechazo = null
        }
        const actualizado = await Carpintero.actualizar(req.user._id, cambios)

        // Aviso al administrador (no bloquea la respuesta si falla)
        if (process.env.ADMIN_NOTIFY_EMAIL) {
            sendMailNuevoCV(process.env.ADMIN_NOTIFY_EMAIL, `${actualizado.nombre} ${actualizado.apellido}`).catch((e) =>
                console.error("⚠️ No se pudo avisar al administrador:", e.message)
            )
        }

        res.status(200).json({
            msg: "CV cargado correctamente. Tu perfil será revisado por el administrador",
            cvUrl: actualizado.cvUrl,
            estadoAprobacion: actualizado.estadoAprobacion,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    } finally {
        await limpiarTemporales(req.files)
    }
}

const verMiCV = (req, res) => {
    if (!req.user.cvUrl) return res.status(404).json({ msg: "Aún no has cargado tu CV" })
    res.status(200).json({ cvUrl: req.user.cvUrl, cvActualizado: req.user.cvActualizado, estadoAprobacion: req.user.estadoAprobacion })
}

// =============================
// PERFILES PROFESIONALES APROBADOS (HU-009)
// =============================
const listarAprobados = async (req, res) => {
    try {
        const aprobados = await Carpintero.listar({ estadoAprobacion: "aprobado" })
        res.status(200).json(aprobados.map(camposPublicos))
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

const detalleAprobado = async (req, res) => {
    try {
        const carpintero = await Carpintero.porId(req.params.id)
        if (!carpintero || carpintero.estadoAprobacion !== "aprobado") {
            return res.status(404).json({ msg: "Carpintero no encontrado" })
        }
        const [muebles, modelos3D] = await Promise.all([
            Mueble.listar({ carpintero: carpintero._id }),
            Model3D.listar({ carpintero: carpintero._id }),
        ])
        res.status(200).json({ ...camposPublicos(carpintero), muebles, modelos3D })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

export {
    registro,
    confirmarMail,
    recuperarPassword,
    comprobarTokenPassword,
    crearNuevoPassword,
    login,
    perfil,
    actualizarPerfil,
    actualizarPassword,
    subirCV,
    verMiCV,
    listarAprobados,
    detalleAprobado,
}
