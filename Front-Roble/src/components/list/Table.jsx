import { MdDeleteForever, MdInfo, MdPublishedWithChanges } from "react-icons/md";
import { useFetch } from "../../hooks/useFetch";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router';
import { ToastContainer } from "react-toastify";

const Table = () => {

  const deleteCliente = async(id) => {
        const confirmDelete = confirm("Vas registrar la salida del paciente, ¿Estás seguro?")
        if(confirmDelete){
            const url = `${import.meta.env.VITE_BACKEND_URL}/api/proyecto/eliminar/${id}`
            const storedUser = JSON.parse(localStorage.getItem("auth-token"))
            const options = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${storedUser.state.token}`,
                }
            }
            const data ={
                salidaMascota:new Date().toString()
            }
            await fetchDataBackend(url, data, "DELETE", options.headers)
            setPatients((prevPatients) => prevPatients.filter(patient => patient._id !== id))
        }
    }

  const navigate = useNavigate()
  const fetchDataBackend = useFetch();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true); // Para manejar estado de carga
  const [error, setError] = useState(null); // Para manejar errores

  const listclientes = async () => { 
    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/proyecto/listar`;
      const storedUser = JSON.parse(localStorage.getItem("auth-token"));

      if (!storedUser?.state?.token) {
        setError("Token no encontrado. Inicia sesión nuevamente.");
        setLoading(false);
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storedUser.state.token}`,
      };

      const response = await fetchDataBackend(url, null, "GET", headers);

      if (!response || !Array.isArray(response)) {
        setError("No se pudo obtener la lista de clientes.");
        setPatients([]);
      } else {
        setPatients(response);
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al cargar los clientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    listclientes();
  }, []);

  if (loading) {
    return (
      <div className="p-4 mb-4 text-sm text-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-gray-300">
        Cargando clientes...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
        <span className="font-medium">{error}</span>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
        <span className="font-medium">No existen registros</span>
      </div>
    );
  }

  return (
    <table className="w-full mt-5 table-auto shadow-lg bg-white">
      <ToastContainer/>
      {/* Encabezado */}
      <thead className="bg-gray-800 text-slate-400">
        <tr>
          {["N°", "Producto", "Nombre del cliente", "Email", "Celular", "Precio", "Fecha de entrega","Estado","Acciones"].map((header) => (
            <th key={header} className="p-2">
              {header}
            </th>
          ))}
        </tr>
      </thead>

      {/* Cuerpo de la tabla */}
      <tbody>
        {patients.map((cliente, index) => (
          <tr className="hover:bg-gray-300 text-center" key={cliente._id}>
              <td>{index + 1}</td>
              <td className="px-2 py-1 text-left">{cliente.nombreProyecto}</td>
              <td className="px-2 py-1">{cliente.nombreCliente}</td>
              <td className="px-2 py-1">{cliente.emailCliente}</td>
              <td className="px-2 py-1">{cliente.celularCliente}</td>
              <td className="px-2 py-1">{cliente.precioProyecto ?? 0}</td>
              <td className="px-2 py-1">{cliente.fechaEntrega ? new Date(cliente.fechaEntrega).toLocaleDateString() : "-"}</td>
              <td>
                <span
                  className={`text-xs font-medium mr-2 px-2.5 py-0.5 rounded ${
                    cliente.estadoProyecto
                      ? "bg-blue-100 text-green-500 dark:bg-blue-900 dark:text-blue-300"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {cliente.estadoProyecto ? "Activo" : "Inactivo"}
                </span>
              </td>
            <td className="py-2 text-center">
              <MdPublishedWithChanges
                title="Actualizar"
                className="h-7 w-7 text-slate-800 cursor-pointer inline-block mr-2 hover:text-blue-600"
              />
              <MdInfo
                title="Más información"
                className="h-7 w-7 text-slate-800 cursor-pointer inline-block mr-2 hover:text-green-600"
                onClick={() => navigate(`/dashboard/details/${cliente._id}`)}
              />
              <MdDeleteForever
                title="Eliminar"
                className="h-7 w-7 text-red-900 cursor-pointer inline-block hover:text-red-600"
                onClick={()=>{deleteCliente(cliente._id)}}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;
