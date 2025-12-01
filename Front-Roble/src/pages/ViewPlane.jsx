import { useEffect, useState } from "react";
import { fetchAllFurniture } from "../services/furnitureService";

export const ViewPlane = () => {
  const [furnitureList, setFurnitureList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const handleNext = () =>
    setCurrentIndex((prev) =>
      prev + 1 < furnitureList.length ? prev + 1 : 0
    );

  const handlePrev = () =>
    setCurrentIndex((prev) =>
      prev - 1 >= 0 ? prev - 1 : furnitureList.length - 1
    );

  const current = furnitureList[currentIndex];

  return (
    <section id="verPlano" className="container mx-auto text-center py-8">
      <h2 className="font-semibold text-3xl mb-8">Planos Disponibles</h2>

      <div className="flex justify-center items-center gap-4">

        {/* Retroceder */}
        <button
          onClick={handlePrev}
          className="bg-[#f59e0b] text-white rounded-2xl w-32 py-2 hover:bg-amber-700"
        >
          ◀ Retroceder
        </button>

        {/* CUADRO CENTRAL */}
<div className="w-[500px] h-[600px] bg-gray-200 dark:bg-[#1e2939] flex flex-col items-center justify-center rounded-lg shadow-md p-4">
  {current ? (
    <>
      <img
        src={current.image_path}
        alt={current.name}
        className="max-w-full max-h-[700px] object-contain rounded-lg"
      />

      {/* NOMBRE DEL PRODUCTO */}
      <p className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
        {current.name}
      </p>
    </>
  ) : (
    <span className="text-xl font-semibold text-gray-700">
      Cargando...
    </span>
  )}
</div>


        {/* Avanzar */}
        <button
          onClick={handleNext}
          className="bg-[#f59e0b] text-white rounded-2xl w-32 py-2 hover:bg-amber-700"
        >
          Avanzar ▶
        </button>

      </div>
    </section>
  );
};

export default ViewPlane;
