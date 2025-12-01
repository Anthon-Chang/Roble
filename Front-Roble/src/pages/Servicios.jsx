import { SiMaterialformkdocs } from "react-icons/si";
import { IoChatbubbleEllipsesSharp } from "react-icons/io5";
import { GrUserWorker } from "react-icons/gr";
import { IoIosPeople } from "react-icons/io";

const services = [
  {
    icon: <GrUserWorker className="text-5xl text-amber-700 dark:text-amber-400 mx-auto" />,
    title: "Gestión de Carpinteros",
    description:
      "Nuestros profesionales dispondrán de espacios para publicar sus trabajos, integrar su contacto o chatear mediante nuestra aplicación."
  },
  {
    icon: <IoIosPeople className="text-5xl text-amber-700 dark:text-amber-400 mx-auto" />,
    title: "Gestión de Clientes",
    description:
      "Podrás ver y gestionar los productos asociados a cada profesional y solicitar contacto personal fácilmente."
  },
  {
    icon: <SiMaterialformkdocs className="text-5xl text-amber-700 dark:text-amber-400 mx-auto" />,
    title: "Gestión de Materiales",
    description:
      "Acuerdos mutuos con nuestros profesionales para escoger los mejores materiales para tus muebles según cada caso."
  },
  {
    icon: <IoChatbubbleEllipsesSharp className="text-5xl text-amber-700 dark:text-amber-400 mx-auto" />,
    title: "Chat en Tiempo Real",
    description:
      "Comunícate en tiempo real con nuestros profesionales mediante nuestra aplicación para una mejor coordinación."
  },
];

const Servicios = () => {
  return (
    <section id="servicios" className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-semibold text-center mb-12 text-gray-900 dark:text-gray-100 relative inline-block">
        SERVICIOS
        <span className="block h-1 w-24 bg-amber-900 dark:bg-amber-400 mx-auto mt-2 rounded-full"></span>
      </h2>

      <div className="flex flex-wrap justify-center gap-6">
        {services.map((service, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-700 hover:shadow-lg transition-shadow duration-300 rounded-lg p-6 sm:w-[45%] lg:w-[22%] text-center flex flex-col items-center"
          >
            {service.icon}
            <h4 className="text-xl font-bold py-4 text-gray-900 dark:text-gray-100">{service.title}</h4>
            <p className="text-gray-700 dark:text-gray-300">{service.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Servicios;
