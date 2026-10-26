import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
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

const contactos = [7, 8].map((id) => ({ id, jugador: 1, contacto: id, estado: 'ACEPTADO', fecha: '' }));
const firme = (extra: Partial<Lobby> = {}) =>
  lobby({ estado: 'COMPLETO', reserva_firme: true, puede_abandonar: false, puede_cancelar: false, puede_ceder: true, codigo_reserva: 'ABCD-1234', ...extra });

describe('LobbyDetails — ceder el lugar', () => {
  it('muestra Ceder mi lugar y la pista de que es la única salida en una reserva firme', () => {
    const el: HTMLElement = montar(firme()).nativeElement;
    expect(botones(el).some((t) => t.includes('Ceder mi lugar'))).toBe(true);
    expect(el.textContent).toContain('¿No podés ir? Cedé tu lugar a un contacto.');
  });

  it('no muestra el botón si el backend no habilita la cesión', () => {
    const el: HTMLElement = montar(firme({ puede_ceder: false })).nativeElement;
    expect(botones(el).some((t) => t.includes('Ceder mi lugar'))).toBe(false);
  });

  it('el modal deja elegir un solo contacto y ofrece el lugar a ese', () => {
    const ceder = vi.fn().mockReturnValue(of({}));
    const fixture = montar(firme(), { contactos: () => of(contactos) }, { ceder });
    const c = fixture.componentInstance;
    c.abrirCeder();
    fixture.detectChanges();
    const radios = fixture.nativeElement.querySelectorAll('input[name="receptor-cesion"]');
    expect(radios).toHaveLength(2);
    radios[0].click();
    radios[1].click();
    fixture.detectChanges();
    expect(c.receptorCesion()).toBe(8);
    expect([...radios].filter((r: HTMLInputElement) => r.checked)).toHaveLength(1);
    c.confirmarCesion();
    expect(ceder).toHaveBeenCalledWith(1, 8);
  });

  it('no deja confirmar la cesión sin elegir a alguien', () => {
    const ceder = vi.fn();
    const fixture = montar(firme(), { contactos: () => of(contactos) }, { ceder });
    fixture.componentInstance.abrirCeder();
    fixture.componentInstance.confirmarCesion();
    expect(ceder).not.toHaveBeenCalled();
  });

  it('con una cesión pendiente muestra que espera respuesta en vez del botón', () => {
    const el: HTMLElement = montar(firme({ puede_ceder: false, cesion_pendiente: { id: 5, receptor: 7 } })).nativeElement;
    expect(el.textContent).toContain('Ofreciste tu lugar a');
    expect(el.textContent).toContain('esperando respuesta');
    expect(botones(el).some((t) => t.includes('Ceder mi lugar'))).toBe(false);
  });
});

describe('LobbyDetails — invitación recibida según el tipo', () => {
  const recibida = (tipo: 'INVITACION' | 'CESION') => ({ invitaciones: () => of([invitacion({ tipo, reemplaza: tipo === 'CESION' ? 7 : null })]) });
  const ajena = (extra: Partial<Lobby> = {}) => lobby({ estado: 'COMPLETO', inscripciones: [], puede_abandonar: false, ...extra });

  it('una cesión ofrece tomar el lugar con la reserva confirmada', () => {
    const el: HTMLElement = montar(ajena(), recibida('CESION')).nativeElement;
    expect(el.textContent).toContain('te ofrece su lugar en esta partida (reserva confirmada)');
    expect(botones(el)).toContain('Aceptar y tomar el lugar');
  });

  it('una invitación común mantiene su texto', () => {
    const el: HTMLElement = montar(ajena({ estado: 'EN_FORMACION', privacidad: 'PRIVADO' }), recibida('INVITACION')).nativeElement;
    expect(el.textContent).toContain('te invitó a esta partida');
    expect(botones(el)).toContain('Aceptar invitación');
  });
});

describe('LobbyDetails — avisos de cierre y textos', () => {
  const ajena = (extra: Partial<Lobby> = {}) => lobby({ estado: 'COMPLETO', inscripciones: [], puede_abandonar: false, aviso_cierre: null, ...extra });
  const cesion = { invitaciones: () => of([invitacion({ tipo: 'CESION', reemplaza: 7 })]) };

  it('un no inscripto sin aviso no ve ninguna alerta de cierre', () => {
    const el: HTMLElement = montar(ajena()).nativeElement;
    expect(el.querySelector('.alerta .bi-lock-fill, .alerta .bi-clock-history')).toBeNull();
  });

  it('el receptor de una cesión ve el aviso de reserva firme junto a los botones, una sola vez', () => {
    const aviso = 'Si aceptás, la reserva ya es firme: no vas a poder bajarte.';
    const el: HTMLElement = montar(ajena({ reserva_firme: true, aviso_cierre: aviso }), cesion).nativeElement;
    const acciones = el.querySelector('section[aria-label="Acciones"]')!;
    expect(acciones.textContent).toContain(aviso);
    expect(el.textContent!.split(aviso)).toHaveLength(2);
  });

  it('no promete que el turno se libera solo y dice hasta cuándo hay plazo', () => {
    const el: HTMLElement = montar(lobby({ plazo_limite: '2026-10-21T10:00:00-03:00' })).nativeElement;
    expect(el.textContent).not.toContain('libera solo');
    expect(el.textContent).toContain('Tienen hasta el');
  });
});
