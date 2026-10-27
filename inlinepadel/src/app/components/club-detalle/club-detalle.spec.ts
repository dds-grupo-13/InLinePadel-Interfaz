import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AccionesLobby } from '../../services/acciones-lobby';
import { AuthService } from '../../services/auth';
import { ClubService } from '../../services/club';
import { LobbyService } from '../../services/lobby';
import { ToastService } from '../../services/toast';
import { TurnoService } from '../../services/turno';
import { ZonaService } from '../../services/zona';
import { lobby } from '../../testing/datos';
import { ClubDetalle } from './club-detalle';


function montar(unirse: () => Promise<boolean>) {
  const getAll = vi.fn().mockReturnValue(of({ count: 1, next: null, previous: null, results: [lobby()] }));
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: ClubService, useValue: { get: () => of({ id: 1, zona: 1, denominacion: 'Club', direccion: 'Calle 1' }) } },
      { provide: ZonaService, useValue: { getAll: () => of([]) } },
      { provide: LobbyService, useValue: { getAll, resumenPorClub: () => of([]) } },
      { provide: TurnoService, useValue: { buscar: () => of([]) } },
      { provide: AccionesLobby, useValue: { unirse } },
      { provide: AuthService, useValue: { usuarioActual: () => ({ id: 99 }) } },
      { provide: ToastService, useValue: { ok: vi.fn(), error: vi.fn() } },
    ],
  });
  const fixture = TestBed.createComponent(ClubDetalle);
  fixture.componentRef.setInput('id', '1');
  fixture.detectChanges();
  return { componente: fixture.componentInstance, getAll };
}

describe('ClubDetalle', () => {
  it('después de un intento de unirse que pide refrescar (409/404) vuelve a pedir la lista', async () => {
    const { componente, getAll } = montar(() => Promise.resolve(true));
    expect(getAll).toHaveBeenCalledTimes(1);
    await componente.unirse(lobby());
    expect(getAll).toHaveBeenCalledTimes(2);
  });

  it('si no hay nada que refrescar no vuelve a pedir la lista', async () => {
    const { componente, getAll } = montar(() => Promise.resolve(false));
    await componente.unirse(lobby());
    expect(getAll).toHaveBeenCalledTimes(1);
  });
});
