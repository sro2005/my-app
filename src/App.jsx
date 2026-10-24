import React, { useContext } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import Loading from './components/Loading';
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import AdminDashboard from './components/AdminDashboard';
import ProductoForm from './components/ProductoForm';
import PedidoForm from './components/PedidoForm';
import ListadoClientes from './components/ListadoClientes';
import ListadoProductos from './components/ListadoProductos';
import ListadoPedidos from './components/ListadoPedidos';
import PerfilCliente from './components/PerfilCliente';
import RegistroCliente from './components/RegistroCliente';
import LoginCliente from './components/LoginCliente';
import RecoverPassword from './components/RecoverPassword';
import ResetPassword from './components/ResetPassword';
import PaymentResult from './components/PaymentResult';
import AboutPage from './components/AboutPage';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import AuthProvider from './contexts/AuthContext';

const AppContent = () => {
  const { user, loading, handleLogout } = useContext(AuthContext);

  if (loading) {
    return <Loading />;
  }

  const ProtectedRoute = ({ component: Component }) => {
    return user ? <Component /> : <Navigate to="/login" />;
  };

  return (
    <>
      <Header isAuthenticated={!!user} onLogout={handleLogout} user={user} />
      <Routes>
            <Route path="/recover-password" element={<RecoverPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/pago-resultado" element={<PaymentResult />} />
        <Route path="/catalogo" element={<ListadoProductos />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        {!user ? (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegistroCliente />} />
            <Route path="/login" element={<LoginCliente />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Navigate to="/home-page" />} />
            <Route path="/home-page" element={user?.role === 'admin' ? <AdminDashboard /> : <ProtectedRoute component={HomePage} />} />
            <Route path="/pedido-form" element={<ProtectedRoute component={PedidoForm} />} />
            <Route path="/listado-productos" element={<ProtectedRoute component={ListadoProductos} />} />
            <Route path="/listado-pedidos" element={<ProtectedRoute component={ListadoPedidos} />} />
            <Route path="/perfil-cliente" element={<ProtectedRoute component={PerfilCliente} />} />

            {user?.role === 'admin' && (
              <>
                <Route path="/producto-form" element={<ProtectedRoute component={ProductoForm} />} />
                <Route path="/listado-clientes" element={<ProtectedRoute component={ListadoClientes} />} />
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

const Router = process.env.REACT_APP_ROUTER_MODE === 'hash' ? HashRouter : BrowserRouter;

const App = () => (
  <Router>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </Router>
);

export default App;
