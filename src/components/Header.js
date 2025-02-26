import React, { useContext } from 'react'; // Importar useContext
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faHome, faPlusCircle, faCheckSquare, faUser, faUsers, faBoxOpen, faClipboardList, faUserPlus, faDoorOpen } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../contexts/AuthContext'; // Asegúrate de que esta sea la ruta correcta

const Header = () => {
  const { user, handleLogout } = useContext(AuthContext); // Obtener user y handleLogout desde el contexto
  const [showGoodbyeMessage, setShowGoodbyeMessage] = React.useState(false);

  const logout = () => {
    setShowGoodbyeMessage(true);
    setTimeout(() => {
      setShowGoodbyeMessage(false);
      handleLogout(); // Llamar a handleLogout para manejar la lógica de logout
    }, 3000);
  };

  return (
    <header>
      <h1 className="header-title">⚡ELECTROVIBEHOME⚡</h1>
      <div className="separator-shadow"></div>
      <h4>• TRANSFORMA TU HOGAR CON LA ENERGÍA DEL FUTURO •</h4>
      <nav aria-label="Main Navigation">
        {user ? (
            <div className="nav-container">
              <ul className="nav-links">
                <li>
                  <Link to="/home-page">
                    <div className="nav-icon"><FontAwesomeIcon icon={faHome} /></div>
                    <div className="nav-text">INICIO</div>
                  </Link>
                </li>

              {/* Solo mostrar "Agregar Producto" si el rol es admin */}
              {user?.role === 'admin' && (
                <li>
                  <Link to="/producto-form">
                    <div className="nav-icon"><FontAwesomeIcon icon={faPlusCircle} /></div>
                    <div className="nav-text">AGREGAR PRODUCTOS</div>
                  </Link>
                </li>
              )}
              {/* Solo mostrar "Realizar Pedidos" si el rol es user */}
              {user?.role === 'user' && (
                <li>
                  <Link to="/pedido-form">
                    <div className="nav-icon"><FontAwesomeIcon icon={faCheckSquare} /></div>
                    <div className="nav-text">REALIZAR PEDIDOS</div>
                  </Link>
                </li>
              )}
              {/* Solo mostrar "Gestión de Clientes" si el rol es admin */}
              {user?.role === 'admin' && (
                <li>
                  <Link to="/listado-clientes">
                    <div className="nav-icon"><FontAwesomeIcon icon={faUsers} /></div>
                    <div className="nav-text">GESTIÓN DE CLIENTES</div>
                  </Link>
                </li>
              )}

                <li>
                  <Link to="/listado-productos">
                    <div className="nav-icon"><FontAwesomeIcon icon={faBoxOpen} /></div>
                    <div className="nav-text">
              {user?.role === 'admin' ? 'GESTIÓN DE INVENTARIOS' : 'MIS PREFERENCIAS'}
                    </div>
                  </Link>
                </li>

                <li>
                  <Link to="/listado-pedidos">
                    <div className="nav-icon"><FontAwesomeIcon icon={faClipboardList} /></div>
                    <div className="nav-text">
              {user?.role === 'admin' ? 'GESTIÓN DE PEDIDOS' : 'MIS ÓRDENES'}
                    </div>
                  </Link>
                </li>
                
              {/* Solo mostrar "Perfil" si el rol es user */}
              {user?.role === 'user' && (
                <li>
                  <Link to="/perfil-cliente">
                    <div className="nav-icon"><FontAwesomeIcon icon={faUser} /></div>
                    <div className="nav-text">PERFIL</div>
                  </Link>
                </li>
              )}
             
                <li className="logout-item">
                  <button className="logout-button" onClick={logout}>
                    <div className="nav-icon"><FontAwesomeIcon icon={faSignOutAlt} /></div>
                    <div className="nav-text">SALIR</div>
                  </button>
                </li>
              </ul>
            </div>
        ) : (
            <div className="nav-container">
              <ul className="nav-links">
                <li>
                  <Link to="/register">
                    <div className="nav-icon"><FontAwesomeIcon icon={faUserPlus} /></div>
                    <div className="nav-text">ÚNETE HOY</div>
                  </Link>
                </li>
                <li>
                  <Link to="/login">
                    <div className="nav-icon"><FontAwesomeIcon icon={faDoorOpen} /></div>
                    <div className="nav-text">ENTRA AHORA</div>
                  </Link>
                </li>
              </ul>
            </div>
        )}
      </nav>
      {showGoodbyeMessage && (
        <div className="goodbye-message">
          <h1>Gracias por visitarnos, vuelve pronto</h1>
        </div>
      )}
    </header>
  );
};

export default Header;