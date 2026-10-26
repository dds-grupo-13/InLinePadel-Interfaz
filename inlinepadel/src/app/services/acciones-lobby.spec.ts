import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import localeEsAr from '@angular/common/locales/es-AR';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { lobby } from '../testing/datos';
import { AccionesLobby } from './acciones-lobby';
import { ConfirmarService } from './confirmar';
import { LobbyService } from './lobby';

registerLocaleData(localeEsAr, 'es-AR');

function preparar() {
  const pedirConfirmacion = vi.fn().mockResolvedValue(false);
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      { provide: ConfirmarService, useValue: { pedirConfirmacion } },
      { provide: LobbyService, useValue: { abandonar: () => of({}) } },
    ],
  });
  return { acciones: TestBed.inject(AccionesLobby), pedirConfirmacion };
}

describe('AccionesLobby.abandonar', () => {
  it('en una partida completa avisa que la reserva vuelve a provisoria, el código deja de valer y se avisa al club', async () => {
    const { acciones, pedirConfirmacion } = preparar();
    await acciones.abandonar(lobby({ estado: 'COMPLETO', aviso_cierre: 'Podés bajarte hasta el 20/10 a las 17:00.' }));
    const { mensaje } = pedirConfirmacion.mock.calls[0][0];
    expect(mensaje).toContain('vuelve a ser provisoria');
    expect(mensaje).toContain('el código deja de valer');
    expect(mensaje).toContain('se le avisa al club');
    expect(mensaje).toContain('Podés bajarte hasta el 20/10 a las 17:00.');
  });

  it('en una partida en formación solo avisa que el cupo queda libre', async () => {
    const { acciones, pedirConfirmacion } = preparar();
    await acciones.abandonar(lobby());
    const { mensaje } = pedirConfirmacion.mock.calls[0][0];
    expect(mensaje).toContain('Tu cupo queda libre');
    expect(mensaje).not.toContain('provisoria');
  });
});
