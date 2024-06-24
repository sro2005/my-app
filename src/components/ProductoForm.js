import React, { useState } from 'react';
import axios from 'axios';

// Componente funcional ProductoForm para agregar un nuevo producto
const ProductoForm = () => {
  // Estado para almacenar los datos del producto que se va a agregar
  const [product, setProduct] = useState({
    name: '',
    description: '',
    catalog: '',
    price: '',
    quantity: '',
    image: ''
  });

  // Función para manejar cambios en los campos del formulario
  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('/api/products', product) // Petición POST para enviar los datos del producto a la API
      .then(response => {
        console.log('Producto agregado:', response.data); // Mostrar mensaje de éxito en la consola
      })
      .catch(error => {
        console.error('Error agregando producto:', error); // Manejar errores si la petición falla
      });
  };

  // Renderizado del formulario de producto
  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="name" placeholder="Nombre del Producto" onChange={handleChange} required />
      <input type="text" name="description" placeholder="Descripción" onChange={handleChange} required />
      <input type="text" name="catalog" placeholder="Catálogo" onChange={handleChange} required />
      <input type="number" name="price" placeholder="Precio" onChange={handleChange} required />
      <input type="number" name="quantity" placeholder="Cantidad" onChange={handleChange} required />
      <input type="text" name="image" placeholder="URL de Imagen" onChange={handleChange} />
      <button type="submit">Agregar Producto</button>
    </form>
  );
};

// Exportar el componente ProductoForm para su uso en otros archivos
export default ProductoForm;

