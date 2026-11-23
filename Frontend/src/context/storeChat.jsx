import { create } from "zustand"
import { persist } from "zustand/middleware"
import { resumenChats } from "../services/mensajeService"

// Los mensajes ya se guardan en el backend (colección "mensajes" en Firestore, ver
// backend/src/models/Mensaje.js); este store solo cachea el resumen (último mensaje por
// proyecto) para pintar la lista de "Mensajes" y su badge de notificación, y recuerda en
// este navegador hasta qué fecha leyó cada chat el usuario (lastRead), que es lo único
// que no tiene sentido guardar en el servidor.
const storeChat = create(
  persist(
    (set, get) => ({
      resumen: [], // [{ proyecto, nombreProyecto, otraParte: {nombre}, ultimoMensaje: {body,remitente,rol,fecha}|null }]
      lastRead: {}, // { [proyectoId]: isoString }

      cargarResumen: async () => {
        try {
          const resumen = await resumenChats()
          set({ resumen })
        } catch (error) {
          console.error(error)
        }
      },

      marcarLeido: (proyectoId) =>
        set((state) => ({ lastRead: { ...state.lastRead, [proyectoId]: new Date().toISOString() } })),

      // No leído: hay un último mensaje, no lo escribió el propio usuario, y es más nuevo
      // que la última vez que abrió ese chat.
      noLeido: (item, miId) => {
        if (!item.ultimoMensaje || item.ultimoMensaje.remitente === miId) return false
        const leido = get().lastRead[item.proyecto]
        return !leido || new Date(item.ultimoMensaje.fecha) > new Date(leido)
      },

      totalNoLeidos: (miId) => get().resumen.filter((item) => get().noLeido(item, miId)).length,
    }),
    { name: "chat-lectura", partialize: (state) => ({ lastRead: state.lastRead }) }
  )
)

export default storeChat
