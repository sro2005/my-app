import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Footer = () => {
  const { user } = useContext(AuthContext);
  const exploreLinks = !user
    ? [['/', 'Inicio'], ['/catalogo', 'Catálogo'], ['/register', 'Únete hoy'], ['/login', 'Iniciar sesión']]
    : user.role === 'admin'
      ? [['/home-page', 'Inicio'], ['/catalogo', 'Catálogo'], ['/listado-productos', 'Inventario'], ['/listado-pedidos', 'Pedidos']]
      : [['/home-page', 'Inicio'], ['/catalogo', 'Catálogo'], ['/listado-pedidos', 'Mis pedidos'], ['/perfil-cliente', 'Mi perfil']];

  return (
  <footer className="footer evh-site-footer">
    <div className="evh-footer-inner">
      <div className="evh-footer-brand">
        <Link to="/" aria-label="ElectroVibeHome, ir al inicio"><span aria-hidden="true">⚡</span> ELECTROVIBEHOME</Link>
        <p>Más conexión. Más comodidad. Más hogar.</p>
      </div>

      <div className="evh-footer-section">
        <h2>Contacto</h2>
        <a href="mailto:company.electrovibehome@gmail.com">company.electrovibehome@gmail.com</a>
      </div>

      <div className="evh-footer-section">
        <h2>Navegación</h2>
        {exploreLinks.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
      </div>

      <div className="evh-footer-section">
        <h2>Recursos</h2>
        <a href="https://company-electrovibehome.onrender.com/about">Sobre Nosotros</a>
        <a href="https://company-electrovibehome.onrender.com/privacy">Política de Privacidad</a>
        <a href="https://company-electrovibehome.onrender.com/terms">Términos de Servicio</a>
      </div>
    </div>
    <div className="evh-footer-legal">© {new Date().getFullYear()} ElectroVibeHome. Todos los derechos reservados.</div>
  </footer>
  );
};

export default Footer;
