import { useEffect, useState } from "react";
import { fetchAllFurniture } from "../services/furnitureService";

export const ViewPlane = () => {
  const [furnitureList, setFurnitureList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4  ; // solo 2 imágenes por página

  useEffect(() => {
    async function loadFurniture() {
      try {
        const products = await fetchAllFurniture();
        setFurnitureList(products);
      } catch (error) {
        console.error("Error cargando productos:", error);
      }
    }
    loadFurniture();
  }, []);

  // Filtrar según el buscador
  const filteredList = furnitureList.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular paginación
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredList.slice(startIndex, startIndex + itemsPerPage);

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  return (
    <section id="verPlano" className="container mx-auto py-8">
      {/* Contenedor flex para título y buscador */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
  <h2 className="font-semibold text-3xl mb-4 sm:mb-0">Diseños Disponibles</h2>

  <div className="flex items-center space-x-2">
    <input
      type="text"
      placeholder="Buscar producto..."
      value={searchTerm}
      onChange={(e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // reiniciar página al buscar
      }}
      className="p-2 border rounded w-64 focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-white"
    />
    <button
      onClick={() => {
        console.log("Buscar:", searchTerm);
        // Aquí puedes agregar la función de búsqueda
      }}
      className="p-2 bg-amber-500 text-white rounded"
    >
      🔍
    </button>
  </div>
</div>


      {currentItems.length === 0 ? (
        <p className="text-lg text-gray-700">No se encontraron productos</p>
      ) : (
        <>
          {/* Mostrar las imágenes actuales */}
          <div className="flex justify-center gap-40 mb-4 flex-wrap">
            {currentItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col items-center bg-gray-200 dark:bg-[#1e2939] p-4 rounded-lg shadow"
              >
                <img
                  src={item.image_path}
                  alt={item.name}
                  className="w-110 h-110 object-contain mb-2 rounded"
                />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center">
                  {item.name}
                </p>
              </div>
            ))}
          </div>

          {/* Botones de paginación */}
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageClick(index + 1)}
                className={`px-4 py-1 rounded ${
                  currentPage === index + 1
                    ? "bg-amber-500 text-white"
                    : "bg-gray-300 text-gray-800 hover:bg-amber-300"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default ViewPlane;
