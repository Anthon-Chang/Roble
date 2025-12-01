import NS from '../assets/Nosotros.jpg';
import { RxDashboard } from "react-icons/rx";
import { BsCashCoin } from "react-icons/bs";
import { SiMaterialformkdocs } from "react-icons/si";
import { TbBadge3DFilled } from "react-icons/tb";
import { GrUserWorker } from "react-icons/gr";
import { IoIosPeople } from "react-icons/io";

const features = [
  { icon: <RxDashboard className='text-2xl text-amber-700 dark:text-amber-400' />, label: 'Administrador de cuenta' },
  { icon: <TbBadge3DFilled className='text-2xl text-amber-700 dark:text-amber-400' />, label: 'Modelado 3D' },
  { icon: <BsCashCoin className='text-2xl text-amber-700 dark:text-amber-400' />, label: 'Pago ágil' },
  { icon: <IoIosPeople className='text-2xl text-amber-700 dark:text-amber-400' />, label: 'Gestión de clientes' },
  { icon: <GrUserWorker className='text-2xl text-amber-700 dark:text-amber-400' />, label: 'Gestión de diseñadores y mano de obra' },
  { icon: <SiMaterialformkdocs className='text-2xl text-amber-700 dark:text-amber-400' />, label: 'Gestión de materiales' },
];

const Nosotros = () => {
  return (
    <section id="nosotros" className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-semibold text-center mb-12 relative inline-block text-gray-900 dark:text-gray-100">
        Nosotros
        <span className="block h-1 w-24 bg-amber-900 dark:bg-amber-400 mx-auto mt-2 rounded-full"></span>
      </h2>

      <div className="flex flex-col sm:flex-row items-center gap-10">
        <img 
          src={NS} 
          alt="Nosotros" 
          className="w-full sm:w-1/2 h-auto rounded-lg object-cover shadow-lg"
        />

        <div className="sm:w-1/2 space-y-6 text-gray-800 dark:text-gray-200">
          <p>
            Roble es un espacio donde la arquitectura digital y los modelos 3D se encuentran con el diseño de interiores para crear soluciones sorprendentes.
          </p>

          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                {feature.icon}
                <span>{feature.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Nosotros;
