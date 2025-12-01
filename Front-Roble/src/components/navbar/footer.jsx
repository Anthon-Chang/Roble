import { FaFacebook } from "react-icons/fa";
import { FaSquareInstagram } from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";

const finish = () => {
  return (
    <section className="p-4 bg-white dark:bg-gray-900 text-black dark:text-white transition-colors ">
      <hr className="border border-amber-800 dark:border-amber-500" />
      <div className="flex justify-between"> 

      <div className="flex flex-col items-center">
        <p className="text-2xl">Redes Sociales</p>
        <ul className="flex gap-6">
          <li><a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer"><FaFacebook className="text-2xl" /></a></li>
          <li><a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer"><FaSquareInstagram className="text-2xl" /></a></li>
          <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaXTwitter className="text-2xl" /></a></li>
        </ul>
      </div>

         <div className="flex flex-col justify-between">
          <p className="text-center font-semibold"> -Roble- </p> 
          <p className="font-semibold text-center">© Gr11 - Todos los derechos reservados</p>
        </div>

        <div className="flex flex-col justify-between">
          <p className="font-semibold ">Email: admin_Roble@gmail.com</p>
          <p className="font-semibold ">Phone: 0999557890</p>
        </div>
       
        
      </div>
    </section>
  );
};

export default finish;
