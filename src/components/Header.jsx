import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSignOutAlt,
  faHome,
  faPlusCircle,
  faCheckSquare,
  faUser,
  faUsers,
  faBoxOpen,
  faClipboardList,
  faUserPlus,
  faDoorOpen,
  faInfoCircle
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
            ) : (
              <>
                {navLink('/home-page', faHome, 'Inicio')}
                {user.role === 'admin' && navLink('/admin-inventario', faPlusCircle, 'Gestionar productos')}
                {user.role === 'user' && navLink('/pedido-form', faCheckSquare, 'Realizar pedido')}
                {user.role === 'admin' && navLink('/listado-clientes', faUsers, 'Clientes')}
                {navLink('/listado-productos', faBoxOpen, user.role === 'admin' ? 'Inventario' : 'Preferencias')}
                {navLink('/listado-pedidos', faClipboardList, user.role === 'admin' ? 'Pedidos' : 'Mis pedidos')}
                {user.role === 'user' && navLink('/perfil-cliente', faUser, 'Mi perfil')}
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
