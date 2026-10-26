import { describe, expect, it } from 'vitest';
import { ConfirmarService } from './confirmar';

const pedido = { titulo: 'Cancelar', mensaje: '¿Seguro?' };

describe('ConfirmarService', () => {
  it('resuelve con la respuesta y cierra el diálogo', async () => {
    const s = new ConfirmarService();
    const promesa = s.pedirConfirmacion(pedido);
    expect(s.pedido()).toEqual(pedido);
    s.responder(true);
    expect(await promesa).toBe(true);
    expect(s.pedido()).toBeNull();
  });

  it('un pedido nuevo cancela el anterior', async () => {
    const s = new ConfirmarService();
    const primero = s.pedirConfirmacion(pedido);
    const segundo = s.pedirConfirmacion({ ...pedido, titulo: 'Otro' });
    expect(await primero).toBe(false);
    s.responder(true);
    expect(await segundo).toBe(true);
  });
});
