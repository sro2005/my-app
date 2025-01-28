import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import Loading from './components/Loading';
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import ProductoForm from './components/ProductoForm';
import PedidoForm from './components/PedidoForm';
import ListadoClientes from './components/ListadoClientes';
import ListadoProductos from './components/ListadoProductos';
import ListadoPedidos from './components/ListadoPedidos';
import PerfilCliente from './components/PerfilCliente';
import RegistroCliente from './components/RegistroCliente';
import LoginCliente from './components/LoginCliente';
import RecoverPassword from './components/RecoverPassword';
import AuthProvider from './contexts/AuthContext';

const AppContent = () => {
  const { user, loading, handleLogout } = useContext(AuthContext);

  if (loading) {
    return <Loading />;
  }

  const ProtectedRoute = ({ element: Component }) => {
    return user ? <Component /> : <Navigate to="/login" />;
  };

  return (
    <>
      <Header isAuthenticated={!!user} onLogout={handleLogout} user={user} />
      <Routes>
        {!user ? (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegistroCliente />} />
            <Route path="/login" element={<LoginCliente />} />
            <Route path="/recover-password" element={<RecoverPassword />} />
          </>
        ) : (
          <>
          {/* Redirigir a la página de inicio si el usuario está autenticado y está en la raíz */}
            <Route path="/" element={<Navigate to="/home-page" />} />
            <Route path="/home-page" element={<ProtectedRoute element={HomePage} />} />
            <Route path="/pedido-form" element={<ProtectedRoute element={PedidoForm} />} />
            <Route path="/listado-productos" element={<ProtectedRoute element={ListadoProductos} />} />
            <Route path="/listado-pedidos" element={<ProtectedRoute element={ListadoPedidos} />} />
            <Route path="/perfil-cliente" element={<ProtectedRoute element={PerfilCliente} />} />

            {user?.role === 'admin' && (
              <>
                <Route path="/producto-form" element={<ProtectedRoute element={ProductoForm} />} />
                <Route path="/listado-clientes" element={<ProtectedRoute element={ListadoClientes} />} />
              </>
            )}
          </>
        )}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
    </>
  );
};

const App = () => (
  <Router>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </Router>
);

export default App;
