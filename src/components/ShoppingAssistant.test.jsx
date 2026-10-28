import React from 'react';
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ShoppingAssistant, { buildLocalRecommendation } from './ShoppingAssistant';

afterEach(() => cleanup());

const products = [
  { id: 'fan-1', name: 'Ventilador Breeze', category: 'Ventiladores', description: 'Ventilador compacto para refrescar un ambiente.', price: 120000, quantity: 2 },
  { id: 'vacuum-1', name: 'Aspiradora Clean', category: 'Aspiradoras', description: 'Aspiradora para facilitar la limpieza.', price: 250000, quantity: 3 },
  { id: 'coffee-1', name: 'Cafetera Simple', category: 'Cafeteras', description: 'Cafetera para preparar bebidas calientes.', price: 90000, quantity: 1 },
  { id: 'sold-1', name: 'Ventilador agotado', category: 'Ventiladores', description: 'Producto sin existencias.', price: 80000, quantity: 0 }
];

describe('ShoppingAssistant', () => {
  test('asks a useful clarifying question for the broad comfort shortcut', () => {
    const reply = buildLocalRecommendation('Quiero hacer mi casa más cómoda y no sé por dónde empezar.', products);
    expect(reply).toMatch(/¿qué te gustaría resolver primero/i);
    expect(reply).toMatch(/temperatura agradable/i);
    expect(reply).toMatch(/tiempo de limpieza/i);
    expect(reply).toMatch(/agilizar la cocina/i);
    expect(reply).toMatch(/entretenimiento/i);
  });

  test('the Más comodidad shortcut gets a local response without calling an external API', () => {
    render(<ShoppingAssistant products={products} />);
    fireEvent.click(screen.getByRole('button', { name: /más comodidad/i }));
    const input = screen.getByRole('textbox', { name: /escribe qué necesitas/i });
    expect(input.value).toBe('Quiero hacer mi casa más cómoda y no sé por dónde empezar.');
    fireEvent.click(screen.getByRole('button', { name: /enviar pregunta/i }));
    expect(screen.getByText(/¿qué te gustaría resolver primero/i)).toBeTruthy();
    expect(screen.getByText(/no se envían a servicios externos/i)).toBeTruthy();
  });

  test('recommends a matching available product and excludes out-of-stock items', () => {
    const reply = buildLocalRecommendation('Necesito una aspiradora para limpiar más rápido.', products);
    expect(reply).toContain('Aspiradora Clean');
    expect(reply).not.toContain('Ventilador agotado');
  });

  test('renders an explicit local-only status and makes shortcuts unavailable without products', () => {
    render(<ShoppingAssistant products={[]} />);
    expect(screen.getByText(/orientación local de catálogo/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /más comodidad/i }).disabled).toBe(true);
    expect(screen.getByText(/guía gratuita sin api de ia/i)).toBeTruthy();
  });
});
