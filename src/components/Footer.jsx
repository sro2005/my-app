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
        <p>El futuro se siente en casa.</p>
        <div className="evh-footer-contact">
          <h2>Contacto</h2>
          <a href="mailto:company.electrovibehome@gmail.com">company.electrovibehome@gmail.com</a>
        </div>
      </div>

      <div className="evh-footer-section">
        <h2>Explora</h2>
        {exploreLinks.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
      </div>

      <div className="evh-footer-section">
        <h2>Recursos</h2>
        <div className="evh-footer-resources">
          <section>
            <h3>Sobre Nosotros</h3>
            <p>Proyecto académico sobre tecnología para un hogar más cómodo y conectado.</p>
          </section>
          <section>
            <h3>Política de Privacidad</h3>
            <p>Los datos del perfil se usan para las funciones de demostración. Evita ingresar información personal real.</p>
          </section>
          <section>
            <h3>Términos de Servicio</h3>
            <p>Catálogo, pedidos y pagos son demostrativos; Wompi permanece en Sandbox y no se realizan cobros reales.</p>
          </section>
        </div>
      </div>
    </div>
    <div className="evh-footer-legal">© {new Date().getFullYear()} ElectroVibeHome. Todos los derechos reservados.</div>
  </footer>
  );
};

export default Footer;
