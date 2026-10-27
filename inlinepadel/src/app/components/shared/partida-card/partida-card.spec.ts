import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { Lobby } from '../../../models/lobby.model';
import { lobby } from '../../../testing/datos';
import { PartidaCard } from './partida-card';

function pintar(extra: Partial<Lobby>): HTMLElement {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(PartidaCard);
  fixture.componentRef.setInput('lobby', lobby(extra));
  fixture.detectChanges();
  return fixture.nativeElement;
}

describe('PartidaCard', () => {
  it('muestra el chip de reserva firme', () => {
    expect(pintar({ estado: 'COMPLETO', reserva_firme: true }).textContent).toContain('Reserva firme');
  });

  it('no muestra el chip si la reserva no es firme', () => {
    expect(pintar({ estado: 'COMPLETO' }).textContent).not.toContain('Reserva firme');
  });

  it('muestra el aviso de cierre de forma compacta', () => {
    expect(pintar({ aviso_cierre: 'Podés bajarte hasta el 20/10 a las 17:00.' }).textContent).toContain('Podés bajarte hasta');
  });
});
