import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { useFetch } from "../hooks/useFetch"
import { Form } from "../components/create/Form"

const Update = () => {
    const { id } = useParams()
    const [project, setProject] = useState({})
    const fetchDataBackend = useFetch()

    useEffect(() => {
        const searchProject = async () => {
            const url = `${import.meta.env.VITE_BACKEND_URL}/api/proyecto/detalle/${id}`
            const storedUser = JSON.parse(localStorage.getItem("auth-token"))
            const headers = {
                Authorization: `Bearer ${storedUser.state.token}`
            }
            const response = await fetchDataBackend(url, null, "GET", headers)
            setProject(response || {})
        }
        searchProject()
    }, [id])

    return (
        <div>
            <h1 className='font-black text-4xl text-gray-500'>Actualizar</h1>
            <hr className='my-4 border-t-2 border-gray-300' />
            <p className='mb-8'>Este módulo te permite actualizar un registro</p>

            {Object.keys(project).length !== 0 ? (
                <Form project={project} />
            ) : (
                <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">
                    <span className="font-medium">No existen registros</span>
                </div>
            )}
        </div>
    )
}

export default Update
