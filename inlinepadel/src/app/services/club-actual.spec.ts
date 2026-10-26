import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { Club } from '../models/club.model';
import { ClubActual } from './club-actual';
import { ClubService } from './club';

describe('ClubActual', () => {
  const clubes = [{ id: 1, denominacion: 'Norte' }, { id: 2, denominacion: 'Sur' }] as Club[];
  let service: ClubActual;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: ClubService, useValue: { todos: () => of(clubes) } }],
    });
    service = TestBed.inject(ClubActual);
  });

  it('usa el primer club si no hay uno elegido', () => {
    service.cargar();
    expect(service.cargado()).toBe(true);
    expect(service.club()?.id).toBe(1);
  });

  it('recuerda el club elegido', () => {
    service.cargar();
    service.elegir(2);
    expect(service.club()?.id).toBe(2);
    expect(localStorage.getItem('club-actual')).toBe('2');
  });

  it('retoma el club guardado al cargar', () => {
    localStorage.setItem('club-actual', '2');
    service.cargar();
    expect(service.club()?.id).toBe(2);
  });

  it('sin clubes no hay club actual', () => {
    expect(service.club()).toBeNull();
  });
});
