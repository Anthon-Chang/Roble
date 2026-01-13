import axios from "axios"
import { toast } from "react-toastify"


export function useFetch() {
  const fetchDataBackend = async (url, data = null, method = "GET", headers = {}) => {
    const loadingToast = toast.loading("Procesando solicitud...")

    try {
      const isFormData = typeof FormData !== "undefined" && data instanceof FormData
      const defaultHeaders = isFormData ? {} : { "Content-Type": "application/json" }

      const response = await axios({
        method,
        url,
        headers: {
          ...defaultHeaders,
          ...headers
        },
        data
      })

      toast.dismiss(loadingToast)

      // 👇 aquí estaba el bug
      toast.success(response?.data?.message || "Operación exitosa")

      return response.data

    } catch (error) {
      toast.dismiss(loadingToast)
      console.error(error)
      toast.error(error.response?.data?.message || "Error en la solicitud")
      return null
    }
  }

  return fetchDataBackend
}
