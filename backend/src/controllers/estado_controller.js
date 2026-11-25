import Stripe from "stripe"
import Estado, { PRIORIDADES } from "../models/Estado.js"
import Proyecto from "../models/Proyecto.js"
import Cliente from "../models/Cliente.js"
import { reservar, liberar } from "../helpers/firestore.js"
import { validarCedula } from "../helpers/validaciones.js"

// Cliente de Stripe creado al usarse (así no falla al importar si la variable aún no está cargada)
let stripe = null
const getStripe = () => {
    if (!stripe) stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY)
    return stripe
}

const texto = (valor) => (typeof valor === "string" ? valor.trim() : "")

// Total que realmente se cobra: precio + 12% de IVA (debe coincidir con lo que ve el cliente en el modal de pago)
const IVA = 0.12
const totalConIva = (precio) => Math.round(precio * (1 + IVA) * 100) / 100

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
        res.status(500).json({ msg: "❌ Error en el servidor" })
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
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// =====================================================
// PAGAR ESTADO (cliente dueño del proyecto)
// =====================================================
// Mientras un cobro está en curso el estado queda reservado (evita dos cobros simultáneos del mismo estado)
const RESERVA_PAGO_MS = 2 * 60 * 1000

const pagarEstado = async (req, res) => {
    let reservado = null
    try {
        const { paymentMethodId, estadoId, cantidad, motivo, cedula } = req.body

        if (!paymentMethodId || !estadoId) {
            return res.status(400).json({ msg: "Faltan datos obligatorios" })
        }

        const estado = await Estado.porId(texto(estadoId))
        if (!estado) return res.status(404).json({ msg: "Estado no encontrado" })

        const proyecto = await Proyecto.porId(estado.proyecto)
        if (!proyecto || proyecto.cliente !== req.user._id) {
            return res.status(403).json({ msg: "No puedes pagar estados de proyectos ajenos" })
        }

        // Reserva atómica: si otra petición ya está cobrando este estado, esta se rechaza
        if (!(await reservar("estados", estado._id, "pagoEnCurso", RESERVA_PAGO_MS))) {
            return res.status(409).json({ msg: "Ya hay un pago en curso para este estado" })
        }
        reservado = estado._id

        // Se vuelve a leer con la reserva tomada: otra petición pudo terminar el pago justo antes
        const vigente = await Estado.porId(estado._id)
        if (!vigente || vigente.estadoPago === "Pagado") {
            return res.status(400).json({ msg: "Este estado ya fue pagado" })
        }

        // Confirmación de identidad: quien paga debe escribir la cédula registrada en su cuenta
        const { error: errorCedula, valor: cedulaValida } = validarCedula(cedula)
        if (errorCedula) return res.status(400).json({ msg: errorCedula })

        const cliente = await Cliente.porId(req.user._id)
        if (!cliente || cliente.cedula !== cedulaValida) {
            return res.status(403).json({ msg: "La cédula no coincide con la registrada en tu cuenta" })
        }

        const montoAPagar = totalConIva(estado.precio)

        // 🔐 Validación de cantidad (SOLO TESTING)
        if (cantidad !== undefined && Number(cantidad) !== montoAPagar) {
            return res.status(400).json({ msg: `Cantidad incorrecta. El valor correcto es ${montoAPagar}` })
        }

        const stripeClient = getStripe()

        // Un solo Customer de Stripe por cliente (antes se creaba uno nuevo en cada pago, y ya lo necesitamos para la cédula)
        let stripeCustomerId = cliente?.stripeCustomerId
        if (!stripeCustomerId) {
            const creado = await stripeClient.customers.create({
                name: proyecto.nombreCliente,
                email: proyecto.emailCliente,
            })
            stripeCustomerId = creado.id
            await Cliente.actualizar(req.user._id, { stripeCustomerId })
        }

        // El monto REAL viene de la base de datos (precio + IVA), nunca del cliente
        const payment = await stripeClient.paymentIntents.create({
            amount: Math.round(montoAPagar * 100),
            currency: "usd",
            description: motivo || `Pago estado: ${estado.nombre}`,
            payment_method: paymentMethodId,
            confirm: true,
            customer: stripeCustomerId,
            receipt_email: proyecto.emailCliente,
            automatic_payment_methods: { enabled: true, allow_redirects: "never" },
        }, {
            // Si la misma petición se repite (doble clic, reintento de red) Stripe devuelve el mismo cobro
            idempotencyKey: `estado-${estado._id}-${paymentMethodId}`,
        })

        if (payment.status === "succeeded") {
            await Estado.actualizar(estado._id, { estadoPago: "Pagado", stripePaymentId: payment.id })
            return res.status(200).json({ msg: "Pago realizado exitosamente", montoCobrado: montoAPagar })
        }

        res.status(400).json({ msg: `Pago no completado: ${payment.status}` })
    } catch (error) {
        console.error(error)
        // Un rechazo de la tarjeta sí es información útil y segura para el cliente
        if (error?.type === "StripeCardError") return res.status(402).json({ msg: error.message })
        res.status(500).json({ msg: "❌ Error al pagar el estado" })
    } finally {
        if (reservado) await liberar("estados", reservado, "pagoEnCurso").catch((e) => console.error(e))
    }
}

export { registrarEstado, eliminarEstado, pagarEstado }
