import { registerLocaleData } from '@angular/common';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import localeEsAr from '@angular/common/locales/es-AR';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { lobby } from '../testing/datos';
import { AccionesLobby } from './acciones-lobby';
import { ConfirmarService } from './confirmar';
import { LobbyService } from './lobby';
import { ToastService } from './toast';

registerLocaleData(localeEsAr, 'es-AR');

function preparar(unirse: () => unknown = () => of({}), confirma = false, otros: Record<string, () => unknown> = {}) {
  const pedirConfirmacion = vi.fn().mockResolvedValue(confirma);
  const error = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      { provide: ConfirmarService, useValue: { pedirConfirmacion } },
      { provide: LobbyService, useValue: { abandonar: () => of({}), cancelar: () => of({}), unirse, ...otros } },
      { provide: ToastService, useValue: { ok: vi.fn(), error } },
    ],
  });
  return { acciones: TestBed.inject(AccionesLobby), pedirConfirmacion, error };
}

describe('AccionesLobby.abandonar', () => {
  it('en una partida completa avisa que la reserva vuelve a provisoria, el código deja de valer y se avisa al club', async () => {
    const { acciones, pedirConfirmacion } = preparar();
    await acciones.abandonar(lobby({ estado: 'COMPLETO', aviso_cierre: 'Podés bajarte hasta el 20/10 a las 17:00.' }));
    const { mensaje } = pedirConfirmacion.mock.calls[0][0];
    expect(mensaje).toContain('vuelve a ser provisoria');
    expect(mensaje).toContain('el código deja de valer');
    expect(mensaje).toContain('se le avisa al club');
    expect(mensaje).toContain('Podés bajarte hasta el 20/10 a las 17:00.');
  });

  it('en una partida en formación solo avisa que el cupo queda libre', async () => {
    const { acciones, pedirConfirmacion } = preparar();
    await acciones.abandonar(lobby());
    const { mensaje } = pedirConfirmacion.mock.calls[0][0];
    expect(mensaje).toContain('Tu cupo queda libre');
    expect(mensaje).not.toContain('provisoria');
  });
});

describe('AccionesLobby.unirse', () => {
  const falla = (status: number, error: unknown) => () => throwError(() => new HttpErrorResponse({ status, error }));

  it('ante un 409 muestra el mensaje del backend y pide refrescar', async () => {
    const { acciones, error } = preparar(falla(409, { detail: 'El partido ya está completo.' }), true);
    expect(await acciones.unirse(lobby(), false)).toBe(true);
    expect(error).toHaveBeenCalledWith('El partido ya está completo.');
  });

  it('ante un 404 explica que es privada o ya no existe y pide refrescar', async () => {
    const { acciones, error } = preparar(falla(404, {}), true);
    expect(await acciones.unirse(lobby(), false)).toBe(true);
    expect(error).toHaveBeenCalledWith('Esta partida es solo por invitación o ya no existe.');
  });

  it('ante un error del servidor no pide refrescar', async () => {
    const { acciones } = preparar(falla(500, {}), true);
    expect(await acciones.unirse(lobby(), false)).toBe(false);
  });

  it('si el usuario no confirma, no llama a la API ni pide refrescar', async () => {
    const unirse = vi.fn();
    const { acciones } = preparar(unirse, false);
    expect(await acciones.unirse(lobby(), false)).toBe(false);
    expect(unirse).not.toHaveBeenCalled();
  });
});

describe('AccionesLobby abandonar/cancelar ante un 409 (plazo vencido)', () => {
  const falla = (status: number) => () => throwError(() => new HttpErrorResponse({ status, error: { detail: 'Venció el plazo.' } }));

  it('abandonar pide refrescar con 409', async () => {
    expect(await preparar(undefined, true, { abandonar: falla(409) }).acciones.abandonar(lobby())).toBe(true);
  });

  it('abandonar no pide refrescar con otros errores', async () => {
    expect(await preparar(undefined, true, { abandonar: falla(500) }).acciones.abandonar(lobby())).toBe(false);
  });

  it('cancelar pide refrescar con 409', async () => {
    expect(await preparar(undefined, true, { cancelar: falla(409) }).acciones.cancelar(lobby())).toBe(true);
  });

  it('cancelar no pide refrescar con otros errores', async () => {
    expect(await preparar(undefined, true, { cancelar: falla(500) }).acciones.cancelar(lobby())).toBe(false);
  });
});
