import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { TurnoOcupacion } from '../../models/club.model';
import { ClubService } from '../../services/club';
import { ClubActual } from '../../services/club-actual';
import { ToastService } from '../../services/toast';
import { TurnoService } from '../../services/turno';
import { hoyIso } from '../../utils/fechas';
import { ClubOcupacion } from './club-ocupacion';

const enHoras = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

const turno = (id: number, reserva: 'PROVISORIA' | 'CONFIRMADA' | 'CUMPLIDA' | null, inicio = enHoras(2)): TurnoOcupacion => ({
  id, fecha: hoyIso(), hora_inicio: '20:00:00', inicio, fin: enHoras(3.5), cancha: 1, cancha_numero: 1, estado: reserva ? 'BLOQUEADO' : 'LIBRE',
  lobby: reserva ? { id: id * 10, estado: 'COMPLETO', vencido: false, privacidad: 'PUBLICO', cupos_ocupados: 4, reserva, codigo_reserva: null } : null,
});

function montar(turnos: TurnoOcupacion[], cancelarPorClub = vi.fn().mockReturnValue(of({}))) {
  const ocupacion = vi.fn().mockReturnValue(of(turnos));
  const ok = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      { provide: ClubActual, useValue: { club: signal({ id: 1 }), cargar: () => {}, clubes: signal([]), cargado: signal(true), error: signal(null), elegir: () => {} } },
      { provide: ClubService, useValue: { ocupacion } },
      { provide: TurnoService, useValue: { cancelarPorClub } },
      { provide: ToastService, useValue: { ok, error: vi.fn() } },
    ],
  });
  const fixture = TestBed.createComponent(ClubOcupacion);
  fixture.detectChanges();
  return { fixture, componente: fixture.componentInstance, cancelarPorClub, ocupacion, ok };
}

const botonesCancelar = (el: HTMLElement) => [...el.querySelectorAll('button')].filter((b) => b.textContent!.trim() === 'Cancelar partida');

describe('ClubOcupacion — cancelación por el club', () => {
  it('ofrece cancelar solo las partidas vigentes que todavía no empezaron', () => {
    const { fixture } = montar([turno(1, 'PROVISORIA'), turno(2, 'CONFIRMADA'), turno(3, 'CUMPLIDA'), turno(4, null)]);
    expect(botonesCancelar(fixture.nativeElement)).toHaveLength(2);
  });

  it('un turno de hoy que ya empezó no ofrece cancelar; uno que todavía no empezó sí', () => {
    const { fixture } = montar([turno(1, 'CONFIRMADA', enHoras(-1)), turno(2, 'CONFIRMADA', enHoras(1))]);
    expect(botonesCancelar(fixture.nativeElement)).toHaveLength(1);
  });

  it('no deja enviar sin motivo ni con un motivo demasiado corto', () => {
    const { componente, cancelarPorClub } = montar([turno(1, 'CONFIRMADA')]);
    componente.abrirCancelacion(turno(1, 'CONFIRMADA'));
    componente.confirmarCancelacion();
    componente.motivo.set('  ab ');
    expect(componente.motivoValido()).toBe(false);
    componente.confirmarCancelacion();
    expect(cancelarPorClub).not.toHaveBeenCalled();
  });

  it('con motivo válido cancela, avisa y recarga la ocupación', () => {
    const { componente, cancelarPorClub, ocupacion, ok } = montar([turno(1, 'CONFIRMADA')]);
    componente.abrirCancelacion(turno(1, 'CONFIRMADA'));
    componente.motivo.set('Cancha inundada por la lluvia');
    componente.confirmarCancelacion();
    expect(cancelarPorClub).toHaveBeenCalledWith(1, 'Cancha inundada por la lluvia');
    expect(ok).toHaveBeenCalled();
    expect(componente.cancelando()).toBeNull();
    expect(ocupacion).toHaveBeenCalledTimes(2);
  });

  it('ante un error muestra el mensaje del backend y deja el modal abierto', () => {
    const error = throwError(() => new HttpErrorResponse({ status: 400, error: ['El turno ya comenzó o ya pasó.'] }));
    const { componente } = montar([turno(1, 'CONFIRMADA')], vi.fn().mockReturnValue(error));
    componente.abrirCancelacion(turno(1, 'CONFIRMADA'));
    componente.motivo.set('Cancha inundada por la lluvia');
    componente.confirmarCancelacion();
    expect(componente.errorCancelacion()).toBe('El turno ya comenzó o ya pasó.');
    expect(componente.cancelando()).not.toBeNull();
    expect(componente.enviando()).toBe(false);
  });
});
