import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

const baseUrl = () => (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, '');
const money = amount => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(amount) || 0);

export const editableProduct = product => ({
  name: product.name || '',
  description: product.description || '',
  category: product.category || '',
  price: String(product.price ?? ''),
  quantity: String(product.quantity ?? ''),
  imageUrl: product.imageUrl || '',
  demo: product.demo === true,
  demoIcon: product.demoIcon || '',
  catalogVersion: product.catalogVersion || ''
});

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(null);
  const [draft, setDraft] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } });

  const refresh = useCallback(async () => {
    if (!baseUrl() || !localStorage.getItem('authToken')) {
      setError('La sesión o la conexión con el servidor no están disponibles.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await axios.get(`${baseUrl()}/api/products`, config());
      if (!Array.isArray(response.data)) throw new Error('Catálogo inválido');
      setProducts(response.data);
    } catch {
      setError('No fue posible cargar el inventario. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = useMemo(() => products
    .filter(product =>
      [product.name, product.category].some(value =>
        String(value || '').toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))
      )
    )
    .sort((a, b) => String(a.category || '').localeCompare(String(b.category || ''), 'es')
      || String(a.name || '').localeCompare(String(b.name || ''), 'es')),
  [products, search]);

  const beginEdit = product => {
    setActive(product);
    setDraft(editableProduct(product));
    setPendingDelete(null);
    setError('');
    setMessage('');
  };

  const save = async event => {
    event.preventDefault();
    if (!active || !draft || busy) return;
    const price = Number(draft.price);
    const quantity = Number(draft.quantity);
    if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(quantity) || quantity < 0) {
      setError('El precio debe ser positivo y las unidades deben ser un número entero no negativo.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const payload = { ...draft, price, quantity };
      const response = await axios.put(`${baseUrl()}/api/products/${active._id}`, payload, config());
      if (!response.data?.product) throw new Error('Respuesta de actualización incompleta');
      setProducts(current => current.map(item => item._id === active._id ? response.data.product : item));
      setActive(response.data.product);
      setDraft(editableProduct(response.data.product));
      setMessage('Producto actualizado. Los cambios ya están guardados.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No fue posible guardar el producto.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!pendingDelete || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await axios.delete(`${baseUrl()}/api/products/${pendingDelete._id}`, config());
      setProducts(current => current.filter(item => item._id !== pendingDelete._id));
      setPendingDelete(null);
      setMessage('Producto eliminado del inventario.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No fue posible eliminar el producto.');
      setPendingDelete(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="evh-admin">
      <header className="evh-admin-hero">
        <span className="evh-admin-eyebrow">ADMINISTRACIÓN · INVENTARIO</span>
        <h1>Gestiona cada producto.</h1>
        <p>Consulta existencias, actualiza precios y administra las fichas de producto. El historial de pedidos se conserva.</p>
        <Link className="evh-admin-hero-link" to="/producto-form">Agregar</Link>
      </header>
      <div className="evh-admin-inventory-tools" role="search" aria-label="Buscar en el inventario">
        <label htmlFor="inventory-search">Buscar producto o categoría</label>
        <input id="inventory-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Ej. cafeteras, televisores…" />
        <button type="button" disabled={loading || busy} onClick={refresh}>Actualizar listado</button>
      </div>
      {loading && (
        <div className="evh-loading-panel evh-admin-loading" role="status" aria-live="polite">
          <span className="evh-loading-mark" aria-hidden="true">EV</span>
          <div className="evh-loading-copy">
            <span className="evh-loading-kicker">INVENTARIO</span>
            <h2>Actualizando productos</h2>
            <p>Estamos organizando las categorías y las existencias registradas.</p>
            <div className="evh-loading-lines" aria-hidden="true"><span /><span /><span /></div>
          </div>
        </div>
      )}
      {error && <p role="alert" className="evh-admin-inventory-error">{error}</p>}
      {!loading && error && <button type="button" disabled={busy} onClick={refresh}>Reintentar carga de inventario</button>}
      {message && !active && <p role="status" className="evh-admin-inventory-success">{message}</p>}
      {!loading && !error && products.length === 0 && <p>No hay productos registrados.</p>}
      {!loading && products.length > 0 && <div className="evh-admin-inventory-list">
        {filtered.map(product => (
          <React.Fragment key={product._id}>
            <article className={`evh-admin-product ${active?._id === product._id ? 'is-editing' : ''} ${pendingDelete?._id === product._id ? 'is-pending-delete' : ''}`}>
              <div>
                <span className="evh-admin-product-category">{product.category} {product.demo && '· DEMO'}</span>
                <h2>{product.name}</h2>
                <div className="evh-admin-product-meta">
                  <span className="evh-admin-product-price">{money(product.price)}</span>
                  <span className="evh-admin-product-stock">{product.quantity} unidades disponibles</span>
                </div>
              </div>
              <div className="evh-admin-product-actions">
                <button type="button" disabled={busy} aria-expanded={active?._id === product._id} onClick={() => beginEdit(product)}>Editar</button>
                <button type="button" disabled={busy} aria-expanded={pendingDelete?._id === product._id} onClick={() => { setPendingDelete(product); setActive(null); setDraft(null); setError(''); setMessage(''); }}>Eliminar</button>
              </div>
            </article>
            {active?._id === product._id && draft && (
              <section className="evh-admin-editor evh-admin-editor-inline" aria-label="Editar producto">
                <div className="evh-admin-editor-heading">
                  <h2>Editar: {active.name}</h2>
                  <span>Los cambios se guardarán en este producto.</span>
                </div>
                {message && <p role="status" className="evh-admin-inventory-success">{message}</p>}
                <form onSubmit={save}>
                  {[
                    ['name', 'Nombre', 'text'], ['category', 'Categoría', 'text'],
                    ['price', 'Precio (COP)', 'number'], ['quantity', 'Existencias', 'number'],
                    ['imageUrl', 'URL de imagen (opcional)', 'text']
                  ].map(([field, label, type]) => <label key={field} className={`evh-admin-field evh-admin-field-${field.toLowerCase()}`}>{label}
                    <input value={draft[field]} type={type} required={field !== 'imageUrl'} min={type === 'number' ? (field === 'price' ? '0.01' : '0') : undefined} step={type === 'number' ? (field === 'price' ? '0.01' : '1') : undefined}
                      onChange={event => setDraft(current => ({ ...current, [field]: event.target.value }))} />
                  </label>)}
                  <label className="evh-admin-field evh-admin-field-description">Descripción<textarea value={draft.description} maxLength={2000} required onChange={event => setDraft(current => ({ ...current, [field]: event.target.value }))}/></label>
                  <div className="evh-admin-product-actions">
                    <button type="submit" disabled={busy}>Guardar cambios</button>
                    <button type="button" disabled={busy} onClick={() => { setActive(null); setDraft(null); }}>Cancelar</button>
                  </div>
                </form>
              </section>
            )}
            {pendingDelete?._id === product._id && (
              <section className="evh-admin-editor evh-admin-delete-inline" role="alertdialog" aria-label="Confirmar eliminación" aria-describedby="inventory-delete-description">
                <h2>¿Eliminar este producto?</h2>
                <p id="inventory-delete-description">¿Eliminar «{pendingDelete.name}»? No se eliminarán productos que ya estén asociados a pedidos. Esta acción actualiza el inventario.</p>
                <div className="evh-admin-product-actions">
                  <button type="button" disabled={busy} onClick={remove}>Confirmar eliminación</button>
                  <button type="button" disabled={busy} onClick={() => setPendingDelete(null)}>Conservar producto</button>
                </div>
              </section>
            )}
          </React.Fragment>
        ))}
        {filtered.length === 0 && products.length > 0 && <p>No encontramos productos con ese filtro.</p>}
      </div>}

    </main>
  );
};

export default AdminInventory;
