import axios from "axios"
import { toast } from "react-toastify"

export function useFetch() {
  const fetchDataBackend = async (
    url,
    data = null,
    method = "GET",
    headers = {},
    showToast = false   // 👈 NUEVO
  ) => {

    const loadingToast = showToast
      ? toast.loading("Procesando solicitud...")
      : null

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

      if (showToast) {
        toast.dismiss(loadingToast)
        toast.success(response?.data?.message || "Operación exitosa")
      }

      return response.data

    } catch (error) {
      if (showToast) {
        toast.dismiss(loadingToast)
        toast.error(error.response?.data?.message || "Error en la solicitud")
      }
      console.error(error)
      return null
    }
  }

  return fetchDataBackend
}
