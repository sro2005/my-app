import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select'; // Importa React-Select

// Función para formatear el precio en formato local
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(price);
};

// Fecha de hoy en formato YYYY-MM-DD
const today = new Date().toISOString().split('T')[0];

const PedidoForm = () => {
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
  const [products, setProducts] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null); // Estado para guardar la información del pedido
  const navigate = useNavigate();

  useEffect(() => {
    const savedCustomerData = localStorage.getItem('userData');
    
    if (savedCustomerData) {
      try {
        const userData = JSON.parse(savedCustomerData);
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

    const API_URL = process.env.REACT_APP_API_BASE_URL;
    if (!API_URL) {
      console.warn('La variable REACT_APP_API_BASE_URL no está configurada.');
    }
    axios.get(`${API_URL}/api/products`) // Solicita la lista de productos desde el backend
      .then(response => setProducts(response.data.map(product => ({
        value: product._id,
        label: `${product.name} - ${formatPrice(product.price)}`,
        price: product.price
      })))) .catch(error => console.error('Error cargando productos:', error));
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newOrder = {
      firstName,
      lastName,
      email,
      phone,
      address,
      paymentMethod: paymentMethod ? paymentMethod.label : '',
      deliveryDate,
      products: product ? [{ productId: product.value, quantity: 1 }] : [], // Aseguramos que esté en el formato adecuado
      totalAmount,
      accountNumber: paymentMethod && (paymentMethod.label === "Tarjeta Crédito" || paymentMethod.label === "Tarjeta Débito" || !sameRegisteredNumber) ? accountNumber : undefined,
      bankName: paymentMethod && (paymentMethod.label === "Tarjeta Crédito" || paymentMethod.label === "Tarjeta Débito") ? bankName : undefined,
      sameRegisteredNumber: (paymentMethod && (paymentMethod.label === "Nequi" || paymentMethod.label === "Daviplata" || paymentMethod.label === "Transfiya")) ? sameRegisteredNumber : undefined
    };
    
    setOrder(newOrder); // Guardamos el pedido en el estado
    setShowConfirmModal(true); // Mostramos el modal de confirmación
  };

  const handleConfirm = () => {
    const API_URL = process.env.REACT_APP_API_BASE_URL;
    const token = localStorage.getItem('authToken');

    if (!API_URL || !token) {
      console.warn('La variable REACT_APP_API_BASE_URL o el token de autenticación no están configurados.');
      alert('No se pudo realizar el pedido. Por favor, intente nuevamente.');
      return;
    }
    
    setLoading(true);

    axios.post(`${API_URL}/api/orders/realizar`, order, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => {
        console.log('Pedido realizado:', response.data);
        setLoading(false);
        alert('¡Pedido realizado exitosamente!');
        navigate('/confirmacion-pedido', { state: { order: response.data } });
      })
      .catch(error => {
        console.error('Error realizando pedido:', error);
        setLoading(false);
        alert('Ocurrió un error al realizar el pedido. Por favor, intenta nuevamente.');
      });
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  const paymentMethods = [
    { value: 'Tarjeta de Crédito', label: 'Tarjeta Crédito' },
    { value: 'Tarjeta de Débito', label: 'Tarjeta Débito' },
    { value: 'Nequi', label: 'Nequi' },
    { value: 'Daviplata', label: 'Daviplata' },
    { value: 'Transfiya', label: 'Transfiya' }
  ];

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h1>Formulario</h1>
        <h2>Realizar Nuevo Pedido</h2>
        <input type="text" placeholder="Nombre(s)" value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={firstName !== ""} className={firstName !== "" ? 'disabled-input' : ''} />
        <input type="text" placeholder="Apellidos" value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={lastName !== ""} className={lastName !== "" ? 'disabled-input' : ''} />
        <input type="email" placeholder="Correo Electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={email !== ""} className={email !== "" ? 'disabled-input' : ''} />
        <input type="tel" placeholder="Número de Celular" value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={phone !== ""} className={phone !== "" ? 'disabled-input' : ''} />
        <input type="text" placeholder="Dirección del Domicilio" value={address} onChange={(e) => setAddress(e.target.value)} required />

        <Select placeholder="Selecciona un método de pago" options={paymentMethods} onChange={handlePaymentMethodChange} value={paymentMethod} isClearable />
                      
        {(paymentMethod && (paymentMethod.value === "Tarjeta de Crédito" || paymentMethod.value === "Tarjeta de Débito")) && (
          <>
            <input type="text" placeholder="Nombre del Banco" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
            <input type="text" placeholder="Número de Cuenta" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 20))} maxLength="20" required />
          </>
        )}

        {(paymentMethod && (paymentMethod.value === "Nequi" || paymentMethod.value === "Daviplata" || paymentMethod.value === "Transfiya")) && (
          <div className="payment-options">
            <p>¿Es el mismo número registrado?</p>
            <label>
              <input type="radio" value="Sí" checked={sameRegisteredNumber === true} onChange={() => setSameRegisteredNumber(true)} />
              Sí
            </label>
            <label>
              <input type="radio" value="No" checked={sameRegisteredNumber === false} onChange={() => setSameRegisteredNumber(false)} />
              No
            </label>
            {!sameRegisteredNumber && (
              <input type="text" placeholder="Número de Cuenta" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength="10" required />
            )}
          </div>
        )}
        
        <div className="date-field">
          <label htmlFor="deliveryDate">Fecha deseada para la entrega:</label>
          <input type="date" id="deliveryDate" name="deliveryDate" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} min={today} required />
        </div>
        
        <Select placeholder="Selecciona un producto" options={products} onChange={handleProductChange} value={product} isClearable />
        
        <h3>Total a Pagar: {formatPrice(totalAmount)}</h3>
        <button type="submit">REALIZAR</button>
      </form>

      {showConfirmModal && (
        <div className="modal">
        <div className="modal-content">
          <h3 className="modal-title">CONFIRMACIÓN DEL PEDIDO</h3>
          <hr className="modal-divider" />
        <div className="modal-details">
          {loading ? (
        <div className="spinner">Procesando...</div>
        ) : (
          <>
            <p><strong>Cliente:</strong> {firstName} {lastName}</p>
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
            <p><strong>Fecha Deseada para la Entrega:</strong> {order.deliveryDate}</p>
            <p><strong>Producto Seleccionado:</strong> {product?.label}</p>
            <p><strong>Total a Pagar:</strong> {formatPrice(totalAmount)}</p>
          </>
        )}
      </div>

      {!loading && (
        <div className="button-container">
          <button className="cancel-button" onClick={handleCancel}>CANCELAR</button>
          <button className="confirm-button" onClick={handleConfirm}>CONFIRMAR</button>
        </div>
      )}
    </div>
  </div>
)}
  </div>
)}

export default PedidoForm;