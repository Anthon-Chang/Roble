import { ToastContainer } from 'react-toastify'
import { MdDeleteForever, MdAttachMoney } from "react-icons/md"
import storeAuth from "../../context/storeAuth"
import ModalPayment from "./ModalPayment"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { useState } from "react"
const stripePromise = loadStripe(import.meta.env.VITE_STRAPI_KEY)
import storEstado from "../../context/storEstado"

const TableTreatments = ({ treatments, onDelete }) => {

    const { rol } = storeAuth()
    const { modal,toggleModal } = storEstado()
    const [selectedTreatment,setSelectedTreatment] = useState(null)

    return (
        <>
            <ToastContainer/>
        <table className='w-full mt-5 table-auto shadow-lg bg-white'>
            <thead className='bg-gray-800 text-slate-400'>
                <tr>
                    <th className='p-2'>N°</th>
                    <th className='p-2'>Nombre</th>
                    <th className='p-2'>Detalle</th>
                    <th className='p-2'>Prioridad</th>
                    <th className='p-2'>Precio</th>
                    <th className='p-2'>Estado pago</th>
                    <th className='p-2'>Acciones</th>
                </tr>
            </thead>

            <tbody>
                {treatments.map((treatment, index) => (
                    <tr
                        key={treatment._id}
                        className="hover:bg-gray-300 text-center"
                    >
                        <td>{index + 1}</td>
                        <td>{treatment.nombre}</td>
                        <td>{treatment.detalle}</td>
                        <td>{treatment.prioridad}</td>
                        <td>$ {treatment.precio}</td>
                        <td
                            className={
                                treatment.estadoPago === "Pagado"
                                    ? "text-green-500 text-sm"
                                    : "text-red-500 text-sm"
                            }
                        >
                            {treatment.estadoPago}
                        </td>

                        <td className='py-2 text-center'>
                            {rol === "cliente" && (
                                    <MdAttachMoney
                                        className={
                                            treatment.estadoPago === "Pagado"
                                            ? "h-7 w-7 text-gray-500 pointer-events-none inline-block mr-2"
                                            : "h-7 w-7 text-slate-800 cursor-pointer inline-block mr-2 hover:text-green-600"
                                        }
                                        title="Pagar"
                                        onClick={() => {
                                            setSelectedTreatment(treatment)
                                            toggleModal("payment")
                                        }}
                                    />
                                )}
                            {rol !== "cliente" && onDelete && (
                                <MdDeleteForever
                                    className={
                                    treatment.estadoPago === "Pagado"
                                        ? "h-8 w-8 text-gray-500 opacity-50 inline-block cursor-pointer hover:text-red-600 transition-colors duration-200"
                                        : "h-8 w-8 text-red-900 cursor-pointer inline-block hover:text-red-600"
                                    }
                                    title="Eliminar"
                                    onClick={() => onDelete(treatment._id)}
                                />
                                )}

                            
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {modal === "payment" && selectedTreatment && (
                <Elements stripe={stripePromise}>
                    <ModalPayment treatment={selectedTreatment} />
                </Elements>
            )}
        
        </>
    )
}

export default TableTreatments
