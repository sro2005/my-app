import React from 'react';

// Componente funcional Footer que muestra la información de pie de página
const Footer = () => {
  return (
<footer className="footer">
  <div className="footer-sections">
    <div className="section left">
      <h3>Contacto</h3>
      <p>Email: company.electrovibehome@gmail.com</p>
      <p>Teléfono: +57 601 000 0000</p>
    </div>

    <div className="section center">
      <h3>Recursos</h3>
      <ul>
        <li><a href="/about">Sobre Nosotros</a></li>
        <li><a href="/privacy">Política de Privacidad</a></li>
        <li><a href="/terms">Términos de Servicio</a></li>
      </ul>
    </div>

    <div className="section right">
      <h3>Redes Sociales</h3>
      <ul className="social-links">
        <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-facebook"></i></a></li>
        <li><a href="https://x.com" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-x-twitter"></i></a></li>
        <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-instagram"></i></a></li>
      </ul>
    </div>
  </div>
  <p>&copy; Copyright 2025 </p>
  <p>⚡ELECTROVIBEHOME⚡</p>
  <p>Todos los derechos reservados.</p>
</footer>
  );
};

// Exportar el componente Footer para que pueda ser utilizado en otros archivos
export default Footer;