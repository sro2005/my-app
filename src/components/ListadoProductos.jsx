import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import ShoppingAssistant from './ShoppingAssistant';
import demoProducts from '../../data/demo-products.json';

const categoryIcons = {
  'aires acondicionados': '❄️',
  aspiradoras: '🧹',
  batidoras: '🥣',
  'bocinas inteligentes o parlantes bluetooth': '🔊',
  cafeteras: '☕',
  celulares: '📱',
  'computadores de escritorio': '🖥️',
  'computadores portátiles': '💻',
  'consolas de videojuegos': '🎮',
  estufas: '🔥',
  impresoras: '🖨️',
  lavadoras: '🫧',
  licuadoras: '🥤',
  microondas: '🍲',
  'planchas de ropa': '👔',
  refrigeradores: '🧊',
  sandwicheras: '🥪',
  'secadores de cabello': '💨',
  tablets: '📲',
  televisores: '📺',
  tostadoras: '🍞',
  ventiladores: '🌀'
};

const normalize = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

const getCategoryIcon = (category) => categoryIcons[normalize(category)] || '⚡';
const getProductKey = (product) => product._id || product.id || product.name;
const isPlaceholderImage = (url) => typeof url === 'string' && url.includes('placehold.co');
const formatPrice = (price) => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
}).format(Number(price) || 0);

const ProductCard = ({ product, demoMode, canOrder = false }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const illustrative = demoMode || product.demo === true || isPlaceholderImage(product.imageUrl);
  const showImage = product.imageUrl && !illustrative && !imageFailed;

  return (
    <li className="evh-product-card">
      <div className="evh-product-media">
        {showImage ? (
          <img
            src={product.imageUrl}
            alt={product.name || 'Producto'}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="evh-product-art" role="img" aria-label={'Ilustración de ' + (product.category || 'producto')}>
            {normalize(product.category) === 'lavadoras' ? (
              <svg className="evh-washer-category-icon" viewBox="0 0 80 86" fill="none" aria-hidden="true" focusable="false">
                <rect x="13" y="6" width="54" height="73" rx="8" fill="#EAF4FF" stroke="#294F7D" strokeWidth="4"/>
                <path d="M15 25H65" stroke="#294F7D" strokeWidth="3"/>
                <circle cx="23" cy="16" r="3.5" fill="#E97816"/><circle cx="35" cy="16" r="3" fill="#6EA6D9"/>
                <circle cx="40" cy="51" r="19" fill="#A8D8F6" stroke="#294F7D" strokeWidth="4"/>
                <path d="M27 52C31 43 38 58 48 47C52 44 55 44 58 46" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            ) : <span aria-hidden="true">{getCategoryIcon(product.category)}</span>}
            <small>{product.category || 'Tecnología para el hogar'}</small>
          </div>
        )}
      </div>
      <div className="evh-product-card-body">
        <div className="evh-product-card-topline">
          <span className="evh-product-category">{product.category || 'Tecnología para el hogar'}</span>
        </div>
        <h3>{product.name || 'Producto sin nombre'}</h3>
        <p className="evh-product-description">{product.description || 'Consulta las características de este producto.'}</p>
        <div className="evh-product-card-bottom">
          <div>
            <span className="evh-product-price-label">{illustrative ? 'Precio de referencia' : 'Precio'}</span>
            <strong className="evh-product-price">{formatPrice(product.price)}</strong>
          </div>
          <span className={'evh-stock-pill ' + (illustrative ? 'is-pending' : Number(product.quantity) > 0 ? 'is-available' : 'is-unavailable')}>
            {illustrative ? 'Disponibilidad por confirmar' : Number(product.quantity) > 0 ? 'Disponible' : 'Agotado'}
          </span>
        </div>
        {canOrder && product._id && (
          <Link
            className="evh-product-order-link"
            to={`/pedido-form?productId=${encodeURIComponent(product._id)}`}
          >
            Agregar a pedido <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </li>
  );
};

const ListadoProductos = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('loading');
  const [sourceMessage, setSourceMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const preferenceValues = Array.isArray(user?.preferences) ? user.preferences : [];
  const preferenceSignature = preferenceValues.join('|');
  const canFilterByPreferences = user?.role === 'user' && preferenceValues.length > 0;
  const [showPreferencesOnly, setShowPreferencesOnly] = useState(canFilterByPreferences);

  useEffect(() => {
    setShowPreferencesOnly(canFilterByPreferences);
  }, [user?._id, user?.role, preferenceSignature]);

  useEffect(() => {
    let active = true;
    const apiUrl = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, '');

    const useDemoCatalog = (message) => {
      if (!active) return;
      setProducts(demoProducts);
      setSource('demo');
      setSourceMessage(message);
      setLoading(false);
    };

    const loadProducts = async () => {
      setLoading(true);
      setSourceMessage('');

      if (!apiUrl) {
        useDemoCatalog('No pudimos conectar con el catálogo. La disponibilidad que ves puede no estar actualizada y no podrás registrar un pedido hasta recuperar la conexión.');
        return;
      }

      try {
        // Solicitamos el catálogo completo. Las preferencias se usan como filtro opcional en la interfaz,
        // para no ocultar productos si las categorías guardadas no coinciden con el inventario.
        const response = await axios.get(apiUrl + '/api/products');
        if (!Array.isArray(response.data)) {
          throw new Error('La respuesta de productos no tiene el formato esperado.');
        }
        if (response.data.length === 0) {
          useDemoCatalog('No encontramos productos disponibles en línea en este momento. La selección que ves es solo informativa y no permite registrar un pedido hasta recuperar la disponibilidad.');
          return;
        }
        if (active) {
          setProducts(response.data);
          setSource('live');
          setSourceMessage('');
          setLoading(false);
        }
      } catch {
        useDemoCatalog('No pudimos actualizar el catálogo. La disponibilidad que ves puede no estar actualizada y no podrás registrar un pedido hasta recuperar la conexión.');
      }
    };

    loadProducts();
    return () => { active = false; };
  }, [retryCount]);

  const categories = useMemo(() => Array.from(new Set(
    products.map((product) => String(product.category || '').trim()).filter(Boolean)
  )).sort((a, b) => a.localeCompare(b, 'es')), [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalize(search);
    const normalizedPreferences = new Set(preferenceValues.map(normalize));
    const matchingProducts = products.filter((product) => {
      const matchesSearch = !normalizedSearch || [
        product.name,
        product.description,
        product.category
      ].some((value) => normalize(value).includes(normalizedSearch));
      const matchesCategory = category === 'all' || product.category === category;
      const matchesPreferences = !showPreferencesOnly || normalizedPreferences.has(normalize(product.category));
      return matchesSearch && matchesCategory && matchesPreferences;
    });

    switch (sortBy) {
      case 'price-low':
        return [...matchingProducts].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      case 'price-high':
        return [...matchingProducts].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      case 'name':
        return [...matchingProducts].sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' })
        );
      case 'availability':
        return [...matchingProducts].sort((a, b) =>
          Number(Number(b.quantity) > 0) - Number(Number(a.quantity) > 0)
        );
      default:
        return matchingProducts;
    }
  }, [products, search, category, showPreferencesOnly, preferenceSignature, sortBy]);

  const hasActiveFilters = Boolean(
    search.trim() || category !== 'all' || (canFilterByPreferences && showPreferencesOnly)
  );
  const resetCatalogControls = () => {
    setSearch('');
    setCategory('all');
    setSortBy('featured');
    setShowPreferencesOnly(false);
  };


  if (loading) {
    return (
      <main className="evh-catalog-page evh-catalog-loading" aria-busy="true">
        <div className="evh-loading-panel" role="status" aria-live="polite">
          <span className="evh-loading-mark" aria-hidden="true">EV</span>
          <div className="evh-loading-copy">
            <span className="evh-loading-kicker">DESCUBRE TU PRÓXIMO FAVORITO</span>
            <h2>Preparando el Catálogo</h2>
            <p>Estamos organizando los productos y sus categorías.</p>
            <div className="evh-loading-lines" aria-hidden="true"><span /><span /><span /></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="evh-catalog-page">
      <section className="evh-catalog-heading">
        <div>
          <span className="evh-eyebrow">{user?.role === 'admin' ? 'ESPACIO DE INVENTARIO' : 'DESCUBRE ALGO PARA TU HOGAR'}</span>
          <h1>{user?.role === 'admin' ? 'Catálogo e Inventario' : 'Encuentra tu próximo favorito'}</h1>
          <p>Explora tecnología y electrodomésticos por categoría, busca algo específico o descubre opciones según tus preferencias.</p>
        </div>
        <div className="evh-catalog-count" aria-live="polite">
          <strong>{filteredProducts.length}</strong>
          <span>{filteredProducts.length === 1 ? 'producto visible' : 'productos visibles'}</span>
        </div>
      </section>

      {source === 'demo' && (
        <aside className="evh-catalog-notice" role="status">
          <span className="evh-catalog-notice-icon" aria-hidden="true">i</span>
          <div>
            <strong>Disponibilidad pendiente de verificación</strong>
            <p>{sourceMessage || 'Mostramos la información disponible localmente; la disponibilidad podría no estar actualizada.'}</p>
          </div>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Actualizar</button>
        </aside>
      )}

      <section className="evh-catalog-toolbar" aria-label="Buscar y filtrar productos">
        <label className="evh-catalog-search">
          <svg className="evh-catalog-search-icon" aria-hidden="true" viewBox="0 0 24 24" focusable="false"><circle cx="10.8" cy="10.8" r="6.6" /><path d="m15.7 15.7 4.2 4.2" /></svg>
          <span className="evh-sr-only">Buscar productos</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, categoría…" />
        </label>
        <label className="evh-catalog-category-filter">
          <span>Categoría</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">Todas las categorías</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="evh-catalog-sort-filter">
          <span>Ordenar por</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="featured">Recomendados</option>
            <option value="price-low">Menor precio</option>
            <option value="price-high">Mayor precio</option>
            <option value="name">Nombre (A–Z)</option>
            <option value="availability">Disponibilidad</option>
          </select>
        </label>
        {canFilterByPreferences && (
          <button
            type="button"
            className={'evh-preference-filter ' + (showPreferencesOnly ? 'is-active' : '')}
            aria-pressed={showPreferencesOnly}
            onClick={() => setShowPreferencesOnly((value) => !value)}
          >
            {showPreferencesOnly ? '✓ Solo Mis Preferencias' : 'Filtrar por Mis Preferencias'}
          </button>
        )}
        {(hasActiveFilters || sortBy !== 'featured') && (
          <button type="button" className="evh-catalog-reset" onClick={resetCatalogControls}>
            Restablecer
          </button>
        )}
      </section>

      <div className="evh-catalog-results-bar" aria-live="polite">
        <span>Mostrando <strong>{filteredProducts.length}</strong> de <strong>{products.length}</strong> productos</span>
        {category !== 'all' && <span className="evh-catalog-active-filter">Categoría: {category}</span>}
        {search.trim() && <span className="evh-catalog-active-filter">Búsqueda: “{search.trim()}”</span>}
      </div>

      {showPreferencesOnly && canFilterByPreferences && (
        <div className="evh-preference-summary">
          <span>Preferencias:</span>
          {preferenceValues.map((value) => <span className="evh-preference-chip" key={value}>{value}</span>)}
          <button type="button" onClick={() => setShowPreferencesOnly(false)}>Ver Todo el Catálogo</button>
        </div>
      )}

      {filteredProducts.length > 0 ? (
        <ul className="evh-product-grid" aria-label="Productos del catálogo">
          {filteredProducts.map((product) => (
            <ProductCard
              key={getProductKey(product)}
              product={product}
              demoMode={source === 'demo'}
              canOrder={user?.role === 'user' && source === 'live'}
            />
          ))}
        </ul>
      ) : (
        <section className="evh-catalog-empty" role="status">
          <span aria-hidden="true">⌕</span>
          <h2>No encontramos productos con esos filtros</h2>
          <p>Prueba otra búsqueda o amplía las categorías para ver más opciones.</p>
          <button type="button" className="evh-button evh-button-secondary" onClick={resetCatalogControls}>Limpiar Filtros</button>
        </section>
      )}

      {user?.role !== 'admin' && (
        <div className="evh-catalog-assistant" id="guia-electrovibe">
          <ShoppingAssistant products={products} />
        </div>
      )}

      <p className="evh-catalog-footnote">
        Las preferencias ayudan a filtrar productos, pero puedes volver a ver el catálogo completo cuando quieras. La disponibilidad se revisará antes de confirmar tu pedido.
      </p>
    </main>
  );
};

export default ListadoProductos;
