import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastService } from './toast';

describe('ToastService', () => {
  let toast: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    toast = new ToastService();
  });
  afterEach(() => vi.useRealTimers());

  it('muestra el aviso y lo quita solo', () => {
    toast.ok('Listo');
    expect(toast.avisos()).toMatchObject([{ tipo: 'ok', texto: 'Listo' }]);
    vi.advanceTimersByTime(5000);
    expect(toast.avisos()).toEqual([]);
  });

  it('los errores duran más que el resto', () => {
    toast.error('Falló');
    vi.advanceTimersByTime(5000);
    expect(toast.avisos()).toHaveLength(1);
    vi.advanceTimersByTime(3000);
    expect(toast.avisos()).toHaveLength(0);
  });

  it('conserva solo los últimos tres avisos', () => {
    ['a', 'b', 'c', 'd'].forEach((t) => toast.info(t));
    expect(toast.avisos().map((a) => a.texto)).toEqual(['b', 'c', 'd']);
  });

  it('cierra un aviso por id', () => {
    toast.info('a');
    toast.info('b');
    toast.cerrar(toast.avisos()[0].id);
    expect(toast.avisos().map((a) => a.texto)).toEqual(['b']);
  });
});
