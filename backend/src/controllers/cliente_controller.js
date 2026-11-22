import Cliente from "../models/Cliente.js"
import Proyecto from "../models/Proyecto.js"
import { crearTokenJWT } from "../middlewares/JWT.js"
import {
    crearTokenAleatorio,
    emailValido,
    encryptPassword,
    matchPassword,
    normalizarEmail,
} from "../helpers/password.js"
import { sendMailToRecoveryPassword } from "../helpers/sendMail.js"
import { masRecientesPrimero, sinSecretos } from "../helpers/firestore.js"
import { subirArchivo } from "../helpers/storage.js"
import { limpiarTemporales, validarImagen } from "../helpers/archivos.js"
import {
    combinar,
    validarApellido,
    validarCedula,
    validarCelular,
    validarLongitudEmail,
    validarNombre,
    validarPassword,
} from "../helpers/validaciones.js"

const HORA_MS = 60 * 60 * 1000

// =============================
// REGISTRO DEL CLIENTE (HU-005)
// No requiere aprobación del administrador ni confirmación de correo.
// =============================
export const registroCliente = async (req, res) => {
    try {
        const body = req.body || {}
        const { email, password } = body

        // Se valida todo el formulario (en el orden del formulario) antes de tocar la base de datos
        const { valores, error } = combinar({
            nombre: validarNombre(body.nombre),
            apellido: validarApellido(body.apellido),
            email: emailValido(email)
                ? validarLongitudEmail(email)
                : { error: "El formato del correo electrónico no es válido" },
            password: validarPassword(password),
            cedula: validarCedula(body.cedula),
            celular: validarCelular(body.celular),
        })
        if (error) return res.status(400).json({ msg: error })
        const { nombre, apellido, cedula, celular } = valores

        if (await Cliente.porEmail(email)) {
            return res.status(400).json({ msg: "El email ya se encuentra registrado" })
        }
        if (await Cliente.porCedula(cedula)) {
            return res.status(400).json({ msg: "La cédula ya se encuentra registrada" })
        }

        await Cliente.crear({
            nombre,
            apellido,
            email,
            password: await encryptPassword(password),
            cedula,
            celular,
        })

        res.status(201).json({ msg: "Cuenta creada correctamente, ya puedes iniciar sesión" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

const autenticar = async (identificador, password) => {
    if (!identificador || !password) return { error: [400, "Debes llenar todos los campos"] }
    const cliente = emailValido(identificador)
        ? await Cliente.porEmail(identificador)
        : await Cliente.porCedula(identificador)
    if (!cliente) return { error: [404, "El cliente no se encuentra registrado"] }
    if (cliente.status === false) return { error: [403, "Tu cuenta está desactivada"] }
    if (!(await matchPassword(password, cliente.password))) return { error: [401, "El password no es correcto"] }
    return { cliente }
}

// =============================
// LOGIN DEL CLIENTE (email o cédula)
// =============================
export const loginCliente = async (req, res) => {
    try {
        const { error, cliente } = await autenticar(req.body.email || req.body.cedula, req.body.password)
        if (error) return res.status(error[0]).json({ msg: error[1] })

        res.status(200).json({
            token: crearTokenJWT(cliente._id, "cliente", cliente.tokenVersion),
            rol: "cliente",
            _id: cliente._id,
            nombre: cliente.nombre,
            apellido: cliente.apellido,
            email: cliente.email,
            // true: el frontend debe obligar a cambiar la contraseña antes de seguir
            passwordTemporal: cliente.passwordTemporal === true,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// Perfil completo del cliente. Incluye los campos propios (nombre, apellido, email, cedula, celular)
// y los nombres con sufijo "Cliente" que lee la tarjeta de perfil del frontend, más su proyecto más reciente.
const armarPerfil = async (cliente) => {
    const proyectos = masRecientesPrimero(await Proyecto.listar({ cliente: cliente._id, estadoProyecto: true }))
    return {
        ...sinSecretos(cliente),
        rol: "cliente",
        nombreCliente: `${cliente.nombre || ""} ${cliente.apellido || ""}`.trim(),
        emailCliente: normalizarEmail(cliente.email),
        cedulaCliente: cliente.cedula || "",
        celularCliente: cliente.celular || "",
        nombreProyecto: proyectos[0]?.nombreProyecto ?? null,
        totalProyectos: proyectos.length,
    }
}

export const perfilCliente = async (req, res) => {
    try {
        res.status(200).json(await armarPerfil(req.user))
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// =============================
// ACTUALIZAR PERFIL (HU-020)
// Campos editables: nombre, apellido, celular y correo. La cédula no es editable por este medio.
// =============================
export const actualizarPerfilCliente = async (req, res) => {
    try {
        const body = req.body || {}
        const validadores = {
            nombre: validarNombre,
            apellido: validarApellido,
            celular: validarCelular,
            email: (valor) =>
                emailValido(valor)
                    ? { valor: normalizarEmail(valor), ...validarLongitudEmail(valor) }
                    : { error: "El formato del correo electrónico no es válido" },
        }
        const enviados = Object.fromEntries(
            Object.entries(validadores).filter(([campo]) => body[campo] !== undefined).map(([campo, validar]) => [campo, validar(body[campo])])
        )
        const { valores: cambios, error: errorCampos } = combinar(enviados)
        if (errorCampos) return res.status(400).json({ msg: errorCampos })

        if (cambios.email !== undefined && cambios.email !== req.user.email) {
            const existente = await Cliente.porEmail(cambios.email)
            if (existente) return res.status(400).json({ msg: "El email ya se encuentra registrado" })
        }
        if (Object.keys(cambios).length === 0) return res.status(400).json({ msg: "No se enviaron cambios" })

        const actualizado = await Cliente.actualizar(req.user._id, cambios)
        res.status(200).json(sinSecretos(actualizado))
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// =============================
// CARGAR / ACTUALIZAR FOTO DE PERFIL (HU-020)
// =============================
export const subirFotoCliente = async (req, res) => {
    try {
        const archivo = req.files?.foto
        if (!archivo || Array.isArray(archivo)) {
            return res.status(400).json({ msg: "Debes enviar un único archivo de imagen en el campo 'foto'" })
        }

        const error = await validarImagen(archivo)
        if (error) return res.status(400).json({ msg: error })

        const { url, path } = await subirArchivo(archivo, "fotos", { rutaFija: `fotos/cliente/${req.user._id}/foto` })
        const actualizado = await Cliente.actualizar(req.user._id, { fotoUrl: url, fotoPath: path })

        res.status(200).json({ msg: "Foto de perfil actualizada correctamente", fotoUrl: actualizado.fotoUrl })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    } finally {
        await limpiarTemporales(req.files)
    }
}

// =============================
// CAMBIAR CONTRASEÑA (cliente autenticado)
// Es la única acción permitida con una contraseña temporal; al cambiarla se libera la cuenta.
// =============================
export const actualizarPasswordCliente = async (req, res) => {
    try {
        const { passwordactual, passwordnuevo } = req.body || {}
        if (typeof passwordactual !== "string" || typeof passwordnuevo !== "string" || !passwordactual || !passwordnuevo) {
            return res.status(400).json({ msg: "Debes llenar todos los campos" })
        }
        const errorPassword = validarPassword(passwordnuevo).error
        if (errorPassword) return res.status(400).json({ msg: errorPassword })
        if (passwordnuevo === passwordactual) {
            return res.status(400).json({ msg: "El password nuevo debe ser distinto al actual" })
        }

        const cliente = await Cliente.porId(req.user._id)
        if (!cliente) return res.status(404).json({ msg: "Cliente no encontrado" })
        if (!(await matchPassword(passwordactual, cliente.password))) {
            return res.status(400).json({ msg: "El password actual no es el correcto" })
        }

        const tokenVersion = (cliente.tokenVersion || 0) + 1
        await Cliente.actualizar(cliente._id, {
            password: await encryptPassword(passwordnuevo),
            passwordTemporal: false,
            tokenVersion,
        })
        res.status(200).json({
            msg: "Password actualizado correctamente",
            token: crearTokenJWT(cliente._id, "cliente", tokenVersion),
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// =============================
// RECUPERAR CONTRASEÑA (HU-020)
// Responde siempre lo mismo exista o no el correo, para no revelar qué cuentas están registradas.
// =============================
const tokenVigente = (cliente) => cliente && cliente.tokenExpira && new Date(cliente.tokenExpira) > new Date()

export const recuperarPasswordCliente = async (req, res) => {
    const respuesta = { msg: "Si el correo está registrado, recibirás un enlace para restablecer tu password" }
    try {
        const { email } = req.body || {}
        if (!emailValido(email)) return res.status(400).json({ msg: "Debes ingresar un correo electrónico válido" })

        const cliente = await Cliente.porEmail(email)
        if (cliente && cliente.status !== false) {
            const token = crearTokenAleatorio()
            await Cliente.actualizar(cliente._id, { token, tokenExpira: new Date(Date.now() + HORA_MS) })
            try {
                await sendMailToRecoveryPassword(cliente.email, token, "cliente")
            } catch (errorCorreo) {
                console.error("❌ No se pudo enviar el correo de recuperación:", errorCorreo.message)
            }
        }
        res.status(200).json(respuesta)
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

export const comprobarTokenPasswordCliente = async (req, res) => {
    try {
        const cliente = await Cliente.porToken(req.params.token)
        if (!tokenVigente(cliente)) return res.status(404).json({ msg: "Lo sentimos, no se puede validar el token" })
        res.status(200).json({ msg: "Token confirmado, ya puedes crear tu nuevo password" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

export const crearNuevoPasswordCliente = async (req, res) => {
    try {
        const { password, confirmpassword } = req.body || {}
        if (typeof password !== "string" || typeof confirmpassword !== "string" || !password || !confirmpassword) {
            return res.status(400).json({ msg: "Debes llenar todos los campos" })
        }
        if (password !== confirmpassword) return res.status(400).json({ msg: "Los passwords no coinciden" })
        const errorPassword = validarPassword(password).error
        if (errorPassword) return res.status(400).json({ msg: errorPassword })

        const cliente = await Cliente.porToken(req.params.token)
        if (!tokenVigente(cliente)) return res.status(404).json({ msg: "No se puede validar la cuenta" })

        await Cliente.actualizar(cliente._id, {
            token: null,
            tokenExpira: null,
            password: await encryptPassword(password),
            passwordTemporal: false,
            // Restablecer la contraseña cierra todas las sesiones abiertas
            tokenVersion: (cliente.tokenVersion || 0) + 1,
        })
        res.status(200).json({ msg: "Felicitaciones, ya puedes iniciar sesión con tu nuevo password" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// =============================
// COMPATIBILIDAD con el frontend actual (/api/proyecto/login y /api/proyecto/perfil)
// =============================
export const loginClienteProyecto = async (req, res) => {
    try {
        const { emailCliente, passwordCliente } = req.body
        const { error, cliente } = await autenticar(emailCliente, passwordCliente)
        if (error) return res.status(error[0]).json({ msg: error[1] })

        // El frontend usa `_id` para abrir el detalle del proyecto: se devuelve el proyecto más reciente
        const proyectos = masRecientesPrimero(await Proyecto.listar({ cliente: cliente._id, estadoProyecto: true }))

        res.status(200).json({
            token: crearTokenJWT(cliente._id, "cliente", cliente.tokenVersion),
            rol: "cliente",
            _id: proyectos[0]?._id ?? cliente._id,
            clienteId: cliente._id,
            passwordTemporal: cliente.passwordTemporal === true,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// Compatibilidad: ruta antigua del perfil (/api/proyecto/perfil), mismo contenido que /api/cliente/perfil
export const perfilClienteProyecto = perfilCliente
