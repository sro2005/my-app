import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select'; // Importa React-Select

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
  const [paymentMethod, setPaymentMethod] = useState(null); // Cambiado a objeto para React-Select
  const [deliveryDate, setDeliveryDate] = useState("");
  const [product, setProduct] = useState(null); // Cambiado a objeto para React-Select
  const [totalAmount, setTotalAmount] = useState(0);
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [sameRegisteredNumber, setSameRegisteredNumber] = useState(false);
  
  // Estado para almacenar la lista de productos
  const [products, setProducts] = useState([]);
  
  // Estado para manejar la visibilidad del modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Estado para almacenar los detalles del pedido para la confirmación
  const [orderDetails, setOrderDetails] = useState(null);
  
  // Hook para la navegación
  const navigate = useNavigate();

  // Cargar los datos del cliente desde localStorage al montar el componente
  useEffect(() => {
    const savedCustomerData = localStorage.getItem('userData');
    
    if (savedCustomerData) {
      try {
        // Intenta analizar los datos guardados
        const userData = JSON.parse(savedCustomerData);
        
        // Verifica si los datos están definidos y tienen las propiedades esperadas
        if (userData && userData.firstName && userData.lastName && userData.email && userData.phone) {
          setFirstName(userData.firstName);
          setLastName(userData.lastName);
          setEmail(userData.email);
          setPhone(userData.phone);
        }
      } catch (error) {
        console.error('Error al analizar los datos del cliente desde localStorage:', error);
      }
    }

  // Cargar la lista de productos al montar el componente
    const API_URL = process.env.REACT_APP_API_BASE_URL;
    if (!API_URL) {
      console.warn('La variable REACT_APP_API_BASE_URL no está configurada.');
    }
    axios.get(`${API_URL}/api/products`) // Solicita la lista de productos desde el backend
      .then(response => setProducts(response.data.map(product => ({
        value: product._id,
        label: `${product.name} - ${formatPrice(product.price)}`,
        price: product.price
      }))))
      .catch(error => console.error('Error cargando productos:', error));
  }, []);

  // Maneja el cambio de selección de producto
  const handleProductChange = (selectedOption) => {
    setProduct(selectedOption);
    setTotalAmount(selectedOption ? selectedOption.price : 0);
  };

  // Maneja el cambio en el método de pago
  const handlePaymentMethodChange = (selectedOption) => {
    setPaymentMethod(selectedOption);
    setAccountNumber("");
    setBankName("");
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
      paymentMethod: paymentMethod ? paymentMethod.label : '',
      deliveryDate,
      products: [product ? product.value : ''],
      totalAmount,
      accountNumber: paymentMethod && (paymentMethod.label === "Tarjeta Crédito" || paymentMethod.label === "Tarjeta Débito" || !sameRegisteredNumber) ? accountNumber : undefined,
      bankName: paymentMethod && (paymentMethod.label === "Tarjeta Crédito" || paymentMethod.label === "Tarjeta Débito") ? bankName : undefined,
      sameRegisteredNumber: (paymentMethod && (paymentMethod.label === "Nequi" || paymentMethod.label === "Daviplata" || paymentMethod.label === "Transfiya")) ? sameRegisteredNumber : undefined
    };
    
    setOrderDetails(order);
    setShowConfirmModal(true); // Muestra el modal de confirmación
  };

  // Maneja la confirmación del pedido
  const handleConfirm = () => {
    const API_URL = process.env.REACT_APP_API_BASE_URL;
    if (!API_URL) {
      console.warn('La variable REACT_APP_API_BASE_URL no está configurada.');
    }
    axios.post(`${API_URL}/api/orders/realizar`, orderDetails) // Envía los detalles del pedido al backend
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

  // Opciones para el método de pago
  const paymentMethods = [
    { value: 'Tarjeta de Crédito', label: 'Tarjeta Crédito' },
    { value: 'Tarjeta de Débito', label: 'Tarjeta Débito' },
    { value: 'Nequi', label: 'Nequi' },
    { value: 'Daviplata', label: 'Daviplata' },
    { value: 'Transfiya', label: 'Transfiya' }
  ];

  return (
    <div >
      {/* Formulario para realizar un pedido */}
      <form onSubmit={handleSubmit}>
        <h1>Formulario</h1>
        <h2>Realizar Nuevo Pedido</h2>
        <input type="text" placeholder="Nombre(s)" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <input type="text" placeholder="Apellidos" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <input type="email" placeholder="Correo Electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="tel" placeholder="Número de Celular" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <input type="text" placeholder="Dirección del Domicilio" value={address} onChange={(e) => setAddress(e.target.value)} required />

        {/* Campo de selección de método de pago */}
        <Select
          placeholder="Selecciona un método de pago"
          options={paymentMethods}
          onChange={handlePaymentMethodChange}
          value={paymentMethod}
          isClearable
        />
                      
        {/* Campo para el número de cuenta */}
        {(paymentMethod && (paymentMethod.value === "Tarjeta de Crédito" || paymentMethod.value === "Tarjeta de Débito")) && (
          <>
            <input
              type="text"
              placeholder="Nombre del Banco"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Número de Cuenta"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 20))} // Solo números, máximo 20 dígitos
              maxLength="20"
              required
            />
          </>
        )}

        {/* Campo para indicar si el número es el mismo que el registrado */}
        {(paymentMethod && (paymentMethod.value === "Nequi" || paymentMethod.value === "Daviplata" || paymentMethod.value === "Transfiya")) && (
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
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} // Solo números, máximo 10 dígitos
                maxLength="10"
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
        
        {/* Campo de selección de producto */}
        <Select
          placeholder="Selecciona un producto"
          options={products}
          onChange={handleProductChange}
          value={product}
          isClearable
        />
        
        <h3>Total a Pagar: {formatPrice(totalAmount)}</h3>
        <button type="submit">REALIZAR</button>
      </form>
      
      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>CONFIRMACIÓN DEL PEDIDO</h3>
            <p><strong>Nombre:</strong> {firstName} {lastName}</p>
            <p><strong>Correo Electrónico:</strong> {email}</p>
            <p><strong>Número de Celular:</strong> {phone}</p>
            <p><strong>Dirección:</strong> {address}</p>
            <p><strong>Método de Pago:</strong> {paymentMethod ? paymentMethod.label : ''}</p>

            {paymentMethod && (paymentMethod.label === "Tarjeta Crédito" || paymentMethod.label === "Tarjeta Débito") && (
              <>
                <p><strong>Banco:</strong> {bankName}</p>
                <p><strong>Número de Cuenta:</strong> {accountNumber}</p>
              </>
            )}
            {(paymentMethod && (paymentMethod.label === "Nequi" || paymentMethod.label === "Daviplata" || paymentMethod.label === "Transfiya")) && (
              <>
                <p><strong>¿Mismo Número Registrado?:</strong> {sameRegisteredNumber ? "Sí" : "No"}</p>
                {!sameRegisteredNumber && <p><strong>Número de Cuenta/Celular:</strong> {accountNumber}</p>}
              </>
            )}
            <p><strong>Fecha Deseada para la Entrega:</strong> {orderDetails.deliveryDate}</p>
            <p><strong>Producto Seleccionado:</strong> {product ? product.label : ''}</p>
            <p><strong>Total a Pagar:</strong> {formatPrice(totalAmount)}</p>
            <div className="button-container">
            <button className="cancel-button" onClick={handleCancel}>CANCELAR</button>
            <button className="confirm-button" onClick={handleConfirm}>CONFIRMAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidoForm;
