// src/components/ProductoForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { NumericFormat } from 'react-number-format'; // Importar NumericFormat
import FormPage from './FormPage';

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
  const [success, setSuccess] = useState('');

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Limpiar errores previos
    setSuccess('');

    const API_URL = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, '');
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

    try {
      await axios.post(`${API_URL}/api/products/agregar`, {
        name,
        description,
        category,
        price,
        quantity,
        imageUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('El producto quedó agregado al inventario.');
      setName('');
      setDescription('');
      setCategory('');
      setPrice('');
      setQuantity('');
      setImageUrl('');
    } catch (requestError) {
      const errorMsg = requestError.response?.data?.message || 'Ocurrió un error al agregar el producto. Por favor, intenta nuevamente.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPage eyebrow="ADMINISTRACIÓN DE INVENTARIO" title="Agregar un producto" description="Completa la ficha para que el equipo y los clientes encuentren información clara y confiable." className="evh-form-page-wide">
    <form className="evh-form evh-product-form" onSubmit={handleSubmit}>
      <div className="evh-form-grid">
      <div className="evh-form-field">
        <label htmlFor="product-name">Nombre del producto</label>
        <input id="product-name" type="text" placeholder="Ej. Refrigerador No Frost" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
      </div>
      <div className="evh-form-field">
        <label htmlFor="product-category">Categoría</label>
        <input id="product-category" type="text" placeholder="Ej. Refrigeración" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={80} required />
      </div>
      <div className="evh-form-field evh-form-field-wide">
        <label htmlFor="product-description">Descripción</label>
        <textarea id="product-description" placeholder="Describe sus características principales" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={4} required />
      </div>
      <div className="evh-form-field">
        <label htmlFor="product-price">Precio (COP)</label>
        <NumericFormat
          id="product-price"
          name="price"
          value={price}
          thousandSeparator="."
          decimalSeparator=","
          decimalScale={2}
          allowNegative={false}
          prefix="$ "
          onValueChange={(values) => setPrice(values.value)}
          placeholder="0,00"
          className="price-input"
          required
        />
      </div>
      <div className="evh-form-field">
        <label htmlFor="product-quantity">Unidades disponibles</label>
        <input id="product-quantity" type="number" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="0" max="1000000" step="1" />
      </div>
      <div className="evh-form-field evh-form-field-wide">
        <label htmlFor="product-image">Imagen del producto</label>
        <input id="product-image" type="url" placeholder="https://sitio.com/imagen.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required />
        <span className="evh-field-hint">Usa un enlace público a una imagen JPG, PNG o GIF.</span>
      </div>
      </div>
      <button className="evh-form-submit" type="submit" disabled={loading}>{loading ? 'Guardando producto…' : 'Agregar al inventario'}</button>
      {loading && <div className="evh-form-feedback" role="status">Guardando los datos del producto…</div>}
      {error && <p className="evh-form-feedback is-error" role="alert">{error}</p>}
      {success && <p className="evh-form-feedback is-success" role="status">{success}</p>}
    </form>
    </FormPage>
  );
};

export default ProductoForm;
