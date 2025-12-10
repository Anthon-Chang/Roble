import { useEffect, useState } from "react";
import { fetchAllFurniture } from "../services/furnitureService";

export const ViewPlane = () => {
  const [furnitureList, setFurnitureList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null); // ⭐ Modal item
  const itemsPerPage = 6;

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

  const filteredList = furnitureList.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredList.slice(startIndex, startIndex + itemsPerPage);

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  return (
    <section id="verPlano" className="container mx-auto py-8">

      {/* Título y buscador */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
        <h2 className="font-semibold text-3xl mb-4 sm:mb-0">Diseños Disponibles</h2>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="p-2 border rounded w-64 focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-white"
          />
          <button className="p-2 bg-amber-500 text-white rounded">
            🔍
          </button>
        </div>
      </div>

      {/* Resultado vacío */}
      {currentItems.length === 0 ? (
        <p className="text-lg text-gray-700">No se encontraron productos</p>
      ) : (
        <>
          {/* Grid imágenes */}
          <div className="flex justify-center gap-6 mb-4 flex-wrap">

            {currentItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col items-center bg-gray-200 dark:bg-[#1e2939] p-4 rounded-lg shadow cursor-pointer"
                onClick={() => setSelectedItem(item)} // ⭐ Abrir modal
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

          {/* Paginación */}
          <div className="flex justify-center gap-2 mt-4 py-9">
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

      {/*  MODAL  */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-[#1e2939] p-6 rounded-lg shadow-xl max-w-lg w-full relative">

            {/* Cerrar */}
            <button
              className="absolute top-2 right-2 text-gray-600 dark:text-gray-300 text-xl"
              onClick={() => setSelectedItem(null)}
            >
              ✖
            </button>

            {/* Imagen grande */}
            <img
              src={selectedItem.image_path}
              alt={selectedItem.name}
              className="w-full h-auto object-contain rounded mb-4"
            />

            {/* Información */}
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {selectedItem.name}
            </h3>

            <p className="text-gray-700 dark:text-gray-300">
              {selectedItem.description || "Este diseño no tiene descripción disponible."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default ViewPlane;
