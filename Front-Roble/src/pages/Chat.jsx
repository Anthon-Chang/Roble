import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { io } from 'socket.io-client'
import { toast, ToastContainer } from "react-toastify"

const Chat = () => {

    const [responses, setResponses] = useState([])
    const [socket, setSocket] = useState(null)
    const [chat, setChat] = useState(true)
    const [nameUser, setNameUser] = useState("")
    const { register, handleSubmit, formState: { errors }, reset } = useForm()



    const handleEnterChat = (data) => {
        setNameUser(data.name)
        setChat(false)
    }

    const handleMessageChat = (data) => {

        if (!socket || !socket.connected) return toast.error("No hay conexión con el servidor")

        const newMessage = {
            body: data.message,
            from: nameUser,
        }
        socket.emit("enviar-mensaje-front-back", newMessage)
        setResponses((prev) => [...prev, newMessage])
        reset({ message: "" })
    }

    useEffect(() => {
        const newSocket = io("http://localhost:4000")
        setSocket(newSocket)
        newSocket.on("enviar-mensaje-front-back", (payload) => {
            console.log(payload)
            setResponses((prev) => [...prev, payload])
        })
        return () => newSocket.disconnect()
    }, [])


    return (

        <>
            <ToastContainer />

            {
                chat
                    ? 
                    (
                        <div>

                            <form onSubmit={handleSubmit(handleEnterChat)} className="flex justify-center gap-5">

                                <input
                                    type="text"
                                    placeholder="Ingresa tu nombre de usuario"
                                    className="block w-1/2 rounded-md border border-gray-300 py-1 px-2 text-gray-500"
                                    {...register("name", { required: "El nombre de usuario es obligatorio" })}
                                />

                                <button className="py-2 w-1/2 block text-center bg-gray-500 text-slate-300 
                                border rounded-xl hover:scale-100 duration-300
                                hover:bg-gray-900 hover:text-white">Ingresar al chat</button>

                            </form>

                            {errors.name && <p className="text-red-800">{errors.name.message}</p>}
                        </div>
                    )
                    : 
                    (
                        <div className="flex flex-col justify-center h-full ">

                            <div className="flex flex-col space-y-4 p-3 overflow-y-auto scrollbar-thumb-blue 
                            scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch">

                                {
                                    responses.map((response, index) => (

                                        <div key={index} 
                                        className={`my-2 p-4 text-sm rounded-md text-white  ${response.from === nameUser ? 'bg-slate-700' : 'bg-black ml-auto'}`}>
                                            {response.from} - {response.body}
                                        </div>
                                    ))
                                }
                            </div>


                            <div className="border-t-2 border-gray-200 px-4 pt-4 mb-2 sm:mb-0">
                                
                                <form onSubmit={handleSubmit(handleMessageChat)}>
                                    
                                    <div className="relative flex gap-4">
                                        
                                        <input type="text" placeholder="Escribe tu mensaje!" 
                                        className="w-full focus:outline-none focus:placeholder-gray-400
                                        text-gray-600 placeholder-gray-600 pl-2 bg-gray-200 rounded-md py-3"
                                        {...register("message", { required: "El mensaje es obligatorio" })} />

                                        <button className="py-1 px-8 bg-green-700 text-slate-300 border rounded-xl 
                                        duration-300  hover:text-white sm:w-40" >
                                            Enviar
                                        </button>

                                    </div>
                                    {errors.message && <p className="text-red-800">{errors.message.message}</p>}
                                </form>
                            </div>
                        </div>

                    )
            }
        </>
    )
}

export default Chat