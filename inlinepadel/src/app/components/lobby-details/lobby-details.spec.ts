import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { Lobby } from '../../models/lobby.model';
import { Invitacion } from '../../models/social.model';
import { AccionesLobby } from '../../services/acciones-lobby';
import { AuthService } from '../../services/auth';
import { ClubService } from '../../services/club';
import { JugadorService } from '../../services/jugador';
import { LobbyService } from '../../services/lobby';
import { SocialService } from '../../services/social';
import { ZonaService } from '../../services/zona';
import { lobby } from '../../testing/datos';
import { LobbyDetails } from './lobby-details';

export function montar(l: Lobby, social: Partial<Record<keyof SocialService, unknown>> = {}, lobbies: Partial<Record<keyof LobbyService, unknown>> = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: LobbyService, useValue: { get: () => of(l), ...lobbies } },
      { provide: ClubService, useValue: { get: () => of({ id: 1, zona: 1, direccion: 'Calle 1' }) } },
      { provide: ZonaService, useValue: { getAll: () => of([]) } },
      { provide: JugadorService, useValue: { obtener: (id: number) => of({ id, nombre: `Jugador ${id}`, username: `j${id}`, posicion: 'DRIVE', zona: null }) } },
      { provide: SocialService, useValue: { invitaciones: () => of([]), contactos: () => of([]), ...social } },
      { provide: AccionesLobby, useValue: {} },
      { provide: AuthService, useValue: { usuarioActual: () => ({ id: 1 }) } },
    ],
  });
  const fixture = TestBed.createComponent(LobbyDetails);
  fixture.componentRef.setInput('id', String(l.id));
  fixture.detectChanges();
  return fixture;
}

const botones = (el: HTMLElement) => [...el.querySelectorAll('button')].map((b) => b.textContent!.trim());

describe('LobbyDetails — acciones según los flags del backend', () => {
  it('muestra Salir y Cancelar solo si el backend los habilita', () => {
    const el: HTMLElement = montar(lobby({ puede_abandonar: true, puede_cancelar: true })).nativeElement;
    expect(botones(el)).toContain('Salir de la partida');
    expect(botones(el)).toContain('Cancelar partida');
  });

  it('en una reserva firme no muestra Salir ni Cancelar aunque sea el capitán', () => {
    const l = lobby({ estado: 'COMPLETO', es_capitan: true, reserva_firme: true, puede_abandonar: false, puede_cancelar: false });
    const el: HTMLElement = montar(l).nativeElement;
    expect(botones(el)).not.toContain('Salir de la partida');
    expect(botones(el)).not.toContain('Cancelar partida');
  });

  it('el capitán de una partida completa antes del cierre puede salir pero no cancelar', () => {
    const l = lobby({ estado: 'COMPLETO', es_capitan: true, puede_abandonar: true, puede_cancelar: false });
    const el: HTMLElement = montar(l).nativeElement;
    expect(botones(el)).toContain('Salir de la partida');
    expect(botones(el)).not.toContain('Cancelar partida');
  });

  it('muestra el aviso de cierre: warn si es firme, info si no', () => {
    const firme: HTMLElement = montar(lobby({ reserva_firme: true, aviso_cierre: 'Reserva firme: ya no se puede bajar nadie.' })).nativeElement;
    expect(firme.querySelector('.alerta.warn')?.textContent).toContain('Reserva firme');
    TestBed.resetTestingModule();
    const abierta: HTMLElement = montar(lobby({ aviso_cierre: 'Podés bajarte hasta el 20/10 a las 17:00.' })).nativeElement;
    expect(abierta.querySelector('.alerta.info')?.textContent).toContain('Podés bajarte');
  });

  it('muestra el motivo de una partida cancelada si el mensaje no lo incluye', () => {
    const l = lobby({ estado: 'CANCELADO', estado_reserva: null, mensaje_reserva: 'Partida cancelada', motivo_cancelacion: 'Cancha inundada', cancelada_por: 'CLUB' });
    const el: HTMLElement = montar(l).nativeElement;
    expect(el.textContent).toContain('Motivo: Cancha inundada');
  });

  it('no repite el motivo cuando el mensaje ya lo trae', () => {
    const l = lobby({ estado: 'CANCELADO', estado_reserva: null, mensaje_reserva: 'Partida cancelada por el club: Cancha inundada', motivo_cancelacion: 'Cancha inundada', cancelada_por: 'CLUB' });
    const el: HTMLElement = montar(l).nativeElement;
    expect(el.textContent).not.toContain('Motivo:');
  });
});

export const invitacion = (extra: Partial<Invitacion> = {}): Invitacion => ({
  id: 9, lobby: 1, emisor: 7, receptor: 1, estado: 'PENDIENTE', fecha: '2026-10-20T10:00:00', tipo: 'INVITACION', reemplaza: null, ...extra,
});
