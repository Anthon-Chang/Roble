import { useState } from "react";
import modelGif from "../../../public/images/3d-model.gif";
import ThreeViewer from "../model3D/model3DViewer.jsx";


export const Form = () => {
  const [stateAvatar, setStateAvatar] = useState({
    generatedImage: modelGif,
    prompt: "",
    loading: false,
    modelUrl: null, // ⬅️ Nuevo: aquí guardamos el GLB encontrado
  });

  const [selectedOption, setSelectedOption] = useState("ia");

  // 🔎 Función para buscar un modelo 3D por nombre en tu API
  const handleSearchModel = async () => {
    if (!stateAvatar.prompt.trim()) return;

    try {
      setStateAvatar((prev) => ({ ...prev, loading: true }));

      const res = await fetch(
        `https://furniture-api.fly.dev/v1/products?search=${stateAvatar.prompt}`
      );
      const data = await res.json();

      if (!data || data.count === 0) {
        alert("No se encontró ningún modelo con ese nombre.");
        setStateAvatar((prev) => ({ ...prev, loading: false }));
        return;
      }

      // Tomamos el primer resultado
      const model = data.products[0].modelUrl;

      setStateAvatar((prev) => ({
        ...prev,
        loading: false,
        modelUrl: model, //  cargamos el GLB al estado
      }));
    } catch (error) {
      console.error(error);
      alert("Error al buscar el modelo 3D.");
      setStateAvatar((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <form className="space-y-10">

      {/* Información del cliente */}
      <fieldset className="border-2 border-gray-300 dark:border-gray-600 p-6 rounded-lg shadow-md bg-white dark:bg-gray-800">
        <legend className="text-xl font-bold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 px-4 py-1 rounded-md">
          Información del cliente
        </legend>

        <div className="space-y-5 mt-5">
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Cédula</label>
            <div className="flex gap-4">
              <input
                type="number"
                placeholder="Ingresa la cédula"
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button className="py-2 px-6 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-all">
                Consultar
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Nombres completos</label>
            <input
              type="text"
              placeholder="Ingresa nombre y apellido"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Correo electrónico</label>
            <input
              type="email"
              placeholder="Ingresa el correo electrónico"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Celular</label>
            <input
              type="tel"
              placeholder="Ingresa el celular"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </fieldset>

      {/* Información del producto */}
      <fieldset className="border-2 border-gray-300 dark:border-gray-600 p-6 rounded-lg shadow-md bg-white dark:bg-gray-800">
        <legend className="text-xl font-bold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 px-4 py-1 rounded-md">
          Información del producto
        </legend>

        <div className="space-y-5 mt-5">
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Producto</label>
            <input
              type="text"
              placeholder="Ingresa nombre del producto"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Imagen o plano del producto</label>
            <div className="flex gap-6 mb-5">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="imageOption"
                  value="ia"
                  checked={selectedOption === "ia"}
                  onChange={() => setSelectedOption("ia")}
                  className="accent-amber-700"
                />
                Generar modelo 3D
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="imageOption"
                  value="upload"
                  checked={selectedOption === "upload"}
                  onChange={() => setSelectedOption("upload")}
                  className="accent-amber-700"
                />
                Subir Imagen
              </label>
            </div>

           {/* Imagen 3D*/}
{selectedOption === "ia" && (
  <div className="space-y-4">
    <input
      type="text"
      placeholder="Ingresa el prompt"
      value={stateAvatar.prompt}
      onChange={(e) =>
        setStateAvatar((prev) => ({ ...prev, prompt: e.target.value }))
      }
      className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
    />

    <button
      type="button"
      className="w-full py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-all"
      disabled={stateAvatar.loading}
      onClick={async () => {
        setStateAvatar((prev) => ({ ...prev, loading: true }));

        try {
          const API_URL = import.meta.env.VITE_BACKEND_URL;
          const response = await fetch(
            `${API_URL}/api/models/search?name=${encodeURIComponent(
              stateAvatar.prompt
            )}`
          );

          const data = await response.json();

          if (!data.data) {
            alert("No se encontró un modelo con ese nombre");
            setStateAvatar((prev) => ({ ...prev, loading: false }));
            return;
          }

          setStateAvatar((prev) => ({
            ...prev,
            modelUrl: data.data.modelUrl,
            loading: false,
          }));
        } catch (err) {
          console.error("Error al buscar modelo:", err);
          setStateAvatar((prev) => ({ ...prev, loading: false }));
        }
      }}
    >
      {stateAvatar.loading ? "Buscando..." : "Buscar modelo 3D"}
    </button>

    {/* 🔥 RENDERIZAR MODELO 3D */}
    {stateAvatar.modelUrl && (
      <div className="mt-6">
        <ThreeViewer modelUrl={stateAvatar.modelUrl} />
      </div>
    )}
  </div>
)}


            {/* Subir imagen */}
            {selectedOption === "upload" && (
              <input
                type="file"
                accept="image/*"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Tipo</label>
              <select className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="">--- Seleccionar ---</option>
                <option value="muebles para el hogar">Muebles para el hogar</option>
                <option value="muebles para oficina">Muebles para oficina</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Fecha de inicio de contrato</label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Observación</label>
            <textarea
              placeholder="Ingresa observaciones generales"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </fieldset>

      <button
        type="submit"
        className="w-full py-2 bg-gray-800 text-white dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-all font-bold uppercase"
      >
        Registrar
      </button>
    </form>
  );
};

