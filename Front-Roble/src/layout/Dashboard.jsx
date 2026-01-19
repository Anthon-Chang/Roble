import { Link, Outlet, useNavigate } from "react-router-dom";

import { useState, useEffect, useRef } from 'react';
import FP from '../assets/fotoPerfil.jpeg';
import storeAuth from '../context/storeAuth';
import storeProfile from '../context/storeProfile';


const Dashboard = () => {
    const { clearToken } = storeAuth();
    const { user } = storeProfile();
    const [menuOpen, setMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false); // <-- estado modo oscuro
    const menuRef = useRef(null);




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
            <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} flex-1 flex flex-col justify-between h-screen transition-colors duration-300`}>
                {/* Navbar */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-[#461901]'} flex items-center justify-between px-5 relative`}>
                    <div className='flex items-center gap-3'>
                        <img src="/logo.png" alt="Logo Roble" className="w-20 h-20" />
                        <span className='text-xl font-bold text-white'>Roble</span>
                    </div>

                    {/* Usuario (click para desplegar menú) */}
                    <div 
                        className='flex items-center gap-3 cursor-pointer relative'
                        onClick={() => setMenuOpen(!menuOpen)}
                        ref={menuRef}
                    >
                        <span className='text-md text-white font-semibold'>{user?.nombre || user?.nombreCliente}</span>
                        <span className='text-md text-white font-semibold'>{user?.apellido}</span>
                        
                        <img 
                            src={FP} 
                            alt="img-client" 
                            className="border-2 border-green-600 rounded-full w-10 h-10" 
                        />

                        {/* Menú desplegable */}
                        {menuOpen && (
                            <div className={`${darkMode ? 'bg-gray-800' : 'bg-[#461901]'} absolute top-full right-0 text-left py-2 shadow-lg z-10 rounded-md min-w-[300px] transition-colors duration-300`}>
                                <div className='flex items-center gap-3 px-3 py-2 border-b border-slate-500'>
                                    <img src={FP} alt="Usuario" className="w-20 h-20 rounded-full border-2 border-green-600"/>
                                    <div>
                                        <p className={`${darkMode ? 'text-white' : 'text-slate-100'} font-semibold`}>{user?.nombre || user?.nombreCliente} {user?.apellido}</p>
                                        <p className={`${darkMode ? 'text-gray-400' : 'text-slate-400'} text-sm`}>Rol - {user?.rol}</p>
                                    </div>
                                </div>
                                <ul className='mt-2'>
                                    <li className='my-1'>
                                        <Link to='/dashboard/profile' className={`${darkMode ? 'text-white hover:bg-gray-700' : 'text-slate-100 hover:bg-gray-900'} block px-3 py-2 rounded-md text-center`}>
                                            Perfil
                                        </Link>
                                    </li>
                                    {user?.rol !== "cliente" && (
                                        <li className='my-1'>
                                            <Link
                                            to='/dashboard'
                                            className={`${darkMode ? 'text-white hover:bg-gray-700' : 'text-slate-100 hover:bg-gray-900'} block px-3 py-2 rounded-md text-center`}
                                            >
                                            Dashboard
                                            </Link>
                                        </li>
                                        )}

                                    <li className='my-1'>
                                        <Link to='/dashboard/list' className={`${darkMode ? 'text-white hover:bg-gray-700' : 'text-slate-100 hover:bg-gray-900'} block px-3 py-2 rounded-md text-center`}>
                                            Listar
                                        </Link>
                                    </li>
                                    {user?.rol !== "cliente" && (
                                        <li className="my-1">
                                            <Link
                                            to="/dashboard/create"
                                            className={`${darkMode ? 'text-white hover:bg-gray-700' : 'text-slate-100 hover:bg-gray-900'} block px-3 py-2 rounded-md text-center`}
                                            >
                                            Crear
                                            </Link>
                                        </li>
                                        )}

                                </ul>

                                {/* Botón para alternar modo oscuro */}
                                <div>
                                    <button 
                                        onClick={() => setDarkMode(!darkMode)}
                                        className={`${darkMode ? 'text-white hover:bg-gray-700' : 'text-slate-100 hover:bg-gray-900'} w-full px-3 py-2 rounded-md text-center`}
                                    >
                                        {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
                                    </button>
                                </div>

                                <div>
                                        <button
                                            onClick={() => clearToken()}
                                            className={`${darkMode ? 'text-white hover:bg-gray-700' : 'text-slate-100 hover:bg-gray-900'} w-full px-3 py-2 rounded-md text-center`}
                                        >
                                            Salir
                                        </button>                     
                                </div>
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
