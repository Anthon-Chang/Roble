import { Link, Outlet } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import FP from '../assets/fotoPerfil.jpeg';
import storeAuth from '../context/storeAuth';
import storeProfile from '../context/storeProfile';

const Dashboard = () => {
    const { clearToken } = storeAuth();
    const { user } = storeProfile();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null); // <-- Referencia al menú

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className='flex-1 flex flex-col justify-between h-screen bg-gray-100'>
            {/* Navbar */}
            <div className='bg-[#461901] flex items-center justify-between px-5 relative'>
                <div className='flex items-center gap-3'>
                    <img src="/logo.png" alt="Logo Roble" className="w-20 h-20" />
                    <span className='text-xl font-bold text-slate-100'>Roble</span>
                </div>

                {/* Usuario (click para desplegar menú) */}
                <div 
                    className='flex items-center gap-3 cursor-pointer relative'
                    onClick={() => setMenuOpen(!menuOpen)}
                    ref={menuRef} // <-- Asociamos la ref aquí
                >
                    <span className='text-md font-semibold text-slate-100'>{user?.nombre}</span>
                    <span className='text-md font-semibold text-slate-100'>{user?.apellido}</span>
                    
                    <img 
                        src={FP} 
                        alt="img-client" 
                        className="border-2 border-green-600 rounded-full w-10 h-10" 
                    />

                    {/* Menú desplegable */}
                    {menuOpen && (
                        <div className='absolute top-full right-0 bg-[#461901] text-left py-2 shadow-lg z-10 rounded-md min-w-[300px]'>
                            <div className='flex items-center gap-3 px-3 py-2 border-b border-slate-500'>
                                <img src={FP} alt="Usuario" className="w-20 h-20 rounded-full border-2 border-green-600"/>
                                <div>
                                    <p className='text-slate-100 font-semibold'>{user?.nombre}</p>
                                    <p className='text-slate-400 text-sm'>Rol - {user?.rol}</p>
                                </div>
                            </div>
                            <ul className='mt-2'>
                                <li className='my-1'>
                                    <Link to='/dashboard/profile' className='block text-slate-100 hover:bg-gray-900 px-3 py-2 rounded-md text-center'>
                                        Perfil
                                    </Link>
                                </li>
                                <li className='my-1'>
                                    <Link to='/dashboard' className='block text-slate-100 hover:bg-gray-900 px-3 py-2 rounded-md text-center'>
                                        Dashboard
                                    </Link>
                                </li>
                                <li className='my-1'>
                                    <Link to='/dashboard/list' className='block text-slate-100 hover:bg-gray-900 px-3 py-2 rounded-md text-center'>
                                        Listar
                                    </Link>
                                </li>
                                <li className='my-1'>
                                    <Link to='/dashboard/create' className='block text-slate-100 hover:bg-gray-900 px-3 py-2 rounded-md text-center'>
                                        Crear
                                    </Link>
                                </li>
                                <li className='my-1'>
                                    <button
                                        onClick={() => clearToken()}
                                        className="w-full text-white px-3 py-2 rounded-md text-center"
                                    >
                                        Salir
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Contenido */}
            <div className='overflow-y-scroll p-8 flex-1 '>
                <Outlet />
            </div>
        </div>
    );
};

export default Dashboard;
