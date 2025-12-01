
export const ViewPlane = () => {
  return (
    <section id="verPlano" className="container mx-auto text-center py-8">
      <h2 className="font-semibold text-3xl mb-8">Planos Disponibles</h2>

      {/* Contenedor de cuadrado + botones */}
      <div className="flex justify-center items-center gap-4">

        {/* Botón Retroceder */}
        <button className="bg-[#f59e0b] text-white rounded-2xl w-32 py-2 hover:bg-amber-700">
          ◀ Retroceder
        </button>

        {/* Cuadrado central */}
        <div className="w-120 h-120 bg-gray-300 flex items-center justify-center rounded-lg shadow-md">
          <span className="text-xl font-semibold text-gray-700">Plano</span>
        </div>

        {/* Botón Avanzar */}
        <button className="bg-[#f59e0b] text-white rounded-2xl w-32 py-2 hover:bg-amber-700">
          Avanzar ▶
        </button>

      </div>
    </section>
  );
};

export default ViewPlane;