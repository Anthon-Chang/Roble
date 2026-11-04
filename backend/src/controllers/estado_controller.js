import Stripe from "stripe"
import Estado, { PRIORIDADES } from "../models/Estado.js"
import Proyecto from "../models/Proyecto.js"

// Cliente de Stripe creado al usarse (así no falla al importar si la variable aún no está cargada)
let stripe = null
const getStripe = () => {
    if (!stripe) stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY)
    return stripe
}

const texto = (valor) => (typeof valor === "string" ? valor.trim() : "")

// Carga el proyecto de un estado y comprueba que el carpintero autenticado sea su dueño.
const proyectoDelCarpintero = async (proyectoId, user) => {
    const proyecto = await Proyecto.porId(proyectoId)
    if (!proyecto) return { codigo: 404, msg: "Proyecto no encontrado" }
    if (proyecto.carpintero !== user._id) return { codigo: 403, msg: "Acción no permitida" }
    return { proyecto }
}

// =======================================
// REGISTRAR ESTADO DEL PROYECTO (carpintero dueño del proyecto)
// =======================================
const registrarEstado = async (req, res) => {
    try {
        const { proyecto: proyectoId, nombre, detalle, prioridad, precio } = req.body

        if (!texto(nombre) || !texto(detalle) || !texto(prioridad) || precio === undefined || precio === "") {
            return res.status(400).json({ msg: "Debes llenar todos los campos" })
        }
        if (!PRIORIDADES.includes(prioridad)) {
            return res.status(400).json({ msg: `La prioridad debe ser: ${PRIORIDADES.join(", ")}` })
        }
        const precioNumero = Number(precio)
        if (!Number.isFinite(precioNumero) || precioNumero < 1) {
            return res.status(400).json({ msg: "El precio debe ser un número mayor o igual a 1" })
        }

        const { proyecto, codigo, msg } = await proyectoDelCarpintero(texto(proyectoId), req.user)
        if (!proyecto) return res.status(codigo).json({ msg })

        await Estado.crear({
            proyecto: proyecto._id,
            nombre: texto(nombre),
            detalle: texto(detalle),
            prioridad,
            precio: precioNumero,
        })

        res.status(201).json({ msg: "Estado registrado correctamente" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

// =======================================
// ELIMINAR ESTADO DEL PROYECTO (carpintero dueño del proyecto)
// =======================================
const eliminarEstado = async (req, res) => {
    try {
        const estado = await Estado.porId(req.params.id)
        if (!estado) return res.status(404).json({ msg: "Estado no encontrado" })

        const { proyecto, codigo, msg } = await proyectoDelCarpintero(estado.proyecto, req.user)
        if (!proyecto) return res.status(codigo).json({ msg })

        if (estado.estadoPago === "Pagado") {
            return res.status(400).json({ msg: "No se puede eliminar un estado que ya fue pagado" })
        }

        await Estado.eliminar(estado._id)
        res.status(200).json({ msg: "Estado eliminado exitosamente" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

// =====================================================
// PAGAR ESTADO (cliente dueño del proyecto)
// =====================================================
const pagarEstado = async (req, res) => {
    try {
        const { paymentMethodId, estadoId, cantidad, motivo } = req.body

        if (!paymentMethodId || !estadoId) {
            return res.status(400).json({ msg: "Faltan datos obligatorios" })
        }

        const estado = await Estado.porId(texto(estadoId))
        if (!estado) return res.status(404).json({ msg: "Estado no encontrado" })

        const proyecto = await Proyecto.porId(estado.proyecto)
        if (!proyecto || proyecto.cliente !== req.user._id) {
            return res.status(403).json({ msg: "No puedes pagar estados de proyectos ajenos" })
        }

        if (estado.estadoPago === "Pagado") {
            return res.status(400).json({ msg: "Este estado ya fue pagado" })
        }

        // 🔐 Validación de cantidad (SOLO TESTING)
        if (cantidad !== undefined && Number(cantidad) !== estado.precio) {
            return res.status(400).json({ msg: `Cantidad incorrecta. El valor correcto es ${estado.precio}` })
        }

        const stripeClient = getStripe()
        const clienteStripe = await stripeClient.customers.create({
            name: proyecto.nombreCliente,
            email: proyecto.emailCliente,
        })

        // El monto REAL viene de la base de datos, nunca del cliente
        const payment = await stripeClient.paymentIntents.create({
            amount: Math.round(estado.precio * 100),
            currency: "usd",
            description: motivo || `Pago estado: ${estado.nombre}`,
            payment_method: paymentMethodId,
            confirm: true,
            customer: clienteStripe.id,
            receipt_email: proyecto.emailCliente,
            automatic_payment_methods: { enabled: true, allow_redirects: "never" },
        })

        if (payment.status === "succeeded") {
            await Estado.actualizar(estado._id, { estadoPago: "Pagado", stripePaymentId: payment.id })
            return res.status(200).json({ msg: "Pago realizado exitosamente", montoCobrado: estado.precio })
        }

        res.status(400).json({ msg: `Pago no completado: ${payment.status}` })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error al pagar el estado - ${error.message}` })
    }
}

export { registrarEstado, eliminarEstado, pagarEstado }
