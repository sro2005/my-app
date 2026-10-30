import LoadingBrandMark from './LoadingBrandMark';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import ShoppingAssistant from './ShoppingAssistant';
import demoProducts from '../../data/demo-products.json';
import { formatCop as formatPrice } from '../utils/currency';

const normalize = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

const categoryDrawings = {
  'aires acondicionados': <><rect x="9" y="20" width="62" height="28" rx="7"/><path d="M17 40h46M29 53v15m22-15v15m-26-5 4 5 4-5m14 0 4 5 4-5"/></>,
  aspiradoras: <><path d="M21 61h35a8 8 0 1 0-8-8v8M26 61V29a13 13 0 0 1 26 0v17M20 65h41"/><circle cx="35" cy="32" r="6"/></>,
  batidoras: <><path d="M19 26q8-12 24-10l16 10-8 14H29zM38 40v9M49 39v10M26 52q14 15 28 0M20 52q4 23 20 23t20-23"/></>,
  'bocinas inteligentes o parlantes bluetooth': <><rect x="21" y="7" width="38" height="66" rx="15"/><path d="M29 19h22" /><circle cx="40" cy="43" r="12"/><circle cx="40" cy="43" r="4" fill="#E97816" stroke="none"/><path d="M34 63h12"/></>,
  cafeteras: <><path d="M20 19h37v42H20zM57 29h7q9 0 4 14l-11 8M17 69h45M28 12h20"/><path d="M30 40h17M30 49h17"/></>,
  celulares: <><rect x="24" y="5" width="32" height="70" rx="7"/><path d="M24 16h32M24 64h32"/><circle cx="40" cy="69" r="1.7" fill="#E97816" stroke="none"/></>,
  'computadores de escritorio': <><rect x="7" y="10" width="48" height="42" rx="4"/><path d="M31 52v10m-12 5h24M55 25h18v43H55z"/><circle cx="64" cy="58" r="2" fill="#E97816" stroke="none"/><path d="M14 18h34v26H14z"/></>,
  'computadores portatiles': <><rect x="17" y="10" width="46" height="42" rx="4"/><path d="M9 62h62l-6 8H15zM23 18h34v27H23z"/></>,
  'consolas de videojuegos': <><path d="M24 29h32c9 0 15 7 17 21l2 12c1 8-8 11-14 6l-9-8H28l-9 8C13 74 4 70 5 62l2-12c2-14 8-21 17-21Z"/><path d="M23 40v16m-8-8h16M55 43h.1M64 53h.1" strokeWidth="4"/><circle cx="55" cy="43" r="2.5" fill="#E97816" stroke="none"/><circle cx="64" cy="53" r="2.5" fill="#E97816" stroke="none"/></>,
  estufas: <><rect x="13" y="21" width="54" height="49" rx="5"/><path d="M13 42h54"/><circle cx="29" cy="32" r="7"/><circle cx="51" cy="32" r="7"/><path d="M24 54h32M24 61h32"/></>,
  impresoras: <><rect x="20" y="9" width="40" height="23" rx="3"/><rect x="12" y="28" width="56" height="31" rx="5"/><path d="M20 50h40v23H20zM55 39h5"/></>,
  lavadoras: <><rect x="15" y="7" width="50" height="66" rx="7"/><path d="M15 26h50"/><circle cx="40" cy="49" r="17"/><path d="M28 49c8-10 14 9 24-2"/><circle cx="25" cy="17" r="2" fill="#E97816" stroke="none"/><circle cx="35" cy="17" r="2"/></>,
  licuadoras: <><path d="M24 12h32l-5 37H29L24 12ZM29 49h22v9H29zM22 65h36v8H22z"/><path d="M30 23c8-4 12 9 21 1M31 58h18"/></>,
  microondas: <><rect x="8" y="19" width="64" height="44" rx="7"/><rect x="16" y="27" width="42" height="28" rx="3"/><path d="M64 30v10m0 7v4M24 14v-4m12 4v-4"/></>,
  'planchas de ropa': <><path d="M12 57q17-22 44-24l11 22v10H12zM29 34V22h22v11M12 65h55"/></>,
  refrigeradores: <><rect x="24" y="6" width="32" height="68" rx="5"/><path d="M24 39h32M49 19v11m0 18v12"/></>,
  sandwicheras: <><path d="M17 46l10-23h28l10 23-8 18H25zM17 46h48M30 53h20"/></>,
  'secadores de cabello': <><path d="M17 28h35l13 12-13 12H17zM31 52l-5 22h17l4-22M9 35h8m-8 12h8"/></>,
  tablets: <><rect x="14" y="5" width="52" height="70" rx="7"/><rect x="20" y="13" width="40" height="52" rx="2"/><circle cx="40" cy="70" r="1.8" fill="#E97816" stroke="none"/></>,
  televisores: <><rect x="7" y="12" width="66" height="48" rx="5"/><path d="M27 72h26M40 60v12M15 20h50v32H15z"/><path d="m24 68 16-8 16 8"/></>,
  tostadoras: <><rect x="18" y="30" width="45" height="38" rx="10"/><path d="M28 30V18h25v12M27 48h27M67 43v16M18 61h45"/></>,
  ventiladores: <><circle cx="40" cy="37" r="7"/><circle cx="40" cy="37" r="29"/><path d="M40 30c-5-17 7-20 10-12l-3 14M47 39c17-6 21 7 12 11l-16-7M38 44c-4 17-18 15-17 6l13-13M40 66v9M25 75h30"/></>,
  other: <><path d="M12 35 40 12l28 23v34H12z"/><path d="M32 69V48h16v21M45 27l-9 14h8l-3 12 13-18h-8l4-8z" fill="#E97816" stroke="#E97816"/></>
};
const CategoryArtwork = ({ category }) => {
  const key = normalize(category);
  const drawing = categoryDrawings[key] || categoryDrawings.other;
  return (
    <svg className="evh-appliance-icon" viewBox="0 0 80 80" fill="none" role="img" aria-label={'Icono de ' + (category || 'producto del hogar')} focusable="false" stroke="#294F7D" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
      {drawing}
    </svg>
  );
};

const getProductKey = (product) => product._id || product.id || product.name;
const isPlaceholderImage = (url) => typeof url === 'string' && url.includes('placehold.co');
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
            <CategoryArtwork category={product.category} />
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
          <span className="evh-loading-mark" aria-hidden="true"><LoadingBrandMark /></span>
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
          <span>{filteredProducts.length === 1 ? 'Producto Visible' : 'Productos Visibles'}</span>
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
