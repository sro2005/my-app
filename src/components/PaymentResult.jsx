import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const PaymentResult = () => {
  const params = new URLSearchParams(useLocation().search);
  const reference = params.get('reference');
  const status = params.get('status');

  return (
    <main className="evh-payment-result">
      <section className="evh-payment-result-card">
        <span className="evh-payment-result-mark" aria-hidden="true">↗</span>
        <span className="evh-eyebrow">ESTADO DE TU PAGO</span>
        <h1>Estamos revisando el resultado</h1>
        <p>La respuesta del proveedor puede tardar unos instantes. La redirección, por sí sola, no confirma el estado de una transacción.</p>
        <aside className="evh-payment-result-notice" role="note">
          <strong>Información importante</strong>
          <p>El checkout de Wompi está en entorno de pruebas. No se procesan cobros ni transferencias reales; no ingreses datos de una tarjeta real.</p>
        </aside>
        {reference && <p className="evh-payment-result-detail"><strong>Referencia:</strong> {reference}</p>}
        {status && <p className="evh-payment-result-detail"><strong>Estado recibido:</strong> {status}</p>}
        <p>Consulta tus pedidos para revisar la información más reciente disponible.</p>
        <div className="evh-payment-result-actions">
          <Link className="evh-button evh-button-primary" to="/listado-pedidos">Consultar mis pedidos</Link>
          <Link className="evh-button evh-button-secondary" to="/catalogo">Volver al catálogo</Link>
        </div>
      </section>
    </main>
  );
};

export default PaymentResult;
