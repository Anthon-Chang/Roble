import Stripe from "stripe"
import mongoose from "mongoose"
import Estado from "../models/Estado.js"
import Proyecto from "../models/Proyecto.js"

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY)

// =======================================
// REGISTRAR ESTADO DEL PROYECTO
// =======================================
const registrarEstado = async (req, res) => {
    try {
        const { proyecto } = req.body

        // Validar campos vacíos
        if (Object.values(req.body).includes("")) {
            return res.status(400).json({ msg: "Debes llenar todos los campos" })
        }

        // Validar ObjectId del proyecto
        if (!mongoose.Types.ObjectId.isValid(proyecto)) {
            return res.status(404).json({ msg: `No existe el proyecto ${proyecto}` })
        }

        // Verificar que el proyecto exista
        const proyectoExistente = await Proyecto.findById(proyecto)
        if (!proyectoExistente) {
            return res.status(404).json({ msg: "Proyecto no encontrado" })
        }

        // Crear el estado
        const nuevoEstado = await Estado.create(req.body)

        // Asociar el estado al proyecto
        proyectoExistente.estados.push(nuevoEstado._id)
        await proyectoExistente.save()

        res.status(201).json({ msg: "Estado registrado correctamente" })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}

// =======================================
// ELIMINAR ESTADO DEL PROYECTO
// =======================================

const eliminarEstado = async (req, res) => {
    try {
        const { id } = req.params

        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ msg: `No existe el estado ${id}` })
        }

        // Buscar estado
        const estado = await Estado.findById(id)
        if (!estado) {
            return res.status(404).json({ msg: "Estado no encontrado" })
        }

        // Eliminar referencia en Proyecto
        await Proyecto.findByIdAndUpdate(
            estado.proyecto,
            { $pull: { estados: estado._id } }
        )

        // Eliminar estado
        await Estado.findByIdAndDelete(id)

        res.status(200).json({ msg: "Estado eliminado exitosamente" })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

// =====================================================
// PAGAR ESTADO
// =====================================================
const pagarEstado = async (req, res) => {
    try {
        const { paymentMethodId, estadoId, motivo } = req.body

        // Validaciones básicas
        if (!paymentMethodId || !estadoId) {
            return res.status(400).json({ msg: "Faltan datos para realizar el pago" })
        }

        if (!mongoose.Types.ObjectId.isValid(estadoId)) {
            return res.status(404).json({ msg: `No existe el estado ${estadoId}` })
        }

        // Buscar estado
        const estado = await Estado.findById(estadoId)
        if (!estado) {
            return res.status(404).json({ msg: "Estado no encontrado" })
        }

        if (estado.estadoPago === "Pagado") {
            return res.status(400).json({ msg: "Este estado ya fue pagado" })
        }

        // Buscar proyecto
        const proyecto = await Proyecto.findById(estado.proyecto)
        if (!proyecto) {
            return res.status(404).json({ msg: "Proyecto no encontrado" })
        }

        // Crear cliente en Stripe
        const clienteStripe = await stripe.customers.create({
            name: proyecto.nombreCliente,
            email: proyecto.emailCliente,
            metadata: {
                proyectoId: proyecto._id.toString(),
                estadoId: estado._id.toString()
            }
        })

        // Crear intento de pago
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(estado.precio * 100), // Stripe trabaja en centavos
            currency: "usd",
            description: motivo || `Pago del estado del proyecto ${proyecto.nombreProyecto}`,
            payment_method: paymentMethodId,
            customer: clienteStripe.id,
            confirm: true,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: "never"
            }
        })

        // Verificar pago
        if (paymentIntent.status === "succeeded") {
            estado.estadoPago = "Pagado"
            await estado.save()

            return res.status(200).json({
                msg: "Pago realizado exitosamente",
                estado,
                paymentIntentId: paymentIntent.id
            })
        }

        res.status(400).json({
            msg: `El pago no se completó`,
            status: paymentIntent.status
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({
            msg: "❌ Error al procesar el pago",
            error: error.message
        })
    }
}


export {
    registrarEstado,
    eliminarEstado,
    pagarEstado
}
