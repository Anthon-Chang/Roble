import { toast } from "react-toastify"
import { create } from "zustand"
import axios from "axios"

/* ============================
   HEADERS CON JWT
============================ */
const getAuthHeaders = () => {
    const storedUser = JSON.parse(localStorage.getItem("auth-token"))

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storedUser?.state?.token}`,
    }
}

/* ============================
   STORE
============================ */
const storEstado = create((set) => ({
    modal: false,

    toggleModal: (modalType) =>
        set((state) => ({
            modal: state.modal === modalType ? null : modalType
        })),

    registerTreatments: async (url, data) => {
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(data),
            })

            const result = await response.json()

            // ❌ error del backend
            if (!response.ok) {
                throw new Error(result.msg || "Error al registrar estado")
            }

            set((state) => ({ modal: !state.modal }))
            toast.success(result.msg)

        } catch (error) {
            console.error(error)
            toast.error(error.message || "Error inesperado")
        }
    },
        deletEstado:async(url)=>{
        const isConfirmed  = confirm("Vas a eliminar el tratamiento ¿Estás seguro de realizar esta acción?")
        if (isConfirmed ) {
            try {
                const respuesta = await axios.delete(url, {
                    headers: getAuthHeaders()
                })
                toast.success(respuesta.data.msg)
            } catch (error) {
                console.error(error)
            }
        }
    },
    payEstado: async (url, data) => {
    try {
        const respuesta = await axios.post(url, data, {
            headers: getAuthHeaders()
        })

        set((state) => ({ modal: false }))
        toast.success(respuesta.data.msg)

    } catch (error) {
        console.error(error.response?.data || error)
        toast.error(error.response?.data?.msg || "Error al procesar el pago")
    }
}

}))

export default storEstado
