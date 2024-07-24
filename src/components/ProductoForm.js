import React, { useState } from 'react';
import axios from 'axios';

// Componente funcional ProductoForm para agregar un nuevo producto
const ProductoForm = () => {
  // Estado para almacenar los datos del producto que se va a agregar
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Función para manejar cambios en los campos del formulario
  const handleSubmit = (e) => {
    e.preventDefault();

  // Función para manejar el envío del formulario
  axios.post('/api/products/agregar', {
    name,
    description,
    category,
    price,
    quantity,
    imageUrl
  })
  .then(response => {
    console.log('Producto agregado:', response.data);
    alert('¡Producto agregado exitosamente!');
  })
  .catch(error => {
    console.error('Error agregando producto:', error);
    alert('Ocurrió un error al agregar el producto. Por favor, intenta nuevamente.');
  });
};

  // Renderizado del formulario de producto
  return (
    <form onSubmit={handleSubmit}>
      <h1>Formulario</h1>
      <h2>Agregar Nuevo Producto</h2>
      <input type="text" placeholder="Nombre del Producto" value={name} onChange={(e) => setName(e.target.value)} required />
      <input type="text" placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} required />
      <input type="text" placeholder="Categoría" value={category} onChange={(e) => setCategory(e.target.value)} required />
      <input type="number" placeholder="Precio" value={price} onChange={(e) => setPrice(e.target.value)} required />
      <input type="number" placeholder="Cantidad" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
      <input type="text" placeholder="URL de Imagen" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required />
      <button type="submit">AGREGAR</button>
    </form>
  );
};

// Exportar el componente ProductoForm para su uso en otros archivos
export default ProductoForm;

