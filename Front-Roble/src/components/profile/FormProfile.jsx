import { useEffect } from "react";
import storeProfile from "../../context/storeProfile";
import { useForm } from "react-hook-form";
import { ToastContainer } from "react-toastify";

const FormularioPerfil = () => {
  const { user, updateProfile } = storeProfile();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const updateUser = (dataForm) => {
    const url = `${import.meta.env.VITE_BACKEND_URL}/carpintero/actualizarperfil/${user._id}`;
    updateProfile(url, dataForm);
  };

  useEffect(() => {
    if (user) {
      reset({
        nombre: user?.nombre,
        apellido: user?.apellido,
        direccion: user?.direccion,
        celular: user?.celular,
        email: user?.email,
      });
    }
  }, [user]);

  const inputClass = "block w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-5";

  return (
    <form onSubmit={handleSubmit(updateUser)} className="space-y-4">

      <ToastContainer />

      {/* Nombre */}
      <div>
        <label className="mb-2 block text-sm font-semibold">Nombre</label>
        <input
          type="text"
          placeholder="Ingresa tu nombre"
          className={inputClass}
          {...register("nombre", { required: "El nombre es obligatorio" })}
        />
        {errors.nombre && <p className="text-red-600 dark:text-red-400 text-sm">{errors.nombre.message}</p>}
      </div>

      {/* Apellido */}
      <div>
        <label className="mb-2 block text-sm font-semibold">Apellido</label>
        <input
          type="text"
          placeholder="Ingresa tu apellido"
          className={inputClass}
          {...register("apellido", { required: "El apellido es obligatorio" })}
        />
        {errors.apellido && <p className="text-red-600 dark:text-red-400 text-sm">{errors.apellido.message}</p>}
      </div>

      {/* Dirección */}
      <div>
        <label className="mb-2 block text-sm font-semibold">Dirección</label>
        <input
          type="text"
          placeholder="Ingresa tu dirección"
          className={inputClass}
          {...register("direccion", { required: "La dirección es obligatoria" })}
        />
        {errors.direccion && <p className="text-red-600 dark:text-red-400 text-sm">{errors.direccion.message}</p>}
      </div>

      {/* Celular */}
      <div>
        <label className="mb-2 block text-sm font-semibold">Celular</label>
        <input
          type="text"
          inputMode="tel"
          placeholder="Ingresa tu teléfono"
          className={inputClass}
          {...register("celular", { required: "El celular es obligatorio" })}
        />
        {errors.celular && <p className="text-red-600 dark:text-red-400 text-sm">{errors.celular.message}</p>}
      </div>

      {/* Correo */}
      <div>
        <label className="mb-2 block text-sm font-semibold">Correo electrónico</label>
        <input
          type="email"
          placeholder="Ingresa tu correo"
          className={inputClass}
          {...register("email", { required: "El correo es obligatorio" })}
        />
        {errors.email && <p className="text-red-600 dark:text-red-400 text-sm">{errors.email.message}</p>}
      </div>

      {/* Botón */}
      <input
        type="submit"
        className="w-full py-2 mt-4 bg-[#461901] dark:bg-amber-700 text-white font-bold uppercase rounded-lg hover:bg-amber-800 dark:hover:bg-amber-600 transition-colors cursor-pointer"
        value="Actualizar"
      />
    </form>
  );
};

export default FormularioPerfil;
