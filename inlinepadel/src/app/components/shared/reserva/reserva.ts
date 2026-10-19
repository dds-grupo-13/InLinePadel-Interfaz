import { Component, computed, input, signal } from '@angular/core';
import { Lobby } from '../../../models/lobby.model';

/** Estado de la reserva con la leyenda del backend: es lo que el jugador necesita ver primero. */
@Component({
  selector: 'app-reserva',
  template: `
    <div class="reserva" [class]="clase()" role="status">
      <i class="bi" [class]="icono()" aria-hidden="true"></i>
      <div>
        <div class="texto">{{ lobby().mensaje_reserva }}</div>
        @if (lobby().codigo_reserva; as codigo) {
          <div class="codigo" aria-label="Código de reserva">
            <span>{{ codigo }}</span>
            <button type="button" class="btn btn-sm btn-tool" (click)="copiar(codigo)">
              <i class="bi bi-clipboard" aria-hidden="true"></i> {{ copiado() ? 'Copiado' : 'Copiar' }}
            </button>
          </div>
          <div class="small mt-2">Presentalo en el club al llegar. El pago se hace en el mostrador.</div>
        }
      </div>
    </div>
  `,
})
export class Reserva {
  readonly lobby = input.required<Pick<Lobby, 'estado_reserva' | 'mensaje_reserva' | 'codigo_reserva'>>();
  protected readonly copiado = signal(false);

  protected readonly clase = computed(() => {
    const e = this.lobby().estado_reserva;
    return e === 'CONFIRMADA' ? 'confirmada' : e === 'PROVISORIA' ? 'provisoria' : 'cancelada';
  });
  protected readonly icono = computed(() => {
    const e = this.lobby().estado_reserva;
    return e === 'CONFIRMADA' ? 'bi-patch-check-fill' : e === 'PROVISORIA' ? 'bi-hourglass-split' : 'bi-x-circle';
  });

  protected async copiar(codigo: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(codigo);
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    } catch {
      // sin permiso de portapapeles: el código queda visible para copiarlo a mano
    }
  }
}
