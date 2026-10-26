import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Estado } from './estado';

function pintar(valor: string): HTMLElement {
  const fixture = TestBed.createComponent(Estado);
  fixture.componentRef.setInput('valor', valor);
  fixture.detectChanges();
  return fixture.nativeElement.querySelector('.estado');
}

describe('Estado', () => {
  it('muestra la reserva cumplida', () => {
    const el = pintar('CUMPLIDA');
    expect(el.textContent).toContain('Reserva cumplida');
    expect(el.classList).toContain('off');
  });

  it('muestra tal cual un valor desconocido', () => {
    expect(pintar('OTRO').textContent).toContain('OTRO');
  });
});
