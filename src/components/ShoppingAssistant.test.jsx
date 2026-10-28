import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import ShoppingAssistant, { buildLocalRecommendation } from './ShoppingAssistant';

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn() }
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('ShoppingAssistant', () => {
  test('asks a clarifying question for a broad comfort request instead of returning an irrelevant fallback', () => {
    const products = [
      { id: 'fan-1', name: 'Ventilador Breeze', category: 'Ventiladores', description: 'Ventilador para refrescar un ambiente.', price: 120000, quantity: 2 },
      { id: 'vacuum-1', name: 'Aspiradora Clean', category: 'Aspiradoras', description: 'Aspiradora para facilitar la limpieza.', price: 250000, quantity: 3 },
      { id: 'coffee-1', name: 'Cafetera Simple', category: 'Cafeteras', description: 'Cafetera para preparar bebidas.', price: 90000, quantity: 1 }
    ];
    const reply = buildLocalRecommendation('Quiero hacer mi casa más cómoda y no sé por dónde empezar.', products);
    expect(reply).toMatch(/¿qué te gustaría resolver primero/i);
    expect(reply).toMatch(/temperatura agradable/i);
    expect(reply).toMatch(/tiempo de limpieza/i);
    expect(reply).toMatch(/agilizar la cocina/i);
    expect(buildLocalRecommendation('Necesito una aspiradora para limpiar más rápido.', products)).toContain('Aspiradora Clean');
  });

  test('the Más comodidad shortcut prepares a focused prompt and produces useful local guidance', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    axios.get.mockResolvedValue({ data: { enabled: false } });
    const products = [
      { id: 'fan-1', name: 'Ventilador Breeze', category: 'Ventiladores', description: 'Ventilador para refrescar un ambiente.', price: 120000, quantity: 2 },
      { id: 'vacuum-1', name: 'Aspiradora Clean', category: 'Aspiradoras', description: 'Aspiradora para facilitar la limpieza.', price: 250000, quantity: 3 },
      { id: 'coffee-1', name: 'Cafetera Simple', category: 'Cafeteras', description: 'Cafetera para preparar bebidas.', price: 90000, quantity: 1 }
    ];
    render(<ShoppingAssistant products={products} />);
    const shortcut = await screen.findByRole('button', { name: /más comodidad/i });
    fireEvent.click(shortcut);
    const input = screen.getByRole('textbox', { name: /escribe qué necesitas/i });
    expect(input.value).toBe('Quiero hacer mi casa más cómoda y no sé por dónde empezar.');
    fireEvent.click(screen.getByRole('button', { name: /enviar pregunta/i }));
    expect(await screen.findByText(/¿qué te gustaría resolver primero/i)).toBeTruthy();
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('provides local catalogue guidance when generative AI is not configured', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    axios.get.mockResolvedValue({ data: { enabled: false } });
    const products = [
      {
        id: 'cafetera-demo',
        name: 'CaféMio Program 12',
        category: 'Cafeteras',
        description: 'Cafetera de goteo programable para doce tazas.',
        price: 229900,
        quantity: 5,
        demo: true
      },
      {
        id: 'portatil-demo',
        name: 'Notebook Work 14',
        category: 'Computadores Portátiles',
        description: 'Computador portátil para estudio y oficina.',
        price: 1899900,
        quantity: 3,
        demo: true
      }
    ];

    render(<ShoppingAssistant products={products} />);

    expect(await screen.findByText(/orientación local de catálogo/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /cocina pequeña/i }).disabled).toBe(false);
    const input = await screen.findByRole('textbox', { name: /escribe qué necesitas/i });
    fireEvent.change(input, { target: { value: 'cafetera para preparar café' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar pregunta/i }));

    expect(await screen.findByText(/CaféMio Program 12/i)).toBeTruthy();
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('sends a product question to the backend only when generative AI is enabled', async () => {
    vi.stubEnv('REACT_APP_API_BASE_URL', 'https://api.example.test');
    axios.get.mockResolvedValue({ data: { enabled: true } });
    axios.post.mockResolvedValue({ data: { reply: 'Para ese espacio, revisa las opciones compactas disponibles.' } });

    render(<ShoppingAssistant />);

    const input = await screen.findByRole('textbox', { name: /escribe qué necesitas/i });
    fireEvent.change(input, { target: { value: 'Busco algo para una cocina pequeña.' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar pregunta/i }));

    await waitFor(() => expect(axios.post).toHaveBeenCalledWith(
      'https://api.example.test/api/assistant/chat',
      { messages: [{ role: 'assistant', content: expect.any(String) }, { role: 'user', content: 'Busco algo para una cocina pequeña.' }] }
    ));
    expect(await screen.findByText(/revisa las opciones compactas disponibles/i)).toBeTruthy();
  });
});
