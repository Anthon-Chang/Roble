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
        const { paymentMethodId, estadoId, cantidad, motivo } = req.body

        // Validaciones básicas
        if (!paymentMethodId || !estadoId) {
            return res.status(400).json({ msg: "Faltan datos obligatorios" })
        }

        if (!mongoose.Types.ObjectId.isValid(estadoId)) {
            return res.status(404).json({ msg: "Estado no válido" })
        }

        const estado = await Estado.findById(estadoId)
        if (!estado) {
            return res.status(404).json({ msg: "Estado no encontrado" })
        }

        if (estado.estadoPago === "Pagado") {
            return res.status(400).json({ msg: "Este estado ya fue pagado" })
        }

        // 🔐 Validación de cantidad (SOLO TESTING)
        if (cantidad !== undefined) {
            if (Number(cantidad) !== estado.precio) {
                return res.status(400).json({
                    msg: `Cantidad incorrecta. El valor correcto es ${estado.precio}`
                })
            }
        }

        // Obtener proyecto
        const proyecto = await Proyecto.findById(estado.proyecto)

        // Cliente Stripe
        const clienteStripe = await stripe.customers.create({
            name: proyecto.nombreCliente,
            email: proyecto.emailCliente
        })

        // Crear pago (el monto REAL viene de BD)
        const payment = await stripe.paymentIntents.create({
            amount: Math.round(estado.precio * 100),
            currency: "usd",
            description: motivo || `Pago estado: ${estado.nombre}`,
            payment_method: paymentMethodId,
            confirm: true,
            customer: clienteStripe.id,
            receipt_email: proyecto.emailCliente,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: "never"
            }
        })

        if (payment.status === "succeeded") {
            estado.estadoPago = "Pagado"
            await estado.save()

            return res.status(200).json({
                msg: "Pago realizado exitosamente",
                montoCobrado: estado.precio
            })
        }

        res.status(400).json({ msg: `Pago no completado: ${payment.status}` })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error al pagar el estado - ${error.message}` })
    }
}


export {
    registrarEstado,
    eliminarEstado,
    pagarEstado
}
