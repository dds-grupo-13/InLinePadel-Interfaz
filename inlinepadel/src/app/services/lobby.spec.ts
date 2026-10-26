import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../environments/environment';
import { LobbyService } from './lobby';

describe('LobbyService', () => {
  const url = `${environment.apiUrl}/partidas/lobbies/`;
  let service: LobbyService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(LobbyService);
    http = TestBed.inject(HttpTestingController);
  });

  it('crea la partida con turno y privacidad', () => {
    service.crear(5, 'PRIVADO').subscribe();
    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ turno: 5, privacidad: 'PRIVADO' });
  });

  it('se une a una partida', () => {
    service.unirse(3).subscribe();
    const req = http.expectOne(`${url}3/unirse/`);
    expect(req.request.method).toBe('POST');
  });

  it('valida el check-in con el código de reserva', () => {
    service.checkIn('ABCD-1234').subscribe();
    const req = http.expectOne(`${url}check_in/`);
    expect(req.request.body).toEqual({ codigo_reserva: 'ABCD-1234' });
  });

  it('el resumen por club manda los filtros al endpoint sin paginar', () => {
    service.resumenPorClub({ zona: 2, fecha: '2026-10-20', hora_desde: '18:00', precio_max: 12000, club: null }).subscribe();
    const req = http.expectOne((r) => r.url === `${url}resumen_por_club/`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('zona')).toBe('2');
    expect(req.request.params.get('fecha')).toBe('2026-10-20');
    expect(req.request.params.get('hora_desde')).toBe('18:00');
    expect(req.request.params.get('precio_max')).toBe('12000');
    expect(req.request.params.has('club')).toBe(false);
    expect(req.request.params.has('page')).toBe(false);
  });

  it('el listado repite el estado cuando se piden varios', () => {
    service.getAll({ mios: true, estado: ['JUGADO', 'CANCELADO'], orden: '-inicio' }, 1).subscribe();
    const req = http.expectOne((r) => r.url === url);
    expect(req.request.params.getAll('estado')).toEqual(['JUGADO', 'CANCELADO']);
    expect(req.request.params.get('orden')).toBe('-inicio');
  });

  it('el listado manda la página y omite filtros vacíos', () => {
    service.getAll({}, 2).subscribe();
    const req = http.expectOne((r) => r.url === url);
    expect(req.request.params.get('page')).toBe('2');
  });
});
