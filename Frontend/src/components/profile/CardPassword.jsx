import { useForm } from "react-hook-form";
import storeProfile from "../../context/storeProfile";
import storeAuth from "../../context/storeAuth";
import { reglaPasswordNueva, reglaPasswordLogin } from "../../helpers/validaciones"

// El administrador no tiene endpoint de cambio de contraseña; este componente solo
// se monta para carpintero y cliente (ver Profile.jsx).
const URL_POR_ROL = {
  carpintero: (id) => `api/carpintero/actualizarpassword/${id}`,
  cliente: () => `api/cliente/actualizarpassword`,
}

const CardPassword = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const { user, updatePasswordProfile } = storeProfile();
  const { clearToken, rol } = storeAuth();

  const updatePassword = async (dataForm) => {
    const ruta = (URL_POR_ROL[rol] || URL_POR_ROL.carpintero)(user._id);
    const url = `${import.meta.env.VITE_BACKEND_URL}/${ruta}`;
    const response = await updatePasswordProfile(url, dataForm);
    if (response) clearToken();
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto mt-10">
      
      <h1 className='font-black text-2xl text-gray-700 dark:text-gray-200 mb-3'>Actualizar contraseña</h1>
      <hr className='my-4 border-t-2 border-gray-300 dark:border-gray-600' />

      <form onSubmit={handleSubmit(updatePassword)} className="space-y-4">

        {/* Contraseña actual */}
        <div>
          <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Contraseña actual
          </label>
          <input
            type="password"
            placeholder="Ingresa tu contraseña actual"
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            {...register("passwordactual", reglaPasswordLogin)}
          />
          {errors.passwordactual && <p className="text-red-600 mt-1">{errors.passwordactual.message}</p>}
        </div>

        {/* Nueva contraseña */}
        <div>
          <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Nueva contraseña
          </label>
          <input
            type="password"
            placeholder="Ingresa la nueva contraseña"
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            {...register("passwordnuevo", {...reglaPasswordNueva,
            validate: {...reglaPasswordNueva.validate,
            distinta: (v) => v !== watch("passwordactual") || "La nueva contraseña debe ser diferente a la actual",
            },
          })}
          />
          {errors.passwordnuevo && <p className="text-red-600 mt-1">{errors.passwordnuevo.message}</p>}
        </div>

        {/* Botón */}
        <button
          type="submit"
          className="w-full bg-[#461901] hover:bg-amber-600 text-white py-2 rounded-md font-semibold transition-colors"
        >
          Cambiar contraseña
        </button>

      </form>
    </div>
  );
};

export default CardPassword;
