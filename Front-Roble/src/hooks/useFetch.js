/* import axios from "axios"
import { toast } from "react-toastify"


export function useFetch() {

    const fetchDataBackend = async (url, data=null, method="GET", headers = {}) => 
        {
            const loadingToast = toast.loading("Procesando solicitud...")
            try {
                const options = {
                    method,
                    url,
                    headers: {
                        "Content-Type": "application/json",
                        ...headers,
                    },
                    data
                }
                const response = await axios(options)
                toast.dismiss(loadingToast)
                toast.success(response?.data?.msg)
                return response?.data

            } catch (error) {
                toast.dismiss(loadingToast)
                console.error(error)
                toast.error(error.response?.data?.msg)
            }
    }
    
    return fetchDataBackend
} */
import axios from "axios"
import { toast } from "react-toastify"

export function useFetch() {

    const fetchDataBackend = async (
        url,
        data = null,
        method = "GET",
        headers = {},
        isFormData = false   // 👈 NUEVO
    ) => {
        const loadingToast = toast.loading("Procesando solicitud...")

        try {
            const options = {
                method,
                url,
                headers: {
                    ...headers
                },
                data
            }

            // 👇 SOLO poner application/json si NO es FormData
            if (!isFormData) {
                options.headers["Content-Type"] = "application/json"
            }

            const response = await axios(options)

            toast.dismiss(loadingToast)
            toast.success(response?.data?.msg)
            return response?.data

        } catch (error) {
            toast.dismiss(loadingToast)
            console.error(error)
            toast.error(error.response?.data?.msg || "Error")
            throw error
        }
    }

    return fetchDataBackend
}
