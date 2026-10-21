import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const PaymentResult = () => {
  const params = new URLSearchParams(useLocation().search);
  const reference = params.get('reference');
  const status = params.get('status');

  return (
    <main className="container" style={{ maxWidth: 720, margin: '3rem auto', padding: '2rem', textAlign: 'center' }}>
      <h1>Gracias por tu compra</h1>
      <p>Wompi nos está notificando el resultado de la transacción. La redirección por sí sola no confirma un pago.</p>
      {reference && <p><strong>Referencia:</strong> {reference}</p>}
      {status && <p><strong>Estado informado por Wompi:</strong> {status}</p>}
      <p>El estado definitivo aparecerá en tus pedidos cuando el servidor valide la notificación segura del pago.</p>
      <Link to="/listado-pedidos">Consultar mis pedidos</Link>
      {' · '}
      <Link to="/catalogo">Volver al catálogo</Link>
    </main>
  );
};

export default PaymentResult;
