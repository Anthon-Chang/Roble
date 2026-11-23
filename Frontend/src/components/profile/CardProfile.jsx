import { useState } from "react";
import { toast } from "react-toastify";
import storeProfile from "../../context/storeProfile";
import storeAuth from "../../context/storeAuth";
import { subirFotoAdmin } from "../../services/adminService";
import { subirFotoCarpintero } from "../../services/carpinteroService";
import { subirFotoCliente, mensajeError } from "../../services/clienteService";

// Subida de foto de perfil (HU-020): cada rol tiene su propio endpoint PUT .../foto.
const SUBIR_FOTO_POR_ROL = {
  administrador: subirFotoAdmin,
  carpintero: subirFotoCarpintero,
  cliente: subirFotoCliente,
};

export const CardProfile = () => {
  const { user } = storeProfile();
  const rol = storeAuth((s) => s.rol);
  const [subiendo, setSubiendo] = useState(false);

  const elegirFoto = async (e) => {
    const archivo = e.target.files[0];
    e.target.value = "";
    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      toast.error("Debes seleccionar un archivo de imagen");
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 5 MB");
      return;
    }

    const subirFoto = SUBIR_FOTO_POR_ROL[rol];
    if (!subirFoto) return;

    setSubiendo(true);
    try {
      const data = await subirFoto(archivo);
      storeProfile.setState({ user: { ...storeProfile.getState().user, fotoUrl: data.fotoUrl } });
      toast.success(data.msg || "Foto de perfil actualizada correctamente");
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo actualizar la foto de perfil"));
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700
                    h-auto p-6 flex flex-col items-center justify-between shadow-xl rounded-lg
                    text-gray-800 dark:text-gray-200 space-y-3">

      {/* Imagen del usuario */}
      <div className="relative">
        <img
          src={user?.fotoUrl || "https://cdn-icons-png.flaticon.com/512/4715/4715329.png"}
          alt="img-client"
          className="m-auto rounded-full border-2 border-amber-700 object-cover"
          width={120}
          height={120}
        />
        <label className={`absolute bottom-0 right-0 bg-amber-700 text-white rounded-full p-2 cursor-pointer hover:bg-amber-500 transition-colors ${subiendo ? "opacity-50 pointer-events-none" : ""}`}>
          📷
          <input type="file" accept="image/*" className="hidden" onChange={elegirFoto} disabled={subiendo} />
        </label>
      </div>

      {/* Información del usuario */}
      <div className="w-full space-y-2">
        <div className="flex"><b>Nombre:</b><p className="ml-2">{user?.nombre || "--"}</p></div>
        {user?.apellido && <div className="flex"><b>Apellido:</b><p className="ml-2">{user?.apellido}</p></div>}
        {user?.direccion && <div className="flex"><b>Dirección:</b><p className="ml-2">{user?.direccion}</p></div>}
        <div className="flex"><b>Celular:</b><p className="ml-2">{user?.celular || "--"}</p></div>
        <div className="flex"><b>Correo:</b><p className="ml-2">{user?.email || "--"}</p></div>
      </div>
    </div>
  );
};
