import { Link } from "react-router";
import logo from "../../assets/logo.png";
import logoDarkMode from "../../assets/dark.png";

const Navbar = ({ darkMode, setDarkMode }) => {

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white dark:bg-gray-800 shadow-md transition-colors">
      <div className="container mx-auto h-40 text-center py-4 md:flex justify-between items-center px-4 md:h-15">

        <h1 className="flex items-center gap-2 font-bold text-2xl my-2 text-[#87431b]">
          <img src={logo} alt="logoRoble" width={100} height={100} />
          Roble
        </h1>

        <ul className="flex gap-5 justify-center my-4 flex-wrap">
          <li><Link to="/" className="font-bold hover:text-amber-700 dark:hover:text-amber-400 dark:text-white">Inicio</Link></li>
          <li><Link to="/nosotros" className="font-bold hover:text-amber-700 dark:hover:text-amber-400 dark:text-white">Nosotros</Link></li>
          <li><Link to="/servicios" className="font-bold hover:text-amber-700 dark:hover:text-amber-400 dark:text-white">Servicios</Link></li>
          <li><Link to="/contactanos" className="font-bold hover:text-amber-700 dark:hover:text-amber-400 dark:text-white">Contáctanos</Link></li>
          <li><Link to="/verPlano" className="font-bold hover:text-amber-700 dark:hover:text-amber-400 dark:text-white">Planos</Link></li>
        </ul>

        <ul className="flex justify-center items-center gap-5 my-4">
          <li>
            <img
              src={logoDarkMode}
              alt="modo oscuro"
              width={35}
              height={35}
              className="cursor-pointer"
              onClick={() => setDarkMode(!darkMode)}
              title="Cambiar modo oscuro"
            />
          </li>

          <li>
            <Link to="/login" className="block bg-[#f59e0b] w-40 py-0 mx-auto text-white rounded-2xl text-center sm:mx-0 hover:bg-amber-700"
            >Iniciar sesión</Link>
          </li>
        </ul>
        
      </div>
    </header>
  );
};

export default Navbar;
