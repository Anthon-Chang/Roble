import carpintero from "../models/carpintero.js"
import { sendMailToRecoveryPassword, sendMailToRegister } from "../helpers/sendMail.js"
import { crearTokenJWT } from "../middlewares/JWT.js"


// =============================
// REGISTRO
// =============================
const registro = async (req, res) => {
    try {
        const { email, password } = req.body

        // Validar campos vacíos
        if (Object.values(req.body).includes("")) {
            return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" })
        }

        // Verificar si el email ya existe
        const verificarEmailBDD = await carpintero.findOne({ email })
        if (verificarEmailBDD) {
            return res.status(400).json({ msg: "Lo sentimos, el email ya se encuentra registrado" })
        }

        // Crear nuevo carpintero
        const nuevoCarpintero = new carpintero(req.body)

        // Encriptar contraseña
        nuevoCarpintero.password = await nuevoCarpintero.encryptPassword(password)

        // Crear token y enviar correo
        const token = nuevoCarpintero.createToken()
        await sendMailToRegister(email, token)

        // Guardar
        await nuevoCarpintero.save()

        res.status(201).json({ msg: "Revisa tu correo electrónico para confirmar tu cuenta" })

    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}


// =============================
// CONFIRMAR CORREO
// =============================
const confirmarMail = async (req, res) => {
    try {
        const { token } = req.params

        const carpinteroBDD = await carpintero.findOne({ token })
        if (!carpinteroBDD) {
            return res.status(404).json({ msg: "Token inválido o cuenta ya confirmada" })
        }

        carpinteroBDD.token = null
        carpinteroBDD.confirmEmail = true
        await carpinteroBDD.save()

        res.status(200).json({ msg: "Cuenta confirmada, ya puedes iniciar sesión" })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
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

        const carpinteroBDD = await carpintero.findOne({ email })
        if (!carpinteroBDD) {
            return res.status(404).json({ msg: "El usuario no se encuentra registrado" })
        }

        const token = carpinteroBDD.createToken()
        carpinteroBDD.token = token

        await sendMailToRecoveryPassword(email, token)
        await carpinteroBDD.save()

        res.status(200).json({ msg: "Revisa tu correo electrónico para reestablecer tu password" })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}


// =============================
// COMPROBAR TOKEN DE PASSWORD
// =============================
const comprobarTokenPassword = async (req, res) => {
    try {
        const { token } = req.params
        const carpinteroBDD = await carpintero.findOne({ token })

        if (carpinteroBDD?.token !== token) {
            return res.status(404).json({ msg: "Lo sentimos, no se puede validar el token" })
        }

        res.status(200).json({ msg: "Token confirmado, ya puedes crear tu nuevo password" })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}


// =============================
// CREAR NUEVO PASSWORD
// =============================
const crearNuevoPassword = async (req, res) => {
    try {
        const { password, confirmpassword } = req.body
        const { token } = req.params

        if (Object.values(req.body).includes("")) {
            return res.status(404).json({ msg: "Debes llenar todos los campos" })
        }

        if (password !== confirmpassword) {
            return res.status(404).json({ msg: "Los passwords no coinciden" })
        }

        const carpinteroBDD = await carpintero.findOne({ token })
        if (!carpinteroBDD) {
            return res.status(404).json({ msg: "No se puede validar la cuenta" })
        }

        carpinteroBDD.token = null
        carpinteroBDD.password = await carpinteroBDD.encryptPassword(password)
        await carpinteroBDD.save()

        res.status(200).json({ msg: "Felicitaciones, ya puedes iniciar sesión con tu nuevo password" })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}


// =============================
// LOGIN
// =============================
const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (Object.values(req.body).includes("")) {
            return res.status(404).json({ msg: "Debes llenar todos los campos" })
        }

        const carpinteroBDD = await carpintero
            .findOne({ email })
            .select("-status -__v -token -updatedAt -createdAt")

        if (!carpinteroBDD) {
            return res.status(404).json({ msg: "El usuario no se encuentra registrado" })
        }

        if (!carpinteroBDD.confirmEmail) {
            return res.status(403).json({ msg: "Debes verificar tu cuenta antes de iniciar sesión" })
        }

        const verificarPassword = await carpinteroBDD.matchPassword(password)
        if (!verificarPassword) {
            return res.status(401).json({ msg: "El password no es correcto" })
        }

        const { nombre, apellido, direccion, telefono, _id, rol } = carpinteroBDD

        const token = crearTokenJWT(carpinteroBDD._id, carpinteroBDD.rol)

        res.status(200).json({
            token,
            rol,
            nombre,
            apellido,
            direccion,
            telefono,
            _id,
            email: carpinteroBDD.email
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}


// =============================
// PERFIL
// =============================
const perfil = (req, res) => {
    try {
        const { token, confirmEmail, createdAt, updatedAt, __v, ...datosPerfil } = req.carpinteroHeader
        res.status(200).json(datosPerfil)

    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}


// =============================
// ACTUALIZAR PERFIL
// =============================
const actualizarPerfil = async (req, res) => {
    try {
        const { id } = req.params
        const { nombre, apellido, direccion, celular, email } = req.body

        // Validar ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ msg: `ID inválido: ${id}` })
        }

        // Buscar carpintero
        const carpinteroBDD = await carpintero.findById(id)
        if (!carpinteroBDD) {
            return res.status(404).json({ msg: `No existe el carpintero con ID ${id}` })
        }

        // Validar campos vacíos
        if (Object.values(req.body).includes("")) {
            return res.status(400).json({ msg: "Debes llenar todos los campos" })
        }

        // Validar si el email ya existe (si lo está cambiando)
        if (carpinteroBDD.email !== email) {
            const emailExistente = await carpintero.findOne({ email })
            if (emailExistente) {
                return res.status(400).json({ msg: `El email ya se encuentra registrado` })
            }
        }

        // Actualizar campos
        carpinteroBDD.nombre = nombre ?? carpinteroBDD.nombre
        carpinteroBDD.apellido = apellido ?? carpinteroBDD.apellido
        carpinteroBDD.direccion = direccion ?? carpinteroBDD.direccion
        carpinteroBDD.celular = celular ?? carpinteroBDD.celular
        carpinteroBDD.email = email ?? carpinteroBDD.email

        // Guardar cambios
        await carpinteroBDD.save()

        res.status(200).json(carpinteroBDD)

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}


// =============================
// ACTUALIZAR PASSWORD
// =============================
const actualizarPassword = async (req, res) => {
    try {
        const carpinteroBDD = await carpintero.findById(req.carpinteroHeader._id)

        if (!carpinteroBDD) {
            return res.status(404).json({ msg: `Lo sentimos, no existe el carpintero` })
        }

        // Verificar password actual
        const verificarPassword = await carpinteroBDD.matchPassword(req.body.passwordactual)
        if (!verificarPassword) {
            return res.status(404).json({ msg: "Lo sentimos, el password actual no es el correcto" })
        }

        // Encriptar nuevo password
        carpinteroBDD.password = await carpinteroBDD.encryptPassword(req.body.passwordnuevo)
        await carpinteroBDD.save()

        res.status(200).json({ msg: "Password actualizado correctamente" })

    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
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
    actualizarPassword
}
