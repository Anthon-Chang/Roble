/* eslint-disable react/prop-types */
import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import storeTreatments from "../../context/storEstado"
import storeProfile from "../../context/storeProfile"
import {
    useStripe,
    useElements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
} from '@stripe/react-stripe-js'

const IVA = 0.12

// Estilo de los campos de Stripe: no aceptan clases de Tailwind, solo estas opciones propias.
const STRIPE_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: "16px",
            color: "#44403c",
            "::placeholder": { color: "#a8a29e" },
        },
        invalid: { color: "#dc2626" },
    },
}

function ModalPayment({ treatment }) {

    const { toggleModal, payEstado } = storeTreatments()
    const stripe = useStripe()
    const elements = useElements()
    const [loading, setLoading] = useState(false)
    const [cedula, setCedula] = useState("")
    const [errorCedula, setErrorCedula] = useState("")

    // Cédula ya registrada en la cuenta del cliente (selector individual: evita el bug de
    // loop infinito de zustand v5 al usar el store sin selector dentro de un efecto)
    const cedulaPerfil = storeProfile((s) => s.user?.cedulaCliente || s.user?.cedula || "")
    const cedulaAutocompletada = /^\d{10}$/.test(cedulaPerfil)

    // Se autocompleta con la cédula del perfil del cliente; si no coincidiera, el backend
    // la rechaza igual, así que se bloquea la edición para evitar errores de tipeo.
    useEffect(() => {
        if (cedulaAutocompletada) setCedula(cedulaPerfil)
    }, [cedulaPerfil, cedulaAutocompletada])

    // Precio normal, IVA y precio final: deben calcularse igual aquí y en el backend,
    // porque "precioFinal" es lo que realmente se le cobra a la tarjeta.
    const precioNormal = Number(treatment.precio)
    const montoIva = Number((precioNormal * IVA).toFixed(2))
    const precioFinal = Number((precioNormal + montoIva).toFixed(2))

    const cerrar = () => toggleModal("payment")

    const validarCedula = (valor) => {
        if (!valor) return "La cédula es obligatoria"
        if (!/^\d{10}$/.test(valor)) return "La cédula debe tener exactamente 10 dígitos"
        return ""
    }

    const handleCedulaChange = (e) => {
        const valor = e.target.value.replace(/\D/g, "").slice(0, 10)
        setCedula(valor)
        if (errorCedula) setErrorCedula(validarCedula(valor))
    }

    const handlePayment = async (e) => {
        e.preventDefault()

        const errorCedulaActual = validarCedula(cedula)
        if (errorCedulaActual) {
            setErrorCedula(errorCedulaActual)
            return
        }

        if (!stripe || !elements) {
            toast.error("El formulario de pago no cargó. Revisa tu conexión o recarga la página e intenta de nuevo")
            return
        }

        const cardNumberElement = elements.getElement(CardNumberElement)
        if (!cardNumberElement) {
            toast.error("No se pudo leer los datos de la tarjeta")
            return
        }

        setLoading(true)

        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: "card",
            card: cardNumberElement,
        })

        if (error) {
            console.error(error)
            toast.error(error.message)
            setLoading(false)
            return
        }

        const data = {
            paymentMethodId: paymentMethod.id,
            estadoId: treatment._id,
            // Debe coincidir con el total que el backend realmente cobra (precio + 12% IVA),
            // si no, el backend rechaza el pago por "Cantidad incorrecta".
            cantidad: precioFinal,
            cedula,
            motivo: treatment.detalle,
        }

        const url = `${import.meta.env.VITE_BACKEND_URL}/api/estado/pagar`

        await payEstado(url, data)

        setLoading(false)
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onMouseDown={(e) => e.target === e.currentTarget && cerrar()}
        >
            <div className="bg-white rounded-xl shadow-xl overflow-y-auto max-h-[90vh] max-w-lg w-full relative">

                {/* Encabezado */}
                <div className="bg-amber-700 px-6 py-4 rounded-t-xl flex items-center justify-between">
                    <p className="text-white font-bold text-xl">Pagar tratamiento</p>
                    <button
                        type="button"
                        onClick={cerrar}
                        className="text-amber-100 hover:text-white text-xl leading-none"
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handlePayment} className="p-6 space-y-5">

                    {/* Detalle del tratamiento */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Detalle</label>
                        <ul className="text-gray-600 bg-amber-50 border border-amber-100 rounded-md p-3 text-sm space-y-1">
                            <li><span className="font-semibold">Nombre:</span> {treatment.nombre}</li>
                            <li><span className="font-semibold">Descripción:</span> {treatment.detalle}</li>
                            <li><span className="font-semibold">Prioridad:</span> {treatment.prioridad}</li>
                        </ul>
                    </div>

                    {/* Desglose del precio */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Resumen del pago</label>
                        <div className="bg-amber-50 border border-amber-100 rounded-md p-3 text-sm divide-y divide-amber-100">
                            <div className="flex justify-between py-1.5">
                                <span className="text-gray-600">Precio normal</span>
                                <span className="text-gray-800 font-medium">${precioNormal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1.5">
                                <span className="text-gray-600">IVA (12%)</span>
                                <span className="text-gray-800 font-medium">${montoIva.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1.5">
                                <span className="text-gray-800 font-bold">Precio final</span>
                                <span className="text-green-700 font-bold">${precioFinal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Cédula del titular */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Cédula del titular de la cuenta
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="10 dígitos"
                            value={cedula}
                            onChange={handleCedulaChange}
                            onBlur={() => setErrorCedula(validarCedula(cedula))}
                            readOnly={cedulaAutocompletada}
                            className={`block w-full rounded-md border py-2 px-3 text-gray-700 ${
                                errorCedula ? "border-red-400" : "border-gray-300"
                            } ${cedulaAutocompletada ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                        />
                        {errorCedula && <p className="text-red-600 text-xs mt-1">{errorCedula}</p>}
                        {cedulaAutocompletada ? (
                            <p className="text-gray-400 text-xs mt-1">
                                Tomada automáticamente de tu perfil. Si es incorrecta, actualízala en tu perfil antes de pagar.
                            </p>
                        ) : (
                            <p className="text-gray-400 text-xs mt-1">
                                Debe coincidir con la cédula registrada en tu cuenta, para confirmar que eres tú quien paga.
                            </p>
                        )}
                    </div>

                    {/* Aviso si el formulario de Stripe aún no cargó: evita que parezca "trabado" sin explicación */}
                    {!stripe && (
                        <p className="text-amber-800 bg-amber-50 border border-amber-300 rounded-md px-3 py-2 text-xs">
                            Cargando el formulario de pago seguro… si los campos de la tarjeta no responden después
                            de unos segundos, recarga la página.
                        </p>
                    )}

                    {/* Datos de la tarjeta, separados en 3 campos para mayor claridad y seguridad */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Número de la tarjeta
                        </label>
                        <div className="p-3 border border-gray-300 rounded-md bg-white">
                            <CardNumberElement options={STRIPE_ELEMENT_OPTIONS} />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Fecha de caducidad
                            </label>
                            <div className="p-3 border border-gray-300 rounded-md bg-white">
                                <CardExpiryElement options={STRIPE_ELEMENT_OPTIONS} />
                            </div>
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Código de seguridad (CVC)
                            </label>
                            <div className="p-3 border border-gray-300 rounded-md bg-white">
                                <CardCvcElement options={STRIPE_ELEMENT_OPTIONS} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center gap-4 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold transition duration-300 disabled:opacity-50"
                        >
                            {loading ? "Procesando..." : `Pagar $${precioFinal.toFixed(2)}`}
                        </button>

                        <button
                            type="button"
                            onClick={cerrar}
                            className="px-6 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition duration-300"
                        >
                            Cancelar
                        </button>
                    </div>

                </form>

            </div>
        </div>
    )
}

export default ModalPayment
    