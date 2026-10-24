import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select'; // Importa React-Select
import { Link } from 'react-router-dom';
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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState('1');
  const [cartItems, setCartItems] = useState([]);
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null); // Estado para guardar la información del pedido
  const [pendingCheckoutOrderId, setPendingCheckoutOrderId] = useState(null);
  const [completedDemoOrderId, setCompletedDemoOrderId] = useState(null);
  const [orderRequestKey, setOrderRequestKey] = useState(null);
  const [productLoadError, setProductLoadError] = useState('');
  const [productLoadNotice, setProductLoadNotice] = useState('');
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

    // Cargar productos disponibles filtrados según las preferencias del usuario.
    // Si no hay productos afines con stock (o falla ese endpoint), usamos el catálogo completo.
    useEffect(() => {
      const API_URL = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, '');
      const token = localStorage.getItem('authToken');

      if (!API_URL) {
        setProductLoadError('El catálogo de productos no está disponible en este momento.');
        return;
      }

      const fullCatalogEndpoint = `${API_URL}/api/products`;
      const usePreferences =
        Boolean(token && user && Array.isArray(user.preferences) && user.preferences.length > 0);
      const endpoint = usePreferences ? `${API_URL}/api/products/preferences` : fullCatalogEndpoint;
      const requestOptions = {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      };
      const purchasable = products => products.filter(product =>
        Number(product.quantity) > 0 &&
        Number.isFinite(Number(product.price)) &&
        Number(product.price) > 0
      );
      const toOptions = products => products.map(product => ({
        value: product._id,
        label: (
          <span>
            {product.demo === true && <strong>[DEMO] </strong>}
            <strong>Producto:</strong> {product.name} | <strong>Categoría:</strong> {product.category} | <strong>Stock:</strong> {product.quantity} unidades
            {product.demo === true && ' (precio y stock de muestra)'}
          </span>
        ),
        price: Number(product.price),
        name: product.name,
        category: product.category,
        stock: Number(product.quantity)
      }));

      const loadCatalog = async () => {
        try {
          let response;
          let notice = '';
          try {
            response = await axios.get(endpoint, requestOptions);
            if (!Array.isArray(response.data)) throw new Error('El catálogo devolvió un formato inesperado.');
          } catch (primaryError) {
            if (!usePreferences) throw primaryError;
            response = await axios.get(fullCatalogEndpoint, requestOptions);
            if (!Array.isArray(response.data)) throw new Error('El catálogo devolvió un formato inesperado.');
            notice = 'No pudimos cargar las recomendaciones; mostramos el catálogo completo.';
          }

          let available = purchasable(response.data);
          if (usePreferences && available.length === 0 && !notice) {
            const fullCatalog = await axios.get(fullCatalogEndpoint, requestOptions);
            if (!Array.isArray(fullCatalog.data)) throw new Error('El catálogo devolvió un formato inesperado.');
            available = purchasable(fullCatalog.data);
            if (available.length > 0) {
              notice = 'No encontramos productos disponibles en tus preferencias; mostramos el catálogo completo.';
            }
          }

          setAvailableProducts(toOptions(available));
          setProductLoadNotice(notice);
          setProductLoadError(available.length === 0
            ? 'No hay productos con existencias disponibles para seleccionar en este momento.'
            : '');
        } catch (error) {
          setAvailableProducts([]);
          setProductLoadNotice('');
          setProductLoadError('No pudimos cargar los productos. Intenta nuevamente más tarde.');
          console.error('Error cargando productos:', error.message);
        }
      };

      loadCatalog();
    }, [user]);

  const handleProductChange = (selectedOption) => {
    setSelectedProduct(selectedOption);
    setSelectedQuantity('1');
    setFormError('');
  };

  const handleAddToCart = () => {
    if (!selectedProduct) {
      setFormError('Selecciona un producto antes de agregarlo al pedido.');
      return;
    }
    const quantity = Number(selectedQuantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      setFormError('La cantidad debe ser un número entero igual o superior a uno.');
      return;
    }
    const existing = cartItems.find(item => item.value === selectedProduct.value);
    const combinedQuantity = (existing?.quantity || 0) + quantity;
    if (combinedQuantity > selectedProduct.stock) {
      setFormError(`Solo hay ${selectedProduct.stock} unidades disponibles de ${selectedProduct.name}.`);
      return;
    }
    setCartItems(current => existing
      ? current.map(item => item.value === selectedProduct.value ? { ...item, quantity: combinedQuantity } : item)
      : [...current, { ...selectedProduct, quantity }]);
    setSelectedProduct(null);
    setSelectedQuantity('1');
    setFormError('');
  };

  const handleCartQuantityChange = (productId, delta) => {
    setCartItems(current => current.map(item => item.value === productId
      ? { ...item, quantity: Math.max(1, Math.min(item.stock, item.quantity + delta)) }
      : item));
    setFormError('');
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems(current => current.filter(item => item.value !== productId));
    setFormError('');
  };

  // Maneja el cambio en el método de pago
  const handlePaymentMethodChange = (selectedOption) => {
    setPaymentMethod(selectedOption);
  };

  const handleSubmit = (e) => {
    e.preventDefault();   
    setFormError('');
    if (pendingCheckoutOrderId) {
      setFormError('Ya existe un pedido pendiente de iniciar pago. Reintenta el pago de ese pedido antes de crear otro.');
      return;
    }
    if (orderRequestKey) {
      setFormError('Hay una solicitud de pedido pendiente de confirmar. Reintenta esa misma solicitud antes de iniciar otra compra.');
      return;
    }

    // Usamos el userId directamente aquí, ya que ya lo obtuvimos arriba

    // Validación antes de enviar el pedido
    if (!customerData.firstName || !customerData.lastName || !customerData.email || !customerData.phone || !address || !paymentMethod || !deliveryDate || cartItems.length === 0 || totalAmount <= 0) {
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
      products: cartItems.map(item => ({ productId: item.value, quantity: item.quantity })),
      totalAmount,
    };

    // Verificar el pedido antes de continuar
    
    setOrder(newOrder); // Guardamos el pedido en el estado
    setShowConfirmModal(true); // Mostramos el modal de confirmación
  };

  const handleConfirm = async () => {
    const API_URL = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, '');
    const token = localStorage.getItem('authToken');
    const requestKey = orderRequestKey ||
      (window.crypto?.randomUUID ? window.crypto.randomUUID() : `evh-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`);
    if (!API_URL || !token) {
      setFormError('No se encontró la URL de la API o la sesión. Vuelve a iniciar sesión e inténtalo de nuevo.');
      setShowConfirmModal(false);
      return;
    }
    setOrderRequestKey(requestKey);

    let createdOrderId = null;
    setLoading(true);
    try {
      const created = await axios.post(`${API_URL}/api/orders/realizar`, order, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': requestKey
        }
      });
      createdOrderId = created.data?.order?._id;
      if (!createdOrderId) throw new Error('El servidor no devolvió el identificador del pedido.');

      // La API confirmó qué pedido corresponde a esta solicitud.
      setOrderRequestKey(null);
      if (order?.paymentMethod === 'Demostración') {
        // El pedido se guarda como SIMULATED en el servidor; nunca se abre Wompi.
        setPendingCheckoutOrderId(null);
        setCompletedDemoOrderId(createdOrderId);
        setSelectedProduct(null);
        setSelectedQuantity('1');
        setCartItems([]);
        setPaymentMethod(null);
        setAddress('');
        setDeliveryDate('');
        setOrder(null);
        setFormError('');
        return;
      }

      // Solo el método Wompi Sandbox inicia un checkout externo.
      setPendingCheckoutOrderId(createdOrderId);
      const checkout = await axios.post(`${API_URL}/api/orders/${createdOrderId}/wompi-checkout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!checkout.data?.checkoutUrl) throw new Error('No se recibió el enlace de pago.');

      setPendingCheckoutOrderId(null);
      window.location.assign(checkout.data.checkoutUrl);
    } catch (error) {
      console.error('No fue posible iniciar el pago:', error.response?.data?.message || error.message);
      if (createdOrderId) {
        setOrderRequestKey(null);
        setPendingCheckoutOrderId(createdOrderId);
      } else {
        const status = error.response?.status;
        const outcomeIsUncertain = !error.response || status >= 500 || [408, 425, 429].includes(status);
        // Reutiliza la clave solo cuando no es posible saber si el servidor llegó
        // a registrar el pedido. Errores definitivos dejan iniciar una nueva solicitud.
        setOrderRequestKey(outcomeIsUncertain ? requestKey : null);
      }
      setFormError(error.response?.data?.message || 'No pudimos confirmar la respuesta del servidor. Reintenta la misma solicitud para evitar duplicar el pedido.');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handleRetryCheckout = async () => {
    const API_URL = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, '');
    const token = localStorage.getItem('authToken');
    if (!pendingCheckoutOrderId || !API_URL || !token) {
      setFormError('No se puede reintentar el pago con la sesión actual. Revisa tus pedidos.');
      return;
    }

    setLoading(true);
    setFormError('');
    try {
      const checkout = await axios.post(
        `${API_URL}/api/orders/${pendingCheckoutOrderId}/wompi-checkout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!checkout.data?.checkoutUrl) throw new Error('No se recibió el enlace de pago.');
      setPendingCheckoutOrderId(null);
      window.location.assign(checkout.data.checkoutUrl);
    } catch (error) {
      console.error('No fue posible reintentar el checkout:', error.response?.data?.message || error.message);
      setFormError(error.response?.data?.message || 'No se pudo reabrir el checkout. Intenta nuevamente sin crear otro pedido.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  const paymentMethods = [
    { value: 'Demostración', label: 'Compra de demostración (sin cobro)' },
    { value: 'Wompi', label: 'Wompi Sandbox (checkout de prueba)' },
  ];

  return (
    <FormPage eyebrow="COMPRA DE DEMOSTRACIÓN" title="Completa tu pedido ficticio" description="Registra una compra simulada dentro del sitio o abre el checkout de prueba de Wompi Sandbox. No se realizan cobros reales." className="evh-checkout-page">
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
          <p>La compra de demostración registra el pedido aquí mismo, sin abrir Wompi ni hacer cobros. Wompi Sandbox es una opción externa independiente, reservada para pruebas.</p>
        </div>
        <div className="evh-form-field">
          <label htmlFor="deliveryDate">Fecha deseada de entrega</label>
          <input type="date" id="deliveryDate" name="deliveryDate" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} min={today} required />
        </div>
        <div className="evh-form-field evh-form-field-wide">
          <label htmlFor="checkout-product">Añade productos a tu pedido</label>
          <Select inputId="checkout-product" placeholder="Busca un producto disponible" options={availableProducts} onChange={handleProductChange} value={selectedProduct} isClearable isDisabled={availableProducts.length === 0} classNamePrefix="evh-select" />
          <div className="evh-cart-add-controls">
            <label htmlFor="checkout-product-quantity">Unidades</label>
            <input id="checkout-product-quantity" type="number" min="1" max={selectedProduct?.stock || 1} step="1" value={selectedQuantity} disabled={!selectedProduct} onChange={(e) => setSelectedQuantity(e.target.value)} />
            <button type="button" onClick={handleAddToCart} disabled={!selectedProduct || loading}>Agregar al pedido</button>
          </div>
          {selectedProduct && <p className="evh-form-feedback">Disponibles para muestra: {selectedProduct.stock} · Precio unitario: {formatPrice(selectedProduct.price)}</p>}
          {productLoadNotice && <p className="evh-form-feedback" role="status">{productLoadNotice}</p>}
          {productLoadError && <p className="evh-form-feedback is-error" role="alert">{productLoadError}</p>}
        </div>
        </div>

        {cartItems.length > 0 && (
          <section className="evh-cart" aria-label="Resumen de productos del pedido">
            <div className="evh-cart-heading"><h3>Tu pedido</h3><span>{cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos distintos'}</span></div>
            <ul className="evh-cart-items">
              {cartItems.map(item => (
                <li key={item.value} className="evh-cart-item">
                  <div className="evh-cart-item-info">
                    <strong>{item.name}</strong>
                    <span>{item.category} · {formatPrice(item.price)} por unidad</span>
                  </div>
                  <div className="evh-cart-quantity" aria-label={`Cantidad de ${item.name}`}>
                    <button type="button" aria-label={`Disminuir cantidad de ${item.name}`} disabled={item.quantity <= 1} onClick={() => handleCartQuantityChange(item.value, -1)}>−</button>
                    <span>{item.quantity}</span>
                    <button type="button" aria-label={`Aumentar cantidad de ${item.name}`} disabled={item.quantity >= item.stock} onClick={() => handleCartQuantityChange(item.value, 1)}>+</button>
                  </div>
                  <strong className="evh-cart-line-total">{formatPrice(item.price * item.quantity)}</strong>
                  <button type="button" className="evh-cart-remove" aria-label={`Quitar ${item.name}`} onClick={() => handleRemoveFromCart(item.value)}>Quitar</button>
                </li>
              ))}
            </ul>
            <p className="evh-cart-note">Productos de demostración: los precios y las existencias son ilustrativos. El servidor volverá a validar la disponibilidad.</p>
          </section>
        )}

        <div className="evh-order-summary">
          <span>Total estimado</span>
          <strong>{formatPrice(totalAmount)}</strong>
          <p>El servidor confirma el precio y la disponibilidad antes de crear el pedido.</p>
        </div>
        <button className="evh-form-submit" type="submit" disabled={loading || cartItems.length === 0 || totalAmount === 0 || !paymentMethod || Boolean(pendingCheckoutOrderId) || Boolean(orderRequestKey)}>{paymentMethod?.value === 'Demostración' ? 'Registrar compra ficticia' : 'Continuar al checkout de prueba'}</button>
        {completedDemoOrderId && (
          <div className="evh-form-feedback is-success" role="status">
            <h3>¡Pedido de demostración creado!</h3>
            <p>Referencia del pedido: <strong>{completedDemoOrderId}</strong></p>
            <p>El pedido quedó registrado como simulado y se actualizó el inventario de demostración. No se realizó ningún cobro ni se contactó a Wompi.</p>
            <p className="evh-form-alternate"><Link to="/listado-pedidos">Ver mis pedidos</Link></p>
            <button type="button" className="evh-form-submit" onClick={() => setCompletedDemoOrderId(null)}>Hacer otro pedido</button>
          </div>
        )}
        {orderRequestKey && !pendingCheckoutOrderId && !loading && order && (
          <div className="evh-form-feedback" role="status">
            <p>No se ha podido confirmar la respuesta del pedido. Reintenta la misma solicitud; el servidor verificará si ya existe.</p>
            <button type="button" className="evh-form-submit" onClick={handleConfirm}>Reintentar la misma solicitud</button>
          </div>
        )}
        {pendingCheckoutOrderId && !loading && (
          <div className="evh-form-feedback" role="status">
            <p>El pedido {pendingCheckoutOrderId} ya está creado. Puedes reintentar el checkout sin reservar inventario nuevamente.</p>
            <button type="button" className="evh-form-submit" onClick={handleRetryCheckout}>Reintentar pago de este pedido</button>
          </div>
        )}
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
            <p>{paymentMethod?.value === 'Demostración' ? 'Esta compra se registrará como demostración, sin pago ni salida del sitio.' : 'Se abrirá el checkout externo de Wompi Sandbox para la prueba.'}</p>

            <p><strong>Fecha Deseada para la Entrega:</strong> {deliveryDate}</p>
            <div>
              <p><strong>Productos del pedido:</strong></p>
              <ul>{cartItems.map(item => <li key={item.value}>{item.name} × {item.quantity} — {formatPrice(item.price * item.quantity)}</li>)}</ul>
            </div>
            <p><strong>Total estimado de la orden:</strong> {formatPrice(totalAmount)}</p>
          </>
        )}
      </div>

      {!loading && (
        <div className="button-container">
          <button className="cancel-button" onClick={handleCancel}>CANCELAR</button>
          <button className="confirm-button" onClick={handleConfirm}>{paymentMethod?.value === 'Demostración' ? 'CONFIRMAR COMPRA FICTICIA' : 'CONTINUAR A WOMPI'}</button>
        </div>
      )}
    </div>
  </div>
)}
  </FormPage>
)}

export default PedidoForm;
