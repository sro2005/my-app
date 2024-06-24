import React, { useState } from 'react';
import axios from 'axios';

// Componente funcional PedidoForm para el formulario de realización de pedidos
const PedidoForm = () => {
  // Estado para almacenar los datos del pedido
  const [order, setOrder] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: '',
    deliveryDate: '',
    products: '',
    totalAmount: 0
  });

  // Función para manejar cambios en los campos del formulario
  const handleChange = (e) => {
    // Actualizar el estado del pedido con los valores ingresados
    setOrder({ ...order, [e.target.name]: e.target.value });
  };

  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevenir comportamiento por defecto del formulario

    // Petición POST a la API para realizar el pedido con los datos actuales
    axios.post('/api/orders', order)
      .then(response => {
        // Manejar la respuesta exitosa de la API (pedido realizado)
        console.log('Pedido realizado:', response.data);
      })
      .catch(error => {
        // Manejar errores en caso de que falle la petición POST
        console.error('Error realizando pedido:', error);
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Campo de nombre */}
      <input type="text" name="firstName" placeholder="Nombre" onChange={handleChange} required />

      {/* Campo de apellido */}
      <input type="text" name="lastName" placeholder="Apellido" onChange={handleChange} required />

      {/* Campo de correo electrónico */}
      <input type="email" name="email" placeholder="Correo Electrónico" onChange={handleChange} required />

      {/* Campo de teléfono */}
      <input type="tel" name="phone" placeholder="Teléfono" onChange={handleChange} required />

      {/* Campo de dirección */}
      <input type="text" name="address" placeholder="Dirección" onChange={handleChange} required />

      {/* Campo de método de pago */}
      <input type="text" name="paymentMethod" placeholder="Método de Pago" onChange={handleChange} required />

      {/* Campo de fecha de entrega */}
      <input type="date" name="deliveryDate" placeholder="Fecha de Entrega" onChange={handleChange} required />

      {/* Campo de productos */}
      <input type="text" name="products" placeholder="Productos" onChange={handleChange} required />

      {/* Botón para enviar el formulario */}
      <button type="submit">Realizar Pedido</button>
    </form>
  );
};

// Exportar el componente PedidoForm para que pueda ser utilizado en otros archivos
export default PedidoForm;

