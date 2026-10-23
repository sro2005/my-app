import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const PaymentResult = () => {
  const params = new URLSearchParams(useLocation().search);
  const reference = params.get('reference');
  const status = params.get('status');

  return (
    <main className="container" style={{ maxWidth: 720, margin: '3rem auto', padding: '2rem', textAlign: 'center' }}>
      <h1>Resultado de la simulación de pago</h1>
      <p>Esta tienda usa el entorno de pruebas de Wompi. No se realizan cobros ni transferencias reales.</p>
      <p>La redirección por sí sola no confirma el resultado de una transacción de prueba.</p>
      {reference && <p><strong>Referencia de prueba:</strong> {reference}</p>}
      {status && <p><strong>Estado informado por Wompi (pruebas):</strong> {status}</p>}
      <p>Si el evento de prueba se valida correctamente, el estado aparecerá en tus pedidos de demostración.</p>
      <Link to="/listado-pedidos">Consultar mis pedidos</Link>
      {' · '}
      <Link to="/catalogo">Volver al catálogo</Link>
    </main>
  );
};

export default PaymentResult;
