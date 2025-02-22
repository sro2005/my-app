import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select'; // Importa React-Select
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

// Función para formatear el precio en formato local
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(price);
};

// Función para obtener la fecha de hoy en Colombia en formato YYYY-MM-DD
const getColombianToday = () => {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
};

// Dentro de tu componente, antes de renderizar:
const today = getColombianToday();

const PedidoForm = () => {
  const [customerData, setCustomerData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

const { user } = useContext(AuthContext);
const userId = user?._id;  // Usar userId desde el contexto 
  
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null); // Cambiado a objeto para React-Select
  const [deliveryDate, setDeliveryDate] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null); // Cambiado a objeto para React-Select
  const [totalAmount, setTotalAmount] = useState(0);
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [sameRegisteredNumber, setSameRegisteredNumber] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null); // Estado para guardar la información del pedido
  const navigate = useNavigate();

  useEffect(() => {
    const savedCustomerData = localStorage.getItem('userData');
    if (savedCustomerData) {
      try {
        const userData = JSON.parse(savedCustomerData);
        setCustomerData({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          phone: userData.phone || "",
        });
      } catch (error) {
        console.error('Error al analizar los datos del cliente desde localStorage:', error);
      }
    }
  }, []);

    // Cargar productos disponibles filtrados según las preferencias del usuario
    useEffect(() => {
      const API_URL = process.env.REACT_APP_API_BASE_URL;
      const token = localStorage.getItem('authToken');
  
      // Si hay token y el usuario tiene preferencias, usamos el endpoint filtrado
      const endpoint =
        token && user && user.preferences && user.preferences.length > 0
          ? `${API_URL}/api/products/preferences`
          : `${API_URL}/api/products`;
  
      axios.get(endpoint, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
        .then(response => {
          setAvailableProducts(response.data.map(product => ({
            value: product._id,
            label: (
              <span>
                <strong>Producto:</strong> {product.name} | <strong>Categoría:</strong> {product.category} | <strong>Stock:</strong> {product.quantity} unidades
              </span>
            ),
            price: product.price
          })));
        })
        .catch(error => console.error('Error cargando productos:', error));
    }, [user]);

  // Maneja el cambio de selección de producto
  const handleProductChange = (selectedOption) => {
    setSelectedProduct(selectedOption);
    if (!selectedOption) {
      setTotalAmount(0);
    } else if (selectedOption.price > 0) {
      setTotalAmount(selectedOption.price);
    }
  };  

  // Maneja el cambio en el método de pago
  const handlePaymentMethodChange = (selectedOption) => {
    setPaymentMethod(selectedOption);
    setAccountNumber("");
    setBankName("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();   

    // Usamos el userId directamente aquí, ya que ya lo obtuvimos arriba
    console.log("userId desde el contexto:", userId);

    // Validación antes de enviar el pedido
    if (!customerData.firstName || !customerData.lastName || !customerData.email || !customerData.phone || !address || !paymentMethod || !deliveryDate || !selectedProduct || totalAmount <= 0) {
     alert("Por favor, complete todos los campos correctamente.");
     return;
    }

    // Validación de métodos de pago
    if ((paymentMethod.value === "Tarjeta de Crédito" || paymentMethod.value === "Tarjeta de Débito") && (!bankName || !accountNumber)) {
      alert("Por favor, ingrese los datos de la cuenta bancaria.");
      return;
    }
    
    // Validación para Nequi, Daviplata y Transfiya
    if ((paymentMethod.value === "Nequi" || paymentMethod.value === "Daviplata" || paymentMethod.value === "Transfiya")) {
      if (!sameRegisteredNumber && !accountNumber) { // Si el número no es el mismo registrado y no se ingresa un número de cuenta o celular
        alert("Por favor, ingrese el número de cuenta o celular.");
        return;
      }
    }

    const newOrder = {
      userId, // Añadimos el userId al pedido
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      email: customerData.email,
      phone: customerData.phone,
      address,
      paymentMethod: paymentMethod.value,
      deliveryDate,
      products: [{ productId: selectedProduct.value, quantity: 1 }],
      totalAmount,
      sameRegisteredNumber, 
    };

    // Incluir bankName solo si no es una cadena vacía
    if (bankName.trim() !== "") {
    newOrder.bankName = bankName;
    }

    // Agregar accountNumber solo si no es una cadena vacía
    if (accountNumber.trim() !== "") {
    newOrder.accountNumber = accountNumber;
    }

    // Verificar el pedido antes de continuar
    console.log('Datos del pedido antes de la confirmación:', newOrder);
    
    setOrder(newOrder); // Guardamos el pedido en el estado
    setShowConfirmModal(true); // Mostramos el modal de confirmación
  };

  const handleConfirm = () => {
    const API_URL = process.env.REACT_APP_API_BASE_URL;
    setLoading(true);

    // Obtener el token de localStorage
    const token = localStorage.getItem("authToken");

    // Verificar la estructura del pedido antes de enviarlo
    console.log('Enviando pedido:', order);

    axios.post(`${API_URL}/api/orders/realizar`, order, { 
      headers: { Authorization: `Bearer ${token}` }, // Incluir el token en los headers
      })
      .then(response => {
        alert('¡Pedido realizado exitosamente!');
        // Obtenemos el orderId desde la respuesta de la API
        const orderData = response.data;
        // Actualizamos el estado con el orderId recibido de la respuesta
        setOrder({
          ...order, // Aquí usamos la variable order que contiene los datos del pedido
        orderId: orderData.orderId, // Añadimos el orderId de la respuesta
      });
      // Redirigir a la página de Gestión de Pedidos
      navigate('/listado-pedidos');  // Aquí es donde rediriges después de confirmar el pedido
      })
      .catch(error => {
        console.error('Error realizando pedido:', error);
        alert('Ocurrió un error al realizar el pedido. Por favor, intenta nuevamente.');
      })
      .finally(() => {
        setLoading(false);
        setShowConfirmModal(false);
      });
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  const paymentMethods = [
    { value: 'Tarjeta de Crédito', label: 'Tarjeta de Crédito' },
    { value: 'Tarjeta de Débito', label: 'Tarjeta de Débito' },
    { value: 'Nequi', label: 'Nequi' },
    { value: 'Daviplata', label: 'Daviplata' },
    { value: 'Transfiya', label: 'Transfiya' },
  ];

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h1>Formulario</h1>
        <h2>Realizar Nuevo Pedido</h2>
        <input type="text" placeholder="Nombre(s)" value={customerData.firstName} onChange={(e) => setCustomerData({ ...customerData, firstName: e.target.value })} required disabled className="disabled-input"/>
        <input type="text" placeholder="Apellidos" value={customerData.lastName} onChange={(e) => setCustomerData({ ...customerData, lastName: e.target.value })} required disabled className="disabled-input"/>
        <input type="email" placeholder="Correo Electrónico" value={customerData.email} onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })} required disabled className="disabled-input"/>
        <input type="tel" placeholder="Número de Celular" value={customerData.phone} onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })} required disabled className="disabled-input"/>
        <input type="text" placeholder="Dirección del Domicilio" value={address} onChange={(e) => setAddress(e.target.value)} required />
        <div className="payment-method-container">
        <Select placeholder="Selecciona un método de pago" options={paymentMethods} onChange={handlePaymentMethodChange} value={paymentMethod} isClearable />
        </div>           
        {(paymentMethod && (paymentMethod.value === "Tarjeta de Crédito" || paymentMethod.value === "Tarjeta de Débito")) && (
          <div className="bank-fields">
            <input type="text" placeholder="Nombre del Banco" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
            <input type="text" placeholder="Número de Cuenta" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 20))} maxLength="20" required />
          </div>
        )}
        {(paymentMethod && (paymentMethod.value === "Nequi" || paymentMethod.value === "Daviplata" || paymentMethod.value === "Transfiya")) && (
          <div className="payment-options">
            <p>¿Es el mismo número registrado?</p>
              <div className="radio-group">
            <label>
              <input type="radio" value="Sí" checked={sameRegisteredNumber === true} onChange={() => setSameRegisteredNumber(true)} />
              Sí
            </label>
            <label>
              <input type="radio" value="No" checked={sameRegisteredNumber === false} onChange={() => setSameRegisteredNumber(false)} />
              No
            </label>
              </div>
            {!sameRegisteredNumber && (
              <input type="text" placeholder="Número de Cuenta" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength="10" required />
            )}
          </div>
        )}
        
        <div className="date-field">
          <label htmlFor="deliveryDate">Fecha deseada para la entrega:</label>
          <input type="date" id="deliveryDate" name="deliveryDate" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} min={today} required />
        </div>
        
        <Select placeholder="Selecciona un producto" options={availableProducts} onChange={handleProductChange} value={selectedProduct} isClearable />
        
        <h3>Total a Pagar: {formatPrice(totalAmount)}</h3>
      <button type="submit" disabled={loading || totalAmount === 0}>REALIZAR</button>
    </form>

      {showConfirmModal && (
        <div className="modal" aria-live="assertive">
        <div className="modal-content">
          <h3 className="modal-title">CONFIRMACIÓN DEL PEDIDO</h3>
          <hr className="modal-divider" />
        <div className="modal-details">
          {loading ? (
        <div className="spinner">Procesando...</div>
        ) : (
          <>
            <p><strong>Cliente:</strong> {customerData.firstName} {customerData.lastName}</p>
            <p><strong>Correo Electrónico:</strong> {customerData.email}</p>
            <p><strong>Número de Celular:</strong> {customerData.phone}</p>
            <p><strong>Dirección:</strong> {address}</p>
            <p><strong>Método de Pago:</strong> {paymentMethod ? paymentMethod.value : 'No especificado'}</p>

            {paymentMethod && (paymentMethod.value === "Tarjeta Crédito" || paymentMethod.value === "Tarjeta Débito") && (
              <>
                <p><strong>Banco:</strong> {bankName}</p>
                <p><strong>Número de Cuenta:</strong> {accountNumber}</p>
              </>
            )}
            {(paymentMethod && (paymentMethod.value === "Nequi" || paymentMethod.value === "Daviplata" || paymentMethod.value === "Transfiya")) && (
              <>
                <p><strong>¿Mismo Número Registrado?:</strong> {sameRegisteredNumber ? "Sí" : "No"}</p>
                {!sameRegisteredNumber && <p><strong>Número de Cuenta/Celular:</strong> {accountNumber}</p>}
              </>
            )}
            <p><strong>Fecha Deseada para la Entrega:</strong> {deliveryDate}</p>
            <div>
              <p><strong>Producto Seleccionado:</strong></p>
              <div>{selectedProduct ? selectedProduct.label : 'No seleccionado'}</div>
            </div>
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