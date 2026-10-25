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

  const filtered = useMemo(() => products.filter(product =>
    [product.name, product.category].some(value =>
      String(value || '').toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))
    )
  ), [products, search]);

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
      setActive(null);
      setDraft(null);
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
        <span className="evh-admin-eyebrow">OPERACIONES · INVENTARIO FICTICIO</span>
        <h1>Gestiona cada producto.</h1>
        <p>Actualiza precios ilustrativos y existencias de prueba. Los productos asociados a pedidos conservan su historial.</p>
        <Link className="evh-admin-hero-link" to="/producto-form">Agregar producto</Link>
      </header>
      <div className="evh-admin-inventory-tools">
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
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {!loading && !error && products.length === 0 && <p>No hay productos registrados.</p>}
      {!loading && <div className="evh-admin-inventory-list">
        {filtered.map(product => <article className="evh-admin-product" key={product._id}>
          <div>
            <span className="evh-admin-product-category">{product.category} {product.demo && '· DEMO'}</span>
            <h2>{product.name}</h2>
            <p>{money(product.price)} · {product.quantity} unidades de prueba</p>
          </div>
          <div className="evh-admin-product-actions">
            <button type="button" disabled={busy} onClick={() => beginEdit(product)}>Editar</button>
            <button type="button" disabled={busy} onClick={() => { setPendingDelete(product); setActive(null); setDraft(null); setMessage(''); }}>Eliminar</button>
          </div>
        </article>)}
        {filtered.length === 0 && products.length > 0 && <p>No encontramos productos con ese filtro.</p>}
      </div>}
      {active && draft && <section className="evh-admin-editor" aria-label="Editar producto">
        <h2>Editar: {active.name}</h2>
        <form onSubmit={save}>
          {[
            ['name', 'Nombre', 'text'], ['category', 'Categoría', 'text'],
            ['price', 'Precio ficticio en COP', 'number'], ['quantity', 'Existencias de prueba', 'number'],
            ['imageUrl', 'URL de imagen (opcional)', 'text']
          ].map(([field, label, type]) => <label key={field}>{label}
            <input value={draft[field]} type={type} required={field !== 'imageUrl'} min={type === 'number' ? (field === 'price' ? '0.01' : '0') : undefined} step={type === 'number' ? (field === 'price' ? '0.01' : '1') : undefined}
              onChange={event => setDraft(current => ({ ...current, [field]: event.target.value }))} />
          </label>)}
          <label>Descripción<textarea value={draft.description} maxLength={2000} required onChange={event => setDraft(current => ({ ...current, description: event.target.value }))}/></label>
          <div className="evh-admin-product-actions">
            <button type="submit" disabled={busy}>Guardar cambios</button>
            <button type="button" disabled={busy} onClick={() => { setActive(null); setDraft(null); }}>Cancelar</button>
          </div>
        </form>
      </section>}
      {pendingDelete && <section className="evh-admin-editor" role="alertdialog" aria-modal="true" aria-label="Confirmar eliminación" aria-describedby="inventory-delete-description">
        <h2>Confirmar eliminación</h2>
        <p id="inventory-delete-description">¿Eliminar «{pendingDelete.name}»? No se eliminarán productos que ya estén asociados a pedidos. Esta acción cambia el inventario de demostración.</p>
        <div className="evh-admin-product-actions">
          <button type="button" disabled={busy} onClick={remove}>Confirmar eliminación</button>
          <button type="button" disabled={busy} onClick={() => setPendingDelete(null)}>Conservar producto</button>
        </div>
      </section>}
    </main>
  );
};

export default AdminInventory;
