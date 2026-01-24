import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { io } from "socket.io-client"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const emojis = ["😀", "😂", "😍", "😎", "😭", "🔥", "👍", "❤️"]

const Chat = () => {
  const [responses, setResponses] = useState([])
  const [socket, setSocket] = useState(null)
  const [chat, setChat] = useState(true)
  const [nameUser, setNameUser] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm()

  /* ------------------ ENTRAR AL CHAT ------------------ */
  const handleEnterChat = (data) => {
    setNameUser(data.name)
    setChat(false)
  }

  /* ------------------ ENVIAR MENSAJE ------------------ */
  const handleMessageChat = (data) => {
    if (!socket || !socket.connected) {
      return toast.error("❌ No hay conexión con el servidor")
    }

    const newMessage = {
      body: data.message,
      from: nameUser,
    }

    socket.emit("enviar-mensaje-front-back", newMessage)
    setResponses((prev) => [...prev, newMessage])
    reset({ message: "" })
  }

  /* ------------------ SOCKET ------------------ */
  useEffect(() => {
    const newSocket = io("http://localhost:4000", {
      transports: ["websocket"],
    })

    setSocket(newSocket)

    newSocket.on("connect", () => setIsConnected(true))
    newSocket.on("disconnect", () => setIsConnected(false))

    newSocket.on("enviar-mensaje-front-back", (payload) => {
      setResponses((prev) => [...prev, payload])
    })

    return () => newSocket.disconnect()
  }, [])

  /* ------------------ UI ------------------ */
  return (
    <>
      <ToastContainer />

      {chat ? (
        /* ---------- LOGIN ---------- */
        <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
          <form
            onSubmit={handleSubmit(handleEnterChat)}
            className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md space-y-4"
          >
            <h2 className="text-2xl font-bold text-center text-[#461901]">
              💬 Chat en vivo
            </h2>

            <input
              type="text"
              placeholder="Tu nombre de usuario"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
              {...register("name", { required: "El nombre es obligatorio" })}
            />

            {errors.name && (
              <p className="text-red-600 text-sm">{errors.name.message}</p>
            )}

            <button
              className="
                w-full
                bg-[#f59e0b]
                text-white
                py-2
                rounded-md
                hover:bg-[#461901]
                transition
              "
            >
              Entrar al chat
            </button>
          </form>
        </div>
      ) : (
        /* ---------- CHAT ---------- */
        <div
          className="
            flex flex-col
            h-[90vh] md:h-[85vh] lg:h-[80vh]
            w-full
            max-w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl
            mx-auto
            bg-white
            shadow-xl
            rounded-xl
            overflow-hidden
          "
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#f59e0b] text-white">
            <p className="font-semibold">💬 Chat en vivo</p>

            <span className="flex items-center gap-2 text-sm">
              <span
                className={`h-3 w-3 rounded-full ${
                  isConnected ? "bg-green-400" : "bg-red-500"
                }`}
              ></span>
              {isConnected ? "Conectado" : "Desconectado"}
            </span>
          </div>

          {/* MENSAJES */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-100">
            {responses.map((response, index) => (
              <div
                key={index}
                className={`max-w-[85%] md:max-w-[70%] px-4 py-2 rounded-xl text-sm break-words ${
                  response.from === nameUser
                    ? "bg-[#f59e0b] text-white ml-auto rounded-br-none"
                    : "bg-gray-300 text-gray-900 mr-auto rounded-bl-none"
                }`}
              >
                <p className="text-xs opacity-70 mb-1">{response.from}</p>
                {response.body}
              </div>
            ))}
          </div>

          {/* INPUT */}
          <div className="border-t p-4 relative bg-white">
            {/* EMOJIS */}
            {showEmojis && (
              <div className="absolute bottom-20 left-4 bg-white shadow-lg rounded-lg p-2 flex gap-2 flex-wrap w-40 md:w-52 z-10">
                {emojis.map((emoji, i) => (
                  <button
                    key={i}
                    type="button"
                    className="text-xl hover:scale-125 transition"
                    onClick={() => {
                      setValue(
                        "message",
                        `${watch("message") || ""}${emoji}`
                      )
                      setShowEmojis(false)
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSubmit(handleMessageChat)}
              className="flex items-center gap-3"
            >
              <button
                type="button"
                onClick={() => setShowEmojis(!showEmojis)}
                className="text-2xl hover:scale-110 transition"
              >
                😊
              </button>

              <input
                type="text"
                placeholder="Escribe tu mensaje..."
                className="
                  flex-1
                  px-4 py-2
                  rounded-full
                  bg-gray-200
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#f59e0b]
                "
                {...register("message", {
                  required: "El mensaje es obligatorio",
                })}
              />

              <button
                className="
                  bg-[#f59e0b]
                  text-white
                  px-6 py-2
                  rounded-full
                  hover:bg-[#461901]
                  transition
                "
              >
                Enviar
              </button>
            </form>

            {errors.message && (
              <p className="text-red-600 text-sm mt-1">
                {errors.message.message}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default Chat
