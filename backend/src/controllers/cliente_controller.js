import Cliente from "../models/Cliente.js"
import Proyecto from "../models/Proyecto.js"
import { crearTokenJWT } from "../middlewares/JWT.js"
import { emailValido, encryptPassword, matchPassword, normalizarEmail } from "../helpers/password.js"
import { masRecientesPrimero, sinSecretos } from "../helpers/firestore.js"

const PASSWORD_MINIMO = 8
const cedulaValida = (cedula) => /^\d{10}$/.test(String(cedula).trim())

// =============================
// REGISTRO DEL CLIENTE (HU-005)
// No requiere aprobación del administrador ni confirmación de correo.
// =============================
export const registroCliente = async (req, res) => {
    try {
        const { nombre, apellido, email, password, cedula, celular } = req.body

        for (const valor of [nombre, apellido, email, password]) {
            if (typeof valor !== "string" || valor.trim() === "") {
                return res.status(400).json({ msg: "Debes llenar todos los campos obligatorios (nombre, apellido, email y password)" })
            }
        }
        if (!emailValido(email)) {
            return res.status(400).json({ msg: "El formato del correo electrónico no es válido" })
        }
        if (password.length < PASSWORD_MINIMO) {
            return res.status(400).json({ msg: `El password debe tener al menos ${PASSWORD_MINIMO} caracteres` })
        }
        if (cedula && !cedulaValida(cedula)) {
            return res.status(400).json({ msg: "La cédula debe tener 10 dígitos" })
        }

        if (await Cliente.porEmail(email)) {
            return res.status(400).json({ msg: "El email ya se encuentra registrado" })
        }
        if (cedula && (await Cliente.porCedula(cedula))) {
            return res.status(400).json({ msg: "La cédula ya se encuentra registrada" })
        }

        await Cliente.crear({
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            email,
            password: await encryptPassword(password),
            cedula: cedula ? String(cedula).trim() : "",
            celular: celular ? String(celular).trim() : "",
        })

        res.status(201).json({ msg: "Cuenta creada correctamente, ya puedes iniciar sesión" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
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
            token: crearTokenJWT(cliente._id, "cliente"),
            rol: "cliente",
            _id: cliente._id,
            nombre: cliente.nombre,
            apellido: cliente.apellido,
            email: cliente.email,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

export const perfilCliente = (req, res) => {
    res.status(200).json(sinSecretos(req.user))
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
            token: crearTokenJWT(cliente._id, "cliente"),
            rol: "cliente",
            _id: proyectos[0]?._id ?? cliente._id,
            clienteId: cliente._id,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

export const perfilClienteProyecto = (req, res) => {
    const c = req.user
    res.json({
        _id: c._id,
        nombreCliente: `${c.nombre} ${c.apellido}`.trim(),
        emailCliente: normalizarEmail(c.email),
        cedulaCliente: c.cedula,
        celularCliente: c.celular,
        rol: "cliente",
    })
}
