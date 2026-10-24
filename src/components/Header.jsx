import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSignOutAlt,
  faHome,
  faCheckSquare,
  faUser,
  faUsers,
  faBoxOpen,
  faClipboardList,
  faUserPlus,
  faDoorOpen,
  faInfoCircle,
  faLock
} from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../contexts/AuthContext';

const navLink = (to, icon, label) => (
  <li key={to}>
    <Link to={to}>
      <FontAwesomeIcon icon={icon} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  </li>
);

const Header = () => {
  const { user, handleLogout } = useContext(AuthContext);
  // Cierra la sesión inmediatamente y evita un aviso flotante que se desplace bajo el encabezado.
  const logout = () => handleLogout();

  return (
    <header className="evh-site-header">
      <div className="evh-header-inner">
        <Link className="evh-site-brand" to={user ? '/home-page' : '/'} aria-label="ElectroVibeHome, ir al inicio">
          <span className="evh-site-brand-mark" aria-hidden="true">⚡</span>
          <span className="evh-site-brand-copy">
            <strong>ELECTROVIBEHOME</strong>
            <small>TECNOLOGÍA PARA EL HOGAR</small>
          </span>
        </Link>

        <nav aria-label="Navegación principal">
          <ul className="evh-header-links">
            {!user ? (
              <>
                {navLink('/catalogo', faBoxOpen, 'Catálogo')}
                {navLink('/about', faInfoCircle, 'La propuesta')}
                {navLink('/register', faUserPlus, 'Crear cuenta')}
                {navLink('/login', faDoorOpen, 'Iniciar sesión')}
              </>
            ) : user.role === 'admin' ? (
              <>
                {navLink('/home-page', faHome, 'Panel')}
                {navLink('/admin-inventario', faBoxOpen, 'Inventario')}
                {navLink('/listado-clientes', faUsers, 'Clientes')}
                {navLink('/listado-pedidos', faClipboardList, 'Pedidos')}
                {navLink('/seguridad', faLock, 'Seguridad')}
                <li>
                  <button className="evh-site-logout" type="button" onClick={logout} aria-label="Cerrar sesión">
                    <FontAwesomeIcon icon={faSignOutAlt} aria-hidden="true" />
                    <span>Salir</span>
                  </button>
                </li>
              </>
            ) : (
              <>
                {navLink('/home-page', faHome, 'Inicio')}
                {navLink('/catalogo', faBoxOpen, 'Catálogo')}
                {navLink('/pedido-form', faCheckSquare, 'Realizar pedido')}
                {navLink('/listado-pedidos', faClipboardList, 'Mis pedidos')}
                {navLink('/perfil-cliente', faUser, 'Mi perfil')}
                {navLink('/seguridad', faLock, 'Seguridad')}
                <li>
                  <button className="evh-site-logout" type="button" onClick={logout} aria-label="Cerrar sesión">
                    <FontAwesomeIcon icon={faSignOutAlt} aria-hidden="true" />
                    <span>Salir</span>
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
