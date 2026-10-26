import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../environments/environment';
import { TurnoService } from './turno';

describe('TurnoService', () => {
  const url = `${environment.apiUrl}/clubes/turnos/`;
  let service: TurnoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(TurnoService);
    http = TestBed.inject(HttpTestingController);
  });

  it('busca los turnos recorriendo las páginas con los filtros', () => {
    let turnos: unknown[] = [];
    service.buscar({ club: 2, fecha: '2026-10-20', zona: null }).subscribe((t) => (turnos = t));
    const req = http.expectOne((r) => r.url === url);
    expect(req.request.params.get('club')).toBe('2');
    expect(req.request.params.get('fecha')).toBe('2026-10-20');
    expect(req.request.params.has('zona')).toBe(false);
    req.flush({ count: 1, next: null, previous: null, results: [{ id: 9 }] });
    expect(turnos).toEqual([{ id: 9 }]);
  });

  it('marca un turno como no disponible', () => {
    service.noDisponible(4).subscribe();
    expect(http.expectOne(`${url}4/no_disponible/`).request.method).toBe('POST');
  });

  it('publica varios turnos en una sola operación', () => {
    const nuevos = [{ cancha: 1, fecha: '2026-10-20', hora_inicio: '18:00', duracion: 90, precio: 40000 }];
    service.crearMasivo(nuevos as never).subscribe();
    const req = http.expectOne(`${url}crear_masivo/`);
    expect(req.request.body).toEqual(nuevos);
  });
});
