import storeProfile from "../../context/storeProfile";

export const CardProfile = () => {
  const { user } = storeProfile();

  return (
    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 
                    h-auto p-6 flex flex-col items-center justify-between shadow-xl rounded-lg 
                    text-gray-800 dark:text-gray-200 space-y-3">

      {/* Imagen del usuario */}
      <div className="relative">
        <img 
          src={user?.avatar || "https://cdn-icons-png.flaticon.com/512/4715/4715329.png"} 
          alt="img-client" 
          className="m-auto rounded-full border-2 border-amber-700" 
          width={120} 
          height={120} 
        />
        <label className="absolute bottom-0 right-0 bg-amber-700 text-white rounded-full p-2 cursor-pointer hover:bg-amber-500 transition-colors">
          📷
          <input type="file" accept="image/*" className="hidden" />
        </label>
      </div>

      {/* Información del usuario */}
      <div className="w-full space-y-2">
        <div className="flex"><b>Nombre:</b><p className="ml-2">{user?.nombre || "--"}</p></div>
        <div className="flex"><b>Apellido:</b><p className="ml-2">{user?.apellido || "--"}</p></div>
        <div className="flex"><b>Dirección:</b><p className="ml-2">{user?.direccion || "--"}</p></div>
        <div className="flex"><b>Celular:</b><p className="ml-2">{user?.celular || "--"}</p></div>
        <div className="flex"><b>Correo:</b><p className="ml-2">{user?.email || "--"}</p></div>
      </div>
    </div>
  );
};
