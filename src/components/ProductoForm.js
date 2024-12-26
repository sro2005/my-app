import React, { useState } from 'react';
import axios from 'axios';
import { NumericFormat } from 'react-number-format'; // Importar NumericFormat

// Componente funcional ProductoForm para agregar un nuevo producto
const ProductoForm = () => {
  // Estado para almacenar los datos del producto que se va a agregar
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();

  // Obtener la URL base de la variable de entorno
  const API_URL = process.env.REACT_APP_API_BASE_URL;
  if (!API_URL) {
    console.warn('La variable REACT_APP_API_BASE_URL no está configurada.');
  }
    // Enviar datos al backend
    axios.post(`${API_URL}/api/products/agregar`, {
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

  return (
    <form onSubmit={handleSubmit}>
      <h1>Formulario</h1>
      <h2>Agregar Nuevo Producto</h2>
      <input
        type="text"
        placeholder="Nombre del Producto"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Categoría"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        required
      />
      <div className="price-container">
        <NumericFormat
          name="price"
          value={price}
          thousandSeparator={true}
          prefix={'$'}
          onValueChange={(values) => {
            const { value } = values;
            setPrice(value);
          }}
          placeholder="Ingrese el precio"
          className="price-input"
          required
        />
      </div>
      <input
        type="number"
        placeholder="Cantidad"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="URL de Imagen"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        required
      />
      <button type="submit">AGREGAR</button>
    </form>
  );
};

// Exportar el componente ProductoForm para su uso en otros archivos
export default ProductoForm;
