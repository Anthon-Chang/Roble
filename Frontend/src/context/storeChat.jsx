import { create } from "zustand"
import { persist } from "zustand/middleware"

// Guarda el chat en localStorage (solo en este navegador): no hay backend que
// persista los mensajes, así que esto es lo único que sobrevive a recargar la página.
// mensajes: { [proyectoId]: [{ body, from, rol, fecha, propio }] }
// noLeidos: { [proyectoId]: number }
const storeChat = create(
  persist(
    (set, get) => ({
      mensajes: {},
      noLeidos: {},

      agregarMensaje: (proyectoId, mensaje) =>
        set((state) => ({
          mensajes: {
            ...state.mensajes,
            [proyectoId]: [...(state.mensajes[proyectoId] || []), mensaje],
          },
        })),

      marcarNoLeido: (proyectoId) =>
        set((state) => ({
          noLeidos: { ...state.noLeidos, [proyectoId]: (state.noLeidos[proyectoId] || 0) + 1 },
        })),

      marcarLeido: (proyectoId) =>
        set((state) => ({ noLeidos: { ...state.noLeidos, [proyectoId]: 0 } })),

      totalNoLeidos: () => Object.values(get().noLeidos).reduce((a, b) => a + b, 0),
    }),
    { name: "chat-mensajes" }
  )
)

export default storeChat
    