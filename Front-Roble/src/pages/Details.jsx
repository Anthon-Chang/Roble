import { useEffect, useState } from "react"
import TableTreatments from "../components/treatments/Table"
import ModalTreatments from "../components/treatments/Modal"
import { useParams } from "react-router"
import {useFetch} from "../hooks/useFetch"
import storeAuth from "../context/storeAuth"
import storEstado from "../context/storEstado"
import { ToastContainer} from 'react-toastify'

const Details = () => {
    const { rol } = storeAuth()
    const { id } = useParams()
    const [proyecto, setProyecto] = useState({})
    const  fetchDataBackend  = useFetch()
    const [treatments, setTreatments] = useState([])
    const { modal, toggleModal, deletEstado } = storEstado()
    

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('es-EC', { dateStyle: 'long', timeZone: 'UTC' })
    }

    const handleDeleteEstado = async (estadoId) => {
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/estado/eliminar/${estadoId}`
        await deletEstado(url)

        const reloadUrl = `${import.meta.env.VITE_BACKEND_URL}/api/proyecto/detalle/${id}`
        const storedUser = JSON.parse(localStorage.getItem("auth-token"))

        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedUser.state.token}`
        }

        const response = await fetchDataBackend(reloadUrl, null, "GET", headers)
        setProyecto(response)
        setTreatments(response.estados || [])
    }

    useEffect(() => {
        const listProyecto = async () => {
            const url = `${import.meta.env.VITE_BACKEND_URL}/api/proyecto/detalle/${id}`
            const storedUser = JSON.parse(localStorage.getItem("auth-token"))
            const headers= {
                "Content-Type": "application/json",
                Authorization: `Bearer ${storedUser.state.token}`
            }
            const response = await fetchDataBackend(url, null, "GET", headers)
            setProyecto(response)
            setTreatments(response.estados || [])
        }
        if(modal===false){
            listProyecto()
        }  
        
    }, [modal])



    return (
        <>
         <ToastContainer/>
            <div>
                <h1 className='font-black text-4xl text-gray-500'>Visualizar</h1>
                <hr className='my-4 border-t-2 border-gray-300' />
                <p className='mb-8'>Este módulo te permite visualizar todos los datos</p>
            </div>


            <div>
                <div className='m-5 flex justify-between'>

                    <div>


                        <ul className="list-disc pl-5">

                            <li className="text-md text-gray-00 mt-4 font-bold text-xl">Datos del cliente</li>


                            {/* Datos del cliente */}
                            <ul className="pl-5">

                                <li className="text-md mt-2">
                                    <span className="text-gray-600 font-bold">Cédula: {proyecto?.cedulaCliente}</span>
                                </li>

                                <li className="text-md mt-2">
                                    <span className="text-gray-600 font-bold">Nombres completos: {proyecto?.nombreCliente}</span>
                                </li>

                                <li className="text-md mt-2">
                                    <span className="text-gray-600 font-bold">Correo electrónico: {proyecto?.emailCliente}</span>
                                </li>

                                <li className="text-md mt-2">
                                <span className="text-gray-600 font-bold">Celular: {proyecto?.celularCliente}</span>
                                </li>

                            </ul>



                            <li className="text-md text-gray-00 mt-4 font-bold text-xl">Datos del proyecto</li>


                            {/* Datos del proyecto */}
                            <ul className="pl-5">

                                <li className="text-md mt-2">
                                    <span className="text-gray-600 font-bold">Nombre del proyecto: {proyecto?.nombreProyecto}</span>
                                </li>

                                <li className="text-md mt-2">
                                    <span className="text-gray-600 font-bold">Descripción: {proyecto?.descripcionProyecto}</span>
                                </li>

                                <li className="text-md mt-2">
                                    <span className="text-gray-600 font-bold">Fecha de entrega: {proyecto?.fechaEntrega ? formatDate(proyecto.fechaEntrega) : '-'}</span>
                                </li>

                                <li className="text-md mt-2">
                                    <span className="text-gray-600 font-bold">Estado: </span>
                                    <span className="bg-blue-100 text-green-500 text-xs font-medium 
                                        mr-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                                    {proyecto?.estadoProyecto ? "Activo" : "Inactivo"}
                                    </span>
                                </li>

                                <li className="text-md text-gray-00 mt-4">
                                    <span className="text-gray-600 font-bold">Precio: {proyecto?.precioProyecto ?? 0}</span>
                                </li>
                            </ul>

                        </ul>

                    </div>
                    
                    
                    {/* Imagen lateral */}
                    <div>
                        {/* <pre>{JSON.stringify(proyecto, null, 2)}</pre> */}
                        <img src={proyecto?.imagenProyectoIA || proyecto?.imagenProyecto || proyecto?.imagen} alt="proyecto" className='h-80 w-80 rounded-full'/>
                    </div>
                </div>


                <hr className='my-4 border-t-2 border-gray-300' />


                {/* Sección de tratamientos */}
                <div className='flex justify-between items-center'>


                    {/* Apertura del modal tratamientos */}
                    <p>Este módulo te permite gestionar tratamientos</p>
                    {rol !== "cliente" && (
                        <button className="px-5 py-2 bg-green-800 text-white rounded-lg hover:bg-green-700" onClick={()=>{toggleModal("treatments")}}>
                            Registrar
                        </button>
                    )}


                    {/* - {modal === "treatments" && (<ModalTreatments patientID={proyecto._id}/>)} */}
                    {/* +{modal === "treatments" && (<ModalTreatments proyectoID={proyecto._id} />)} */}
                    {modal === "treatments" && proyecto?._id && (
                        <ModalTreatments proyectoID={proyecto._id} />
                    )}


                </div>
                

                {/* Mostrar los tratamientos */}
                {
                    treatments.length == 0
                        ?
                        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                            <span className="font-medium">No existen registros</span>
                        </div>
                        :
                        <TableTreatments treatments={treatments} onDelete={handleDeleteEstado}/>
                }
                
            </div>
        </>

    )
}

export default Details 