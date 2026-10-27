import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Invitacion } from '../../models/social.model';
import { AuthService } from '../../services/auth';
import { JugadorService } from '../../services/jugador';
import { LobbyService } from '../../services/lobby';
import { SocialService } from '../../services/social';
import { ToastService } from '../../services/toast';
import { lobby } from '../../testing/datos';
import { Pedidos } from './pedidos';

const inv = (extra: Partial<Invitacion>): Invitacion => ({
  id: 1, lobby: 1, emisor: 7, receptor: 1, estado: 'PENDIENTE', fecha: '2026-10-20T10:00:00', tipo: 'INVITACION', reemplaza: null, ...extra,
});

function montar(recibidas: Invitacion[], aceptarInvitacion = vi.fn().mockReturnValue(of({}))) {
  const ok = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: SocialService, useValue: { invitaciones: (f: { rol: string }) => of(f.rol === 'recibidas' ? recibidas : []), aceptarInvitacion } },
      { provide: LobbyService, useValue: { get: () => of(lobby({ codigo_reserva: 'ABCD-1234' })) } },
      { provide: JugadorService, useValue: { obtener: (id: number) => of({ id, nombre: `Jugador ${id}` }) } },
      { provide: AuthService, useValue: { usuarioActual: () => ({ id: 1 }) } },
      { provide: ToastService, useValue: { ok, error: vi.fn() } },
    ],
  });
  const fixture = TestBed.createComponent(Pedidos);
  fixture.detectChanges();
  return { fixture, ok, aceptarInvitacion };
}

describe('Pedidos — recibidas', () => {
  it('distingue una cesión de una invitación', () => {
    const { fixture } = montar([inv({ id: 1, tipo: 'CESION', reemplaza: 7 }), inv({ id: 2 })]);
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('te ofrece su lugar (reserva confirmada)');
    expect(texto).toContain('te invitó a');
    expect(texto).toContain('Aceptar y tomar el lugar');
  });

  it('al aceptar una cesión avisa con el código de reserva', () => {
    const { fixture, ok } = montar([inv({ tipo: 'CESION', reemplaza: 7 })]);
    fixture.componentInstance.aceptarInvitacion(inv({ tipo: 'CESION', reemplaza: 7 }));
    expect(ok).toHaveBeenCalledWith(expect.stringContaining('ABCD-1234'));
  });
});
