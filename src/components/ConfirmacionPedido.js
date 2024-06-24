import React from 'react';

// Componente funcional ConfirmacionPedido que muestra los detalles de un pedido
// Recibe 'order' como prop, que contiene la información del pedido
const ConfirmacionPedido = ({ order }) => {
  // Verificar si 'order' está definido antes de intentar acceder a sus propiedades
  if (!order) {
    return <div>Cargando detalles del pedido...</div>;
  }

  return (
    <div>
      {/* Título del componente */}
      <h2>Confirmación de Pedido</h2>

      {/* Mostrar detalles del pedido */}
      <p>Nombre: {order.firstName} {order.lastName}</p>
      <p>Correo Electrónico: {order.email}</p>
      <p>Teléfono: {order.phone}</p>
      <p>Dirección: {order.address}</p>
      <p>Método de Pago: {order.paymentMethod}</p>
      <p>Fecha de Entrega: {order.deliveryDate}</p>
      <p>Productos: {order.products}</p>
      <p>Total: {order.totalAmount}</p>
    </div>
  );
};

// Exportar el componente ConfirmacionPedido para que pueda ser utilizado en otros archivos
export default ConfirmacionPedido;

