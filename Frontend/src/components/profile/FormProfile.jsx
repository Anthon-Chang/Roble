import { useEffect } from "react";
import storeProfile from "../../context/storeProfile";
import storeAuth from "../../context/storeAuth";
import { useForm } from "react-hook-form";
import { ToastContainer } from "react-toastify";
import {
  reglaEmail, reglaNombre, reglaCelular, reglaTextoCorto, soloDigitos,
} from "../../helpers/validaciones"

// Cada rol edita su perfil en un endpoint distinto y con un subconjunto distinto de campos (HU-020).
const CONFIG_POR_ROL = {
  administrador: { urlBase: "api/admin/actualizarperfil", conId: false, apellido: false, direccion: false },
  cliente: { urlBase: "api/cliente/actualizarperfil", conId: false, apellido: true, direccion: false },
  carpintero: { urlBase: "api/carpintero/actualizarperfil", conId: true, apellido: true, direccion: true },
}

const FormularioPerfil = () => {
  const { user, updateProfile } = storeProfile();
  const rol = storeAuth((s) => s.rol);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const config = CONFIG_POR_ROL[rol] || CONFIG_POR_ROL.cliente

  const updateUser = (dataForm) => {
    const url = `${import.meta.env.VITE_BACKEND_URL}/${config.urlBase}${config.conId ? `/${user._id}` : ""}`;
    const datos = { nombre: dataForm.nombre, celular: dataForm.celular, email: dataForm.email };
    if (config.apellido) datos.apellido = dataForm.apellido;
    if (config.direccion) datos.direccion = dataForm.direccion;
    updateProfile(url, datos);
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
          {...register("nombre", reglaNombre("El nombre"))}
        />
        {errors.nombre && <p className="text-red-600 dark:text-red-400 text-sm">{errors.nombre.message}</p>}
      </div>

      {/* Apellido (no aplica a administrador) */}
      {config.apellido && (
        <div>
          <label className="mb-2 block text-sm font-semibold">Apellido</label>
          <input
            type="text"
            placeholder="Ingresa tu apellido"
            className={inputClass}
            {...register("apellido", reglaNombre("El apellido"))}
          />
          {errors.apellido && <p className="text-red-600 dark:text-red-400 text-sm">{errors.apellido.message}</p>}
        </div>
      )}

      {/* Dirección (solo carpintero) */}
      {config.direccion && (
        <div>
          <label className="mb-2 block text-sm font-semibold">Dirección</label>
          <input
            type="text"
            placeholder="Ingresa tu dirección"
            className={inputClass}
            {...register("direccion", reglaTextoCorto("La dirección", 5, 120))}
          />
          {errors.direccion && <p className="text-red-600 dark:text-red-400 text-sm">{errors.direccion.message}</p>}
        </div>
      )}

      {/* Celular */}
      <div>
        <label className="mb-2 block text-sm font-semibold">Celular</label>
        <input type="text" inputMode="tel" maxLength={10} onInput={soloDigitos(10)}
          placeholder="Ingresa tu celular" className={inputClass}
          {...register("celular", reglaCelular())} />
        {errors.celular && <p className="text-red-600 dark:text-red-400 text-sm">{errors.celular.message}</p>}
      </div>

      {/* Correo */}
      <div>
        <label className="mb-2 block text-sm font-semibold">Correo electrónico</label>
        <input
          type="email"
          placeholder="Ingresa tu correo"
          className={inputClass}
          {...register("email",  reglaEmail)}
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
