import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { aParams, traerTodas } from './http';

describe('http', () => {
  it('saltea los filtros vacíos', () => {
    const p = aParams({ club: 3, zona: null, fecha: undefined, q: '', leida: false });
    expect(p.keys().sort()).toEqual(['club', 'leida']);
    expect(p.get('leida')).toBe('false');
  });

  it('repite el parámetro cuando el valor es un arreglo', () => {
    const p = aParams({ estado: ['EN_FORMACION', 'COMPLETO'], mios: true, vacio: [] });
    expect(p.getAll('estado')).toEqual(['EN_FORMACION', 'COMPLETO']);
    expect(p.toString()).toBe('estado=EN_FORMACION&estado=COMPLETO&mios=true');
  });

  it('recorre todas las páginas del listado', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);
    let resultado: number[] = [];
    traerTodas<number>(http, '/api/x/', { club: 1 }).subscribe((r) => (resultado = r));

    const p1 = ctrl.expectOne((r) => r.params.get('page') === '1');
    expect(p1.request.params.get('club')).toBe('1');
    p1.flush({ count: 3, next: '/api/x/?page=2', previous: null, results: [1, 2] });
    ctrl.expectOne((r) => r.params.get('page') === '2').flush({ count: 3, next: null, previous: null, results: [3] });

    expect(resultado).toEqual([1, 2, 3]);
    ctrl.verify();
  });
});
