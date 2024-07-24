import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Función para formatear el precio en formato local
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(price);
};

// Componente funcional PedidoForm para el formulario de realización de pedidos
const PedidoForm = () => {
  // Estado para almacenar los datos del pedido
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

  // Cargar la lista de productos al montar el componente
  useEffect(() => {
    axios.get('/api/products') // Cambia esto por la ruta correcta para obtener productos
      .then(response => {
        setProducts(response.data);
      })
      .catch(error => {
        console.error('Error cargando productos:', error);
      });
  }, []);

  // Función para manejar la selección de producto y actualizar el totalAmount
  const handleProductChange = (e) => {
    const selectedProductId = e.target.value;
    setProductId(selectedProductId);
    const selectedProduct = products.find(product => product._id === selectedProductId);
    if (selectedProduct) {
      setTotalAmount(selectedProduct.price);
    } else {
      setTotalAmount(0);
    }
  };

  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevenir comportamiento por defecto del formulario

    // Petición POST a la API para realizar el pedido con los datos actuales
    axios.post('/api/orders/realizar', {
      firstName,
      lastName,
      email,
      phone,
      address,
      paymentMethod,
      deliveryDate,
      products: [productId],
      totalAmount
    })
      .then(response => {
        // Manejar la respuesta exitosa de la API (pedido realizado)
        console.log('Pedido realizado:', response.data);
        alert('¡Pedido realizado exitosamente!');
      })
      .catch(error => {
        // Manejar errores en caso de que falle la petición POST
        console.error('Error realizando pedido:', error);
        alert('Ocurrió un error al realizar el pedido. Por favor, intenta nuevamente.');
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Formulario</h1>
      <h2>Realizar Nuevo Pedido</h2>
      <input type="text" placeholder="Nombre" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
      <input type="text" placeholder="Apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
      <input type="email" placeholder="Correo Electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="tel" placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      <input type="text" placeholder="Dirección" value={address} onChange={(e) => setAddress(e.target.value)} required />
      <input type="text" placeholder="Método de Pago" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required />
      <input type="date" placeholder="Fecha de Entrega" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} required />
      <select name="productId" onChange={handleProductChange} required>
        <option value="">Selecciona un producto</option>
        {products.map(product => (
          <option key={product._id} value={product._id}>
            {product.name} - {formatPrice(product.price)}
          </option>
        ))}
      </select>
      <p><strong>Total a pagar:</strong> {formatPrice(totalAmount)}</p>
      <button type="submit">Realizar Pedido</button>
    </form>
  );
};

// Exportar el componente PedidoForm para que pueda ser utilizado en otros archivos
export default PedidoForm;