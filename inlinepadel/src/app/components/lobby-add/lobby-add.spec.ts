import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Turno } from '../../models/club.model';
import { LobbyService } from '../../services/lobby';
import { TurnoService } from '../../services/turno';
import { LobbyAdd } from './lobby-add';

const turno = (id: number): Turno =>
  ({ id, fecha: '2026-10-20', hora_inicio: '20:00:00', duracion: 90, precio: '40000.00', estado: 'LIBRE', cancha: id, cancha_numero: id }) as Turno;

function montar(turnos: Turno[][], crear: () => unknown) {
  const buscar = vi.fn();
  turnos.forEach((t) => buscar.mockReturnValueOnce(of(t)));
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: TurnoService, useValue: { buscar } },
      { provide: LobbyService, useValue: { crear } },
    ],
  });
  const fixture = TestBed.createComponent(LobbyAdd);
  fixture.componentRef.setInput('clubId', 1);
  fixture.detectChanges();
  return { fixture, buscar, componente: fixture.componentInstance };
}

describe('LobbyAdd', () => {
  it('ante un 409 recarga los turnos y conserva el mensaje del backend', () => {
    const mensaje = 'El turno ya fue tomado por otro jugador.';
    const { componente, buscar } = montar([[turno(1), turno(2)], [turno(2)]], () =>
      throwError(() => new HttpErrorResponse({ status: 409, error: { detail: mensaje } })),
    );
    componente.turnoElegido.set(turno(1));
    componente.crear();

    expect(buscar).toHaveBeenCalledTimes(2);
    expect(componente.error()).toBe(mensaje);
    expect(componente.turnos().map((t) => t.id)).toEqual([2]);
    expect(componente.turnoElegido()).toBeNull();
    expect(componente.enviando()).toBe(false);
  });

  it('ante un 400 muestra el mensaje sin recargar los turnos', () => {
    const { componente, buscar } = montar([[turno(1)]], () =>
      throwError(() => new HttpErrorResponse({ status: 400, error: { detail: 'Dato inválido.' } })),
    );
    componente.turnoElegido.set(turno(1));
    componente.crear();

    expect(buscar).toHaveBeenCalledTimes(1);
    expect(componente.error()).toBe('Dato inválido.');
  });
});
