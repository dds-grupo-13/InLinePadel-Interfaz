import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Lobby } from '../../../models/lobby.model';
import { Reserva } from './reserva';

function pintar(estado_reserva: Lobby['estado_reserva']): HTMLElement {
  const fixture = TestBed.createComponent(Reserva);
  fixture.componentRef.setInput('lobby', { estado_reserva, mensaje_reserva: 'Mensaje', codigo_reserva: null });
  fixture.detectChanges();
  return fixture.nativeElement.querySelector('.reserva');
}

describe('Reserva', () => {
  it('la reserva cumplida no se muestra como cancelada ni provisoria', () => {
    const el = pintar('CUMPLIDA');
    expect(el.classList).toContain('cumplida');
    expect(el.classList).not.toContain('cancelada');
    expect(el.classList).not.toContain('provisoria');
    expect(el.querySelector('i')!.classList).toContain('bi-check2-all');
  });

  it('la reserva cumplida ya no pide presentar el código en el club', () => {
    const fixture = TestBed.createComponent(Reserva);
    fixture.componentRef.setInput('lobby', { estado_reserva: 'CUMPLIDA', mensaje_reserva: 'Jugado', codigo_reserva: 'CHK-1' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Presentalo');
  });

  it('mantiene las clases de las otras reservas', () => {
    expect(pintar('CONFIRMADA').classList).toContain('confirmada');
    expect(pintar('PROVISORIA').classList).toContain('provisoria');
    expect(pintar(null).classList).toContain('cancelada');
  });
});
