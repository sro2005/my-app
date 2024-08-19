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
  const [accountNumber, setAccountNumber] = useState("");
  const [sameRegisteredNumber, setSameRegisteredNumber] = useState(false);
  
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

  // Maneja el cambio en el método de pago
  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
    setAccountNumber("");
    setSameRegisteredNumber(false);
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
      totalAmount,
      accountNumber: paymentMethod === "Tarjeta de Crédito" || paymentMethod === "Tarjeta de Débito" ? accountNumber : undefined,
      sameRegisteredNumber: (paymentMethod === "Nequi" || paymentMethod === "Daviplata" || paymentMethod === "Transfiya") ? sameRegisteredNumber : undefined
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
        <input type="text" placeholder="Apellidos" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <input type="email" placeholder="Correo Electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="tel" placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <input type="text" placeholder="Dirección del Domicilio" value={address} onChange={(e) => setAddress(e.target.value)} required />
        <select name="paymentMethod" onChange={handlePaymentMethodChange} required>
          <option value="">Selecciona un método de pago</option>
          <option value="Tarjeta de Crédito">Tarjeta Crédito</option>
          <option value="Tarjeta de Débito">Tarjeta Débito</option>
          <option value="Nequi">Nequi</option>
          <option value="Daviplata">Daviplata</option>
          <option value="Transfiya">Transfiya</option>
        </select>
        
        {/* Campo para el número de cuenta */}
        {(paymentMethod === "Tarjeta de Crédito" || paymentMethod === "Tarjeta de Débito") && (
          <input
            type="text"
            placeholder="Número de Cuenta"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
          />
        )}

        {/* Campo para indicar si el número es el mismo que el registrado */}
        {(paymentMethod === "Nequi" || paymentMethod === "Daviplata" || paymentMethod === "Transfiya") && (
          <div className="payment-options">
            <p>¿Es el mismo número registrado?</p>
            <label>
              <input
                type="radio"
                value="Sí"
                checked={sameRegisteredNumber === true}
                onChange={() => setSameRegisteredNumber(true)}
              />
              Sí
            </label>
            <label>
              <input
                type="radio"
                value="No"
                checked={sameRegisteredNumber === false}
                onChange={() => setSameRegisteredNumber(false)}
              />
              No
            </label>
            {!sameRegisteredNumber && (
              <input
                type="text"
                placeholder="Número de Cuenta"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
              />
            )}
          </div>
        )}
        
        {/* Campo de fecha de entrega */}
        <div className="date-field">
          <label htmlFor="deliveryDate">Fecha deseada para la entrega:</label>
          <input
            type="date"
            id="deliveryDate"
            name="deliveryDate"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            required
          />
        </div>
        
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
            <p><strong>Cliente:</strong> {orderDetails.firstName} {orderDetails.lastName}</p>
            <p><strong>Correo Electrónico:</strong> {orderDetails.email}</p>
            <p><strong>Teléfono:</strong> {orderDetails.phone}</p>
            <p><strong>Dirección:</strong> {orderDetails.address}</p>
            <p><strong>Método de Pago:</strong> {orderDetails.paymentMethod}</p>
            {orderDetails.accountNumber && <p><strong>Número de Cuenta:</strong> {orderDetails.accountNumber}</p>}
            {orderDetails.sameRegisteredNumber !== undefined && <p><strong>¿Número Registrado?:</strong> {orderDetails.sameRegisteredNumber ? "Sí" : "No"}</p>}
            <p><strong>Fecha de Entrega:</strong> {orderDetails.deliveryDate}</p>
            <p><strong>Producto:</strong> {products.find(product => product._id === orderDetails.products[0])?.name}</p>
            <p><strong>Total a Pagar:</strong> {formatPrice(orderDetails.totalAmount)}</p>
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

