import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../contexts/AuthContext';
import './Footer.css';

const scrollToTopImmediately = () => {
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  root.style.scrollBehavior = previousBehavior;
};

const Footer = () => {
  const { user } = useContext(AuthContext);
  const exploreLinks = !user
    ? [['/', 'Inicio'], ['/catalogo', 'Catálogo'], ['/register', 'Crear Cuenta'], ['/login', 'Iniciar Sesión']]
    : user.role === 'admin'
      ? [['/home-page', 'Panel'], ['/admin-inventario', 'Inventario'], ['/listado-clientes', 'Clientes'], ['/listado-pedidos', 'Pedidos'], ['/seguridad', 'Seguridad']]
      : [['/home-page', 'Inicio'], ['/catalogo', 'Catálogo'], ['/listado-pedidos', 'Mis Pedidos'], ['/perfil-cliente', 'Mi Perfil'], ['/seguridad', 'Seguridad']];

  return (
  <footer className="footer evh-site-footer">
    <div className="evh-footer-inner">
      <div className="evh-footer-brand">
        <Link className="evh-footer-logo" to="/" onClick={scrollToTopImmediately} aria-label="ElectroVibeHome, ir al inicio">
          <span className="evh-footer-logo-mark" aria-hidden="true"><FontAwesomeIcon icon={faBolt} /></span>
          <span className="evh-footer-logo-name">ELECTROVIBEHOME</span>
        </Link>
      </div>

      <div className="evh-footer-section evh-footer-contact">
        <h2>Contacto</h2>
        <a href="mailto:company.electrovibehome@gmail.com">company.electrovibehome@<wbr />gmail.com</a>
      </div>

      <div className="evh-footer-section">
        <h2>Explora</h2>
        {exploreLinks.map(([to, label]) => <Link key={to} to={to} onClick={scrollToTopImmediately}>{label}</Link>)}
      </div>

      <div className="evh-footer-section">
        <h2>Recursos</h2>
        <div className="evh-footer-resources">
          <Link to="/about" onClick={scrollToTopImmediately}>Sobre Nosotros</Link>
          <Link to="/privacy" onClick={scrollToTopImmediately}>Política de Privacidad</Link>
          <Link to="/terms" onClick={scrollToTopImmediately}>Términos de Servicio</Link>
        </div>
      </div>
    </div>
    <div className="evh-footer-legal">© {new Date().getFullYear()} ElectroVibeHome. Todos los derechos reservados.</div>
  </footer>
  );
};

export default Footer;
