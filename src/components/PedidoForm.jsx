import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Select from 'react-select'; // Importa React-Select
import { Link, useSearchParams } from 'react-router-dom';
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
const [searchParams] = useSearchParams();
const requestedProductId = searchParams.get('productId');
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
  const confirmationDialogRef = useRef(null);
  const confirmOrderButtonRef = useRef(null);

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

  useEffect(() => {
    if (!showConfirmModal) return undefined;

    const previousActiveElement = document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    confirmOrderButtonRef.current?.focus();

    const handleDialogKeys = event => {
      if (event.key === 'Escape' && !loading) {
        event.preventDefault();
        setShowConfirmModal(false);
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        confirmationDialogRef.current?.querySelectorAll('button:not([disabled]), a[href], input:not([disabled])') || []
      );
      if (focusable.length === 0) {
        event.preventDefault();
        confirmationDialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleDialogKeys);
    return () => {
      document.removeEventListener('keydown', handleDialogKeys);
      document.body.style.overflow = previousBodyOverflow;
      if (previousActiveElement?.isConnected && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    };
  }, [showConfirmModal, loading]);

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
        !requestedProductId && Boolean(token && user && Array.isArray(user.preferences) && user.preferences.length > 0);
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
            <strong>Producto:</strong> {product.name} | <strong>Categoría:</strong> {product.category} | <strong>Disponibles:</strong> {product.quantity} unidades
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

          const options = toOptions(available);
          setAvailableProducts(options);
          setProductLoadNotice(notice);
          setProductLoadError(available.length === 0
            ? 'No hay productos con existencias disponibles para seleccionar en este momento.'
            : '');

          if (requestedProductId) {
            const requestedProduct = options.find(option => option.value === requestedProductId);
            if (requestedProduct) {
              setSelectedProduct(requestedProduct);
              setSelectedQuantity('1');
              setFormError('');
            } else {
              setSelectedProduct(null);
              setFormError('El producto que elegiste ya no tiene existencias o dejó de estar disponible. Elige otra opción del catálogo.');
            }
          }
        } catch (error) {
          setAvailableProducts([]);
          setProductLoadNotice('');
          setProductLoadError('No pudimos cargar los productos. Intenta nuevamente más tarde.');
          console.error('Error cargando productos:', error.message);
        }
      };

      loadCatalog();
    }, [user, requestedProductId]);

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
      const checkoutExpired = error.response?.data?.code === 'WOMPI_CHECKOUT_EXPIRED';
      console.error('No fue posible iniciar el pago:', error.response?.data?.message || error.message);
      if (checkoutExpired) {
        // El backend ya canceló el pedido vencido y liberó el stock; permite confirmar uno nuevo.
        setOrderRequestKey(null);
        setPendingCheckoutOrderId(null);
        setFormError(error.response?.data?.message || 'La sesión de pago venció. Revisa el carrito y confirma un nuevo pedido.');
      } else {
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
      }
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
      if (error.response?.data?.code === 'WOMPI_CHECKOUT_EXPIRED') {
        setPendingCheckoutOrderId(null);
        setFormError(error.response?.data?.message || 'La sesión de pago venció. Revisa el carrito y confirma un nuevo pedido.');
      } else {
        setFormError(error.response?.data?.message || 'No se pudo reabrir el checkout. Intenta nuevamente sin crear otro pedido.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;
    setShowConfirmModal(false);
  };

  const paymentMethods = [
    { value: 'Demostración', label: 'Registrar pedido sin pago' },
    { value: 'Wompi', label: 'Wompi Sandbox' },
  ];

  return (
    <FormPage eyebrow="FINALIZA TU PEDIDO" title="Revisa tu pedido" description="Confirma tus datos, organiza los productos y revisa el total antes de continuar." className="evh-checkout-page">
      <form className="evh-form evh-checkout-form" onSubmit={handleSubmit}>
        <div className="evh-checkout-section-heading">
          <h2>Datos de tu pedido</h2>
          <p>Los datos de contacto provienen de tu cuenta. Revisa la dirección y la fecha de entrega antes de confirmar.</p>
        </div>
        <div className="evh-form-grid">
        <div className="evh-form-field"><label htmlFor="checkout-first-name">Nombre</label><input id="checkout-first-name" type="text" autoComplete="given-name" value={customerData.firstName} onChange={(e) => setCustomerData({ ...customerData, firstName: e.target.value })} required disabled className="disabled-input" /></div>
        <div className="evh-form-field"><label htmlFor="checkout-last-name">Apellidos</label><input id="checkout-last-name" type="text" autoComplete="family-name" value={customerData.lastName} onChange={(e) => setCustomerData({ ...customerData, lastName: e.target.value })} required disabled className="disabled-input" /></div>
        <div className="evh-form-field"><label htmlFor="checkout-email">Correo electrónico</label><input id="checkout-email" type="email" autoComplete="email" value={customerData.email} onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })} required disabled className="disabled-input" /></div>
        <div className="evh-form-field"><label htmlFor="checkout-phone">Celular</label><input id="checkout-phone" type="tel" autoComplete="tel" value={customerData.phone} onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })} required disabled className="disabled-input" /></div>
        <div className="evh-form-field evh-form-field-wide">
          <label htmlFor="checkout-address">Dirección de entrega</label>
          <input id="checkout-address" type="text" autoComplete="street-address" placeholder="Calle, número, barrio y ciudad" value={address} onChange={(e) => setAddress(e.target.value)} required />
        </div>
        <div className="payment-method-container evh-form-field">
          <label htmlFor="checkout-payment">Cómo quieres continuar</label>
          <Select inputId="checkout-payment" placeholder="Selecciona una opción" options={paymentMethods} onChange={handlePaymentMethodChange} value={paymentMethod} isClearable classNamePrefix="evh-select" />
          <p role="note">{!paymentMethod
            ? 'Elige una opción. Revisarás los detalles antes de confirmar.'
            : paymentMethod.value === 'Demostración'
              ? 'El pedido se guardará como demostración sin realizar un cobro real. La fecha y los estados del pedido son ilustrativos; no se coordina una entrega real.'
              : 'El checkout de Wompi Sandbox requiere credenciales de prueba válidas en el backend. No se realizará un cobro real; no introduzcas datos de una tarjeta real.'}</p>
        </div>
        <div className="evh-form-field">
          <label htmlFor="deliveryDate">{paymentMethod?.value === 'Demostración' ? 'Fecha de referencia (solo simulación)' : 'Fecha deseada de entrega'}</label>
          <input type="date" id="deliveryDate" name="deliveryDate" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} min={today} required />
        </div>
        <div className="evh-form-field evh-form-field-wide">
          <label htmlFor="checkout-product">Añade productos a tu pedido</label>
          <Select inputId="checkout-product" placeholder="Busca un producto disponible" options={availableProducts} onChange={handleProductChange} value={selectedProduct} isClearable isDisabled={availableProducts.length === 0} classNamePrefix="evh-select" />
          <div className="evh-cart-add-controls">
            <div className="evh-cart-quantity-field">
              <label htmlFor="checkout-product-quantity">Unidades</label>
              <input id="checkout-product-quantity" type="number" min="1" max={selectedProduct?.stock || 1} step="1" value={selectedQuantity} disabled={!selectedProduct} onChange={(e) => setSelectedQuantity(e.target.value)} />
            </div>
            <button type="button" onClick={handleAddToCart} disabled={!selectedProduct || loading}>Agregar al pedido</button>
          </div>
          {selectedProduct && <p className="evh-form-feedback">Disponibles: {selectedProduct.stock} · Precio unitario: {formatPrice(selectedProduct.price)}</p>}
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
            <p className="evh-cart-note">Revisa el precio y la cantidad de cada producto. La disponibilidad se validará antes de registrar el pedido.</p>
          </section>
        )}

        <div className="evh-order-summary">
          <span>Total estimado</span>
          <strong>{formatPrice(totalAmount)}</strong>
          <p>El servidor confirma el precio y la disponibilidad antes de crear el pedido.</p>
        </div>
        <button className="evh-form-submit" type="submit" disabled={loading || cartItems.length === 0 || totalAmount === 0 || !paymentMethod || Boolean(pendingCheckoutOrderId) || Boolean(orderRequestKey)}>{!paymentMethod ? 'Selecciona cómo continuar' : cartItems.length === 0 || totalAmount === 0 ? 'Añade productos para continuar' : paymentMethod.value === 'Demostración' ? 'Registrar pedido sin pago' : 'Continuar a Wompi Sandbox'}</button>
        {completedDemoOrderId && (
          <div className="evh-form-feedback is-success" role="status">
            <h3>¡Pedido registrado!</h3>
            <p>Referencia del pedido: <strong>{completedDemoOrderId}</strong></p>
            <p>La solicitud quedó registrada en tu cuenta como pedido de demostración. No se ha procesado ningún cobro; la fecha y los estados logísticos son únicamente ilustrativos.</p>
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
            <button type="button" className="evh-form-submit" onClick={handleRetryCheckout}>Reintentar checkout</button>
          </div>
        )}
        {formError && <p className="evh-form-feedback is-error" role="alert">{formError}</p>}
      </form>

      {showConfirmModal && (
        <div className="evh-confirmation-backdrop">
          <section
            ref={confirmationDialogRef}
            className="evh-confirmation-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="evh-confirmation-title"
            aria-describedby="evh-confirmation-description"
            tabIndex={-1}
          >
            <header className="evh-confirmation-header">
              <span className="evh-confirmation-mark" aria-hidden="true">⚡</span>
              <div className="evh-confirmation-title-wrap">
                <span className="evh-eyebrow">REVISIÓN FINAL</span>
                <h2 id="evh-confirmation-title">Confirma tu pedido</h2>
                <p id="evh-confirmation-description">Revisa los productos y la información de entrega antes de continuar.</p>
              </div>
              <button
                type="button"
                className="evh-confirmation-close"
                aria-label="Cerrar revisión del pedido"
                onClick={handleCancel}
                disabled={loading}
              >×</button>
            </header>

            <div className="evh-confirmation-notice" role="note">
              <span className="evh-confirmation-notice-icon" aria-hidden="true">i</span>
              <div>
                <strong>Antes de confirmar</strong>
                <p>{paymentMethod?.value === 'Demostración'
                  ? 'El pedido quedará registrado como demostración, sin realizar un cobro real. La fecha y los estados logísticos son ilustrativos; no se coordina un envío real.'
                  : 'El checkout de Wompi Sandbox requiere credenciales de prueba válidas en el backend. No se realizará un cobro real; no introduzcas datos de una tarjeta real.'}</p>
              </div>
            </div>

            <div className="evh-confirmation-layout">
              <section className="evh-confirmation-details" aria-labelledby="evh-confirmation-delivery-title">
                <h3 id="evh-confirmation-delivery-title">Datos de entrega</h3>
                <dl className="evh-confirmation-facts">
                  <div>
                    <dt>Nombre del destinatario</dt>
                    <dd>{customerData.firstName} {customerData.lastName}</dd>
                  </div>
                  <div>
                    <dt>Celular</dt>
                    <dd>{customerData.phone}</dd>
                  </div>
                  <div className="is-wide evh-confirmation-email">
                    <dt>Correo electrónico</dt>
                    <dd>{customerData.email}</dd>
                  </div>
                  <div className="is-wide">
                    <dt>Dirección de entrega</dt>
                    <dd>{address}</dd>
                  </div>
                  <div>
                    <dt>{paymentMethod?.value === 'Demostración' ? 'Fecha (solo simulación)' : 'Fecha deseada'}</dt>
                    <dd>{deliveryDate}</dd>
                  </div>
                  <div>
                    <dt>Modalidad</dt>
                    <dd>{paymentMethod?.value === 'Demostración' ? 'Pedido sin pago' : 'Wompi · sin cobro real'}</dd>
                  </div>
                </dl>
              </section>

              <aside className="evh-confirmation-summary" aria-labelledby="evh-confirmation-summary-title">
                <div className="evh-confirmation-summary-heading">
                  <h3 id="evh-confirmation-summary-title">Resumen del pedido</h3>
                  <span>{cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}</span>
                </div>
                <ul className="evh-confirmation-products" aria-label="Productos incluidos">
                  {cartItems.map(item => (
                    <li key={item.value}>
                      <div className="evh-confirmation-product-info">
                        <strong>{item.name}</strong>
                        <span>{item.category} · Cantidad: {item.quantity}</span>
                      </div>
                      <strong className="evh-confirmation-line-total">{formatPrice(item.price * item.quantity)}</strong>
                    </li>
                  ))}
                </ul>
                <div className="evh-confirmation-total">
                  <span>Total estimado</span>
                  <strong>{formatPrice(totalAmount)}</strong>
                </div>
                <p className="evh-confirmation-total-note">Importes de referencia. El servidor volverá a validar la disponibilidad antes de registrar el pedido.</p>
              </aside>
            </div>

            {loading && (
              <div className="evh-confirmation-processing" role="status">
                <span className="evh-confirmation-processing-mark" aria-hidden="true">EV</span>
                <span>{paymentMethod?.value === 'Demostración' ? 'Registrando tu pedido…' : 'Abriendo el checkout de Wompi…'}</span>
              </div>
            )}

            <footer className="evh-confirmation-actions">
              <button type="button" className="evh-confirmation-secondary" onClick={handleCancel} disabled={loading}>
                Volver a editar
              </button>
              <button
                ref={confirmOrderButtonRef}
                type="button"
                className="evh-confirmation-primary"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading
                  ? 'Procesando…'
                  : paymentMethod?.value === 'Demostración'
                    ? 'Confirmar pedido'
                    : 'Continuar a Wompi'}
              </button>
            </footer>
          </section>
        </div>
      )}

  </FormPage>
)}

export default PedidoForm;
