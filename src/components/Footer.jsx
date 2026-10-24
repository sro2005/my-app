import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Footer = () => {
  const { user } = useContext(AuthContext);
  const exploreLinks = !user
    ? [['/', 'Inicio'], ['/catalogo', 'Catálogo'], ['/register', 'Crear cuenta'], ['/login', 'Iniciar sesión']]
    : user.role === 'admin'
      ? [['/home-page', 'Panel'], ['/admin-inventario', 'Inventario'], ['/listado-clientes', 'Clientes'], ['/listado-pedidos', 'Pedidos'], ['/seguridad', 'Seguridad']]
      : [['/home-page', 'Inicio'], ['/catalogo', 'Catálogo'], ['/listado-pedidos', 'Mis pedidos'], ['/perfil-cliente', 'Mi perfil'], ['/seguridad', 'Seguridad']];

  return (
  <footer className="footer evh-site-footer">
    <div className="evh-footer-inner">
      <div className="evh-footer-brand">
        <Link className="evh-footer-logo" to="/" aria-label="ElectroVibeHome, ir al inicio"><span aria-hidden="true">⚡</span> ELECTROVIBEHOME</Link>
        <p>El futuro se siente en casa.</p>
      </div>

      <div className="evh-footer-section evh-footer-contact">
        <h2>Contacto</h2>
        <a href="mailto:company.electrovibehome@gmail.com">company.electrovibehome@<wbr />gmail.com</a>
      </div>

      <div className="evh-footer-section">
        <h2>Explora</h2>
        {exploreLinks.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
      </div>

      <div className="evh-footer-section">
        <h2>Recursos</h2>
        <div className="evh-footer-resources">
          <Link to="/about">Qué es ElectroVibeHome</Link>
          <Link to="/privacy">Política de Privacidad</Link>
          <Link to="/terms">Términos de Servicio</Link>
        </div>
      </div>
    </div>
    <div className="evh-footer-legal">© {new Date().getFullYear()} ElectroVibeHome. Todos los derechos reservados.</div>
  </footer>
  );
};

export default Footer;
