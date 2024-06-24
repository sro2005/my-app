import React from 'react';

// Componente funcional Footer que muestra la información de pie de página
const Footer = () => {
  return (
    <footer>
      {/* Texto de copyright con el año actual */}
      <p>&copy; Copyright 2024 </p>

      {/* Nombre del proyecto */}
      <p>Project - [Home Appliances SRO]</p>

      {/* Aviso de derechos reservados */}
      <p>Todos los derechos reservados.</p>
    </footer>
  );
};

// Exportar el componente Footer para que pueda ser utilizado en otros archivos
export default Footer;

