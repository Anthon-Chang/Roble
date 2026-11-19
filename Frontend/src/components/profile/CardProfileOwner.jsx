import storeProfile from "../../context/storeProfile"

const fila = (label, valor) => (
  <div className="self-start w-full flex gap-2">
    <b>{label}:</b><p>{valor || "--"}</p>
  </div>
)

export const CardProfileOwner = () => {
  const { user } = storeProfile()
  return (
    <div className="bg-white border border-slate-200 p-6 flex flex-col items-center shadow-xl rounded-lg space-y-3 text-gray-800">
      <img src="https://cdn-icons-png.flaticon.com/512/4715/4715329.png" alt="img-client" width={120} height={120} />
      {fila("Nombre", user?.nombre)}
      {fila("Apellido", user?.apellido)}
      {fila("Cédula", user?.cedula)}
      {fila("Email", user?.email)}
      {fila("Celular", user?.celular)}
    </div>
  )
}