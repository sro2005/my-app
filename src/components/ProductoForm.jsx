// src/components/ProductoForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { NumericFormat } from 'react-number-format'; // Importar NumericFormat

// Componente funcional ProductoForm para agregar un nuevo producto
const ProductoForm = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Limpiar errores previos

    const API_URL = process.env.REACT_APP_API_BASE_URL;
    const token = localStorage.getItem('authToken'); // Obtener el token desde localStorage

    // Validación de la API URL y token
    if (!API_URL) {
      setError('La URL de la API no está configurada.');
      setLoading(false);
      return;
    }

    if (!token) {
      setError('No se encontró el token de autenticación.');
      setLoading(false);
      return;
    }

    // Enviar datos al backend
    axios.post(`${API_URL}/api/products/agregar`, {
      name,
      description,
      category,
      price,
      quantity,
      imageUrl
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(() => {
        setLoading(false);
        alert('¡Producto agregado exitosamente!');
      })
      .catch((error) => {
        setLoading(false);
        const errorMsg = error.response?.data?.message || 'Ocurrió un error al agregar el producto. Por favor, intenta nuevamente.';
        setError(errorMsg);
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
          onValueChange={(values) => setPrice(values.value)}
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
        min="1"
      />
      <input
        type="text"
        placeholder="URL de Imagen"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>AGREGAR</button>

      {loading && <div className="spinner">Procesando...</div>}
      {error && <p className="error-message">{error}</p>}
    </form>
  );
};

export default ProductoForm;