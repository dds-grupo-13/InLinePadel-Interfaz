import { DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { LobbyService } from '../../../services/lobby';
import { HhmmPipe } from '../../../utils/hhmm.pipe';

/** Enlace con club, día y hora de una partida a partir de su id. */
@Component({
  imports: [RouterLink, DatePipe, HhmmPipe],
  selector: 'app-lobby-resumen',
  template: `
    @let l = lobby();
    @if (l === undefined) {
      …
    } @else if (l === null) {
      <span class="muted">Partida que ya no está disponible</span>
    } @else {
      <a [routerLink]="['/partidas', id()]">
        {{ l.turno_detalle.club_nombre }} · {{ l.turno_detalle.fecha | date: 'EEE d MMM' }}, {{ l.turno_detalle.hora_inicio | hhmm }}
      </a>
    }
  `,
})
export class LobbyResumen {
  readonly id = input.required<number>();
  private readonly api = inject(LobbyService);
  protected readonly lobby = toSignal(
    toObservable(this.id).pipe(switchMap((id) => this.api.get(id).pipe(catchError(() => of(null))))),
    { initialValue: undefined },
  );
}
