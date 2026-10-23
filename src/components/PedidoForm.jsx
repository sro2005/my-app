import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select'; // Importa React-Select
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import FormPage from './FormPage';

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
  const [availableProducts, setAvailableProducts] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null); // Estado para guardar la información del pedido
  const [productLoadError, setProductLoadError] = useState('');
  const [formError, setFormError] = useState('');

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
      const API_URL = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, '');
      const token = localStorage.getItem('authToken');

      if (!API_URL) {
        setProductLoadError('El catálogo de productos no está disponible en este momento.');
        return;
      }
  
      // Si hay token y el usuario tiene preferencias, usamos el endpoint filtrado
      const endpoint =
        token && user && user.preferences && user.preferences.length > 0
          ? `${API_URL}/api/products/preferences`
          : `${API_URL}/api/products`;
  
      axios.get(endpoint, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
        .then(response => {
          if (!Array.isArray(response.data)) throw new Error('El catálogo devolvió un formato inesperado.');
          setProductLoadError('');
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
        .catch(error => {
          setAvailableProducts([]);
          setProductLoadError('No pudimos cargar los productos. Intenta nuevamente más tarde.');
          console.error('Error cargando productos:', error.message);
        });
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();   
    setFormError('');

    // Usamos el userId directamente aquí, ya que ya lo obtuvimos arriba

    // Validación antes de enviar el pedido
    if (!customerData.firstName || !customerData.lastName || !customerData.email || !customerData.phone || !address || !paymentMethod || !deliveryDate || !selectedProduct || totalAmount <= 0) {
     setFormError('Revisa los datos del pedido y selecciona un producto disponible.');
     return;
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
    };

    // Verificar el pedido antes de continuar
    
    setOrder(newOrder); // Guardamos el pedido en el estado
    setShowConfirmModal(true); // Mostramos el modal de confirmación
  };

  const handleConfirm = async () => {
    const API_URL = process.env.REACT_APP_API_BASE_URL;
    const token = localStorage.getItem('authToken');
    setLoading(true);
    try {
      const created = await axios.post(`${API_URL}/api/orders/realizar`, order, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orderId = created.data?.order?._id;
      if (!orderId) throw new Error('El servidor no devolvió el identificador del pedido.');
      const checkout = await axios.post(`${API_URL}/api/orders/${orderId}/wompi-checkout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!checkout.data?.checkoutUrl) throw new Error('No se recibió el enlace de pago.');
      window.location.assign(checkout.data.checkoutUrl);
    } catch (error) {
      console.error('No fue posible iniciar el pago:', error.response?.data?.message || error.message);
      setFormError(error.response?.data?.message || 'No pudimos iniciar el pago. No repitas la compra; revisa tus pedidos o inténtalo de nuevo.');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  const paymentMethods = [
    { value: 'Wompi', label: 'Pago seguro con Wompi' },
  ];

  return (
    <FormPage eyebrow="COMPRA SEGURA" title="Completa tu pedido" description="Revisa tus datos, elige lo que necesitas y continúa al pago protegido de Wompi." className="evh-checkout-page">
      <form className="evh-form evh-checkout-form" onSubmit={handleSubmit}>
        <div className="evh-form-grid">
        <div className="evh-form-field"><label htmlFor="checkout-first-name">Nombre</label><input id="checkout-first-name" type="text" autoComplete="given-name" value={customerData.firstName} onChange={(e) => setCustomerData({ ...customerData, firstName: e.target.value })} required disabled className="disabled-input" /></div>
        <div className="evh-form-field"><label htmlFor="checkout-last-name">Apellidos</label><input id="checkout-last-name" type="text" autoComplete="family-name" value={customerData.lastName} onChange={(e) => setCustomerData({ ...customerData, lastName: e.target.value })} required disabled className="disabled-input" /></div>
        <div className="evh-form-field"><label htmlFor="checkout-email">Correo electrónico</label><input id="checkout-email" type="email" autoComplete="email" value={customerData.email} onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })} required disabled className="disabled-input" /></div>
        <div className="evh-form-field"><label htmlFor="checkout-phone">Celular</label><input id="checkout-phone" type="tel" autoComplete="tel" value={customerData.phone} onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })} required disabled className="disabled-input" /></div>
        <div className="evh-form-field evh-form-field-wide">
          <label htmlFor="checkout-address">Dirección de entrega</label>
          <input id="checkout-address" type="text" autoComplete="street-address" placeholder="Calle, número, barrio y ciudad" value={address} onChange={(e) => setAddress(e.target.value)} required />
        </div>
        <div className="payment-method-container">
          <label htmlFor="checkout-payment">Método de pago</label>
          <Select inputId="checkout-payment" placeholder="Selecciona una opción" options={paymentMethods} onChange={handlePaymentMethodChange} value={paymentMethod} isClearable classNamePrefix="evh-select" />
          <p>El pago se completa en el checkout oficial de Wompi. No guardamos datos de tu tarjeta.</p>
        </div>
        <div className="evh-form-field">
          <label htmlFor="deliveryDate">Fecha deseada de entrega</label>
          <input type="date" id="deliveryDate" name="deliveryDate" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} min={today} required />
        </div>
        <div className="evh-form-field evh-form-field-wide">
          <label htmlFor="checkout-product">Producto</label>
          <Select inputId="checkout-product" placeholder="Selecciona un producto disponible" options={availableProducts} onChange={handleProductChange} value={selectedProduct} isClearable isDisabled={availableProducts.length === 0} classNamePrefix="evh-select" />
          {productLoadError && <p className="evh-form-feedback is-error" role="status">{productLoadError}</p>}
        </div>
        </div>

        <div className="evh-order-summary">
          <span>Total estimado</span>
          <strong>{formatPrice(totalAmount)}</strong>
          <p>El servidor confirma el precio y la disponibilidad antes de crear el pedido.</p>
        </div>
        <button className="evh-form-submit" type="submit" disabled={loading || totalAmount === 0}>Continuar al pago seguro</button>
        {formError && <p className="evh-form-feedback is-error" role="alert">{formError}</p>}
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
            <p><strong>Método de pago:</strong> {paymentMethod ? paymentMethod.label : 'No especificado'}</p>
            <p>El pago se completará en el checkout seguro de Wompi.</p>

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
  </FormPage>
)}

export default PedidoForm;
