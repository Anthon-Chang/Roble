import { create } from "zustand"
import axios from "axios"
import { toast } from "react-toastify"

const getAuthHeaders = () => {
    const storedUser = JSON.parse(localStorage.getItem("auth-token"))
    return {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedUser?.state?.token}`,
        },
    }
}


const storeProfile = create((set) => ({
        
    user: null,
    clearUser: () => set({ user: null }),
   profile: async () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("auth-token"))

    //  ESTA LÍNEA ES LA CLAVE
    if (!storedUser?.state?.token) return

    const rol = storedUser.state.rol

    const endpoint =
      rol === "carpintero"
        ? "api/carpintero/perfil"
        : "api/proyecto/perfil"

    const url = `${import.meta.env.VITE_BACKEND_URL}/${endpoint}`
    const respuesta = await axios.get(url, getAuthHeaders())

    console.log(respuesta.data)

    set({
      user: {
        ...respuesta.data,
        rol,
      },
    })

  } catch (error) {
    console.error(error)
  }
},




    updateProfile:async(url, data)=>{
        try {
            const respuesta = await axios.put(url, data, getAuthHeaders())
            set({ user: respuesta.data })
            toast.success("Perfil actualizado correctamente")
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.msg)
        }
    },

    updatePasswordProfile:async(url,data)=>{
        try {
            const respuesta = await axios.put(url, data, getAuthHeaders())
            return respuesta
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.msg)
        }
    }

    })
)

export default storeProfile
