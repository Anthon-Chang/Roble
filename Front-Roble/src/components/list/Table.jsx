import { MdDeleteForever, MdInfo, MdPublishedWithChanges } from "react-icons/md";

const Table = () => {

  return (
    <div className="overflow-x-auto mt-5 shadow-lg rounded-lg">
      <table className="w-full table-auto bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">
        
        {/* Encabezado */}
        <thead className="bg-gray-800 text-slate-200 dark:bg-gray-700">
          <tr>
            {["N°", "Producto", "Nombre Cliente", "Email", "Celular", "Estado", "Acciones"].map((header) => (
              <th key={header} className="p-3 text-left text-sm font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Cuerpo de la tabla */}
        <tbody>
          <tr className="hover:bg-gray-100 dark:hover:bg-gray-600 text-center">
            <td className="p-2">1</td>
            <td className="p-2">--</td>
            <td className="p-2">--</td>
            <td className="p-2">--</td>
            <td className="p-2">--</td>
            <td className="p-2">--</td>

            {/* Columna de acciones */}
            <td className="py-2 flex justify-center gap-2">
              <MdInfo 
                title="Más información" 
                className="h-7 w-7 cursor-pointer text-amber-700 hover:text-green-600 transition-colors"
              />
              <MdPublishedWithChanges 
                title="Actualizar" 
                className="h-7 w-7 cursor-pointer text-amber-700 hover:text-blue-600 transition-colors"
              />
              <MdDeleteForever 
                title="Eliminar" 
                className="h-7 w-7 cursor-pointer text-red-700 hover:text-red-600 transition-colors"
              />
            </td>
          </tr>

          {/* Puedes mapear tus datos aquí para más filas */}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
