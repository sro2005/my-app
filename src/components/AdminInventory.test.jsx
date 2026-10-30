import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import AdminInventory, { editableProduct } from './AdminInventory';
import { formatCop } from '../utils/currency';

vi.mock('axios', () => ({ default: { get: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock('react-router-dom', () => ({ Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a> }));

const item = { _id: 'p1', name: 'Cafetera Demo', description: 'Ejemplo de compra', category: 'Cafeteras',
  price: 100000, quantity: 5, imageUrl: '', demo: true, demoIcon: '☕', catalogVersion: 'v2' };

afterEach(() => { cleanup(); localStorage.clear(); vi.clearAllMocks(); vi.unstubAllEnvs(); });
const initialize = () => {
  vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
  localStorage.setItem('authToken', 'demo-admin');
  axios.get.mockResolvedValue({ data: [item] });
  return render(<AdminInventory />);
};

describe('AdminInventory', () => {
  test('keeps the inventory label, search input and refresh control available together', async () => {
    initialize();
    expect(await screen.findByLabelText('Buscar producto o categoría')).toBeTruthy();
    expect(screen.getByRole('search', { name: 'Buscar en el inventario' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Actualizar Listado' })).toBeTruthy();
    const productMeta = screen.getByText('5 unidades disponibles').parentElement;
    expect(productMeta.className).toBe('evh-admin-product-meta');
    expect(productMeta.querySelector('.evh-admin-product-price')).toBeTruthy();
  });
  test('preserves demonstration metadata when editing', () => {
    expect(editableProduct(item)).toMatchObject({ demo: true, demoIcon: '☕', catalogVersion: 'v2' });
  });
  test('sends updated demo product to admin-only API', async () => {
    axios.put.mockResolvedValue({ data: { product: { ...item, price: 125000.5, quantity: 3 } } });
    initialize();
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    const editor = screen.getByRole('region', { name: 'Editar producto' });
    expect(editor.previousElementSibling.classList.contains('evh-admin-product')).toBe(true);
    expect(editor.previousElementSibling.contains(screen.getByRole('button', { name: 'Editar' }))).toBe(true);
    fireEvent.change(screen.getByLabelText('Precio (COP)'), { target: { value: '125000.5' } });
    fireEvent.change(screen.getByLabelText('Existencias'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }));
    expect(await screen.findByRole('status')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Editar producto' })).toBeTruthy();
    expect(editor.previousElementSibling.querySelector('.evh-admin-product-price').textContent).toBe(formatCop(125000.5));
    expect(axios.put).toHaveBeenCalledWith('https://api.example.test/api/products/p1',
      expect.objectContaining({ price: 125000.5, quantity: 3, demo: true, demoIcon: '☕', catalogVersion: 'v2' }),
      { headers: { Authorization: 'Bearer demo-admin' } });
  });
  test('requires explicit deletion confirmation', async () => {
    axios.delete.mockResolvedValue({ data: { message: 'Eliminado' } });
    initialize();
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Confirmar Eliminación' });
    expect(dialog.previousElementSibling.classList.contains('evh-admin-product')).toBe(true);
    expect(axios.delete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Conservar Producto' }));
    expect(axios.delete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Eliminación' }));
    expect(await screen.findByRole('status')).toBeTruthy();
    expect(axios.delete).toHaveBeenCalledWith('https://api.example.test/api/products/p1',
      { headers: { Authorization: 'Bearer demo-admin' } });
  });
  test('surfaces server rejection when referenced order prevents deletion', async () => {
    axios.delete.mockRejectedValue({ response: { status: 409, data: { message: 'Producto asociado a pedidos existentes.' } } });
    initialize();
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Eliminación' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('Producto asociado a pedidos existentes.')).toBeTruthy();
  });
});
