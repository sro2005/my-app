import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Función para formatear el precio en formato local
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(price);
};

const PedidoForm = () => {
  // Estados para almacenar los datos del formulario
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [productId, setProductId] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Estado para almacenar la lista de productos
  const [products, setProducts] = useState([]);
  
  // Estado para manejar la visibilidad del modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Estado para almacenar los detalles del pedido para la confirmación
  const [orderDetails, setOrderDetails] = useState(null);
  
  // Hook para la navegación
  const navigate = useNavigate();

  // Cargar la lista de productos al montar el componente
  useEffect(() => {
    axios.get('/api/products') // Solicita la lista de productos desde el backend
      .then(response => setProducts(response.data))
      .catch(error => console.error('Error cargando productos:', error));
  }, []);

  // Maneja el cambio de selección de producto
  const handleProductChange = (e) => {
    const selectedProductId = e.target.value;
    setProductId(selectedProductId);
    
    // Encuentra el producto seleccionado en la lista de productos
    const selectedProduct = products.find(product => product._id === selectedProductId);
    if (selectedProduct) {
      setTotalAmount(selectedProduct.price);
    } else {
      setTotalAmount(0);
    }
  };

  // Maneja el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario
    
    // Prepara los detalles del pedido para la confirmación
    const order = {
      firstName,
      lastName,
      email,
      phone,
      address,
      paymentMethod,
      deliveryDate,
      products: [productId],
      totalAmount
    };
    
    setOrderDetails(order);
    setShowConfirmModal(true); // Muestra el modal de confirmación
  };

  // Maneja la confirmación del pedido
  const handleConfirm = () => {
    axios.post('/api/orders/realizar', orderDetails) // Envía los detalles del pedido al backend
      .then(response => {
        console.log('Pedido realizado:', response.data);
        alert('¡Pedido realizado exitosamente!');
        navigate('/confirmacion-pedido', { state: { order: response.data } }); // Navega a la página de confirmación
      })
      .catch(error => {
        console.error('Error realizando pedido:', error);
        alert('Ocurrió un error al realizar el pedido. Por favor, intenta nuevamente.');
      });
  };

  // Maneja la cancelación del pedido
  const handleCancel = () => {
    setShowConfirmModal(false); // Cierra el modal de confirmación
  };

  return (
    <div>
      {/* Formulario para realizar un pedido */}
      <form onSubmit={handleSubmit}>
        <h1>Formulario</h1>
        <h2>Realizar Nuevo Pedido</h2>
        <input type="text" placeholder="Nombre(s)" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <input type="text" placeholder="Apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <input type="email" placeholder="Correo Electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="tel" placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <input type="text" placeholder="Dirección del Domicilio" value={address} onChange={(e) => setAddress(e.target.value)} required />
        <input type="text" placeholder="Método de Pago" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required />
        <input type="date" placeholder="Fecha Estimada de Entrega del Pedido" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} required />
        <select name="productId" onChange={handleProductChange} required>
          <option value="">Selecciona un producto</option>
          {products.map(product => (
            <option key={product._id} value={product._id}>
              {product.name} - {formatPrice(product.price)}
            </option>
          ))}
        </select>
        <p><strong>Total a pagar:</strong> {formatPrice(totalAmount)}</p>
        <button type="submit">REALIZAR</button>
      </form>

      {/* Modal de confirmación de pedido */}
      {showConfirmModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Confirmar Pedido</h2>
            <p>Cliente: {orderDetails.firstName} {orderDetails.lastName}</p>
            <p>Correo Electrónico: {orderDetails.email}</p>
            <p>Teléfono: {orderDetails.phone}</p>
            <p>Dirección: {orderDetails.address}</p>
            <p>Método de Pago: {orderDetails.paymentMethod}</p>
            <p>Fecha de Entrega: {orderDetails.deliveryDate}</p>
            <p>Productos: {orderDetails.products.join(', ')}</p>
            <p>Total: {formatPrice(orderDetails.totalAmount)}</p>
            <div className="modal-buttons">
             <button className="modal-button-cancel" onClick={handleCancel}>CANCELAR</button>
             <button className="modal-button-confirm" onClick={handleConfirm}>CONFIRMAR PEDIDO</button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidoForm;