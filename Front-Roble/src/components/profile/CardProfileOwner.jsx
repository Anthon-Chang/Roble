import storeProfile from "../../context/storeProfile"
export const CardProfileOwner = () => {

     const {user} = storeProfile()

    return (
        <div className="bg-white border border-slate-200 h-auto p-4 
                        flex flex-col items-center justify-between shadow-xl rounded-lg">

            <div>
                <img src="https://cdn-icons-png.flaticon.com/512/4715/4715329.png" alt="img-client" className="m-auto " width={120} height={120} />
            </div>
            <div className="self-start">
                <b>Nombre:</b><p className="inline-block ml-3">{user?.nombreCliente}</p>
            </div >
            <div className="self-start">
                <b>Cédula:</b><p className="inline-block ml-3">{user?.cedulaCliente}</p>
            </div >
            <div className="self-start">
                <b>Email:</b><p className="inline-block ml-3"> {user?.emailCliente}</p>
            </div>
            <div className="self-start">
                <b>Celular:</b><p className="inline-block ml-3">{user?.celularCliente}</p>
            </div>
            <div className="self-start">
                <b>Producto:</b><p className="inline-block ml-3">{user?.nombreProyecto}</p>
            </div>
        </div>
    )
}