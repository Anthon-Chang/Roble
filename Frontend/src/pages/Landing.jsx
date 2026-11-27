import { useEffect } from "react";
import { useLocation } from "react-router";
import { Home } from "./Home";
import Nosotros from "./Nosotros";
import Servicios from "./Servicios";
import Contactanos from "./Contactanos";

export const Landing = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <>
      <Home />
      <Nosotros />
      <Servicios />
      <Contactanos />
    </>
  );
};

export default Landing;