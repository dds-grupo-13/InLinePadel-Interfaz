import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Lobby } from '../../../models/lobby.model';
import { HhmmPipe } from '../../../utils/hhmm.pipe';
import { capitanDe, sePuedeUnir } from '../../../utils/partidas';
import { Cupos } from '../cupos/cupos';
import { Estado } from '../estado/estado';

/**
 * Resumen de una partida: día y hora, cancha, capitán y ocupación.
 * La acción de unirse solo aparece si la partida está abierta y el jugador puede entrar.
 */
@Component({
  imports: [RouterLink, DatePipe, CurrencyPipe, HhmmPipe, Cupos, Estado],
  selector: 'app-partida-card',
  template: `
    @let l = lobby();
    <article class="partida" [class.mia]="esMia()" [class.invitado]="l.fui_invitado">
      <div>
        <div class="cuando">
          <a class="stretched" [routerLink]="['/partidas', l.id]">
            {{ l.turno_detalle.fecha | date: 'EEE d MMM' }} · {{ l.turno_detalle.hora_inicio | hhmm }}
          </a>
        </div>
        <div class="donde">
          @if (mostrarClub()) { {{ l.turno_detalle.club_nombre }} · }
          Cancha {{ l.turno_detalle.cancha_numero }}
          {{ l.turno_detalle.cancha_tipo === 'TECHADA' ? 'techada' : 'descubierta' }}
          · <span class="id-partida">#{{ l.id }}</span>
        </div>
        <div class="meta">
          <span title="Capitán"><i class="bi bi-person-badge" aria-hidden="true"></i> {{ capitan() }}</span>
          <span title="Jugadores anotados"><i class="bi bi-people" aria-hidden="true"></i> {{ l.cupos_ocupados }}/4</span>
          @if (l.fui_invitado) {
            <span class="marca-invitado"><i class="bi bi-envelope-paper-fill" aria-hidden="true"></i> Invitado</span>
          }
          @if (esMia()) { <span class="estado ok">Ya estás</span> }
        </div>
      </div>
      <app-cupos [inscripciones]="l.inscripciones" [ancho]="96" />
      <div class="pie">
        <div class="d-flex flex-wrap gap-2 align-items-center">
          @if (l.estado === 'EN_FORMACION' || l.estado === 'COMPLETO') {
            <app-estado [valor]="l.estado_reserva ?? l.estado" />
          } @else {
            <app-estado [valor]="l.estado" />
          }
          <app-estado [valor]="l.privacidad" />
          @if (l.estado === 'EN_FORMACION') {
            <span class="muted small">{{ l.cupos_libres === 1 ? 'Falta 1 jugador' : 'Faltan ' + l.cupos_libres + ' jugadores' }}</span>
          }
        </div>
        <div class="d-flex gap-3 align-items-center">
          <span class="precio">{{ l.precio_por_jugador | currency: 'ARS' : 'symbol-narrow' : '1.0-0' }} <small class="muted fw-normal">c/u</small></span>
          @if (puedeUnirse()) {
            <button type="button" class="btn btn-primary btn-sm" (click)="unirse.emit(l)">Unirme</button>
          }
        </div>
      </div>
    </article>
  `,
})
export class PartidaCard {
  readonly lobby = input.required<Lobby>();
  /** Muestra el nombre del club (se oculta dentro de la página del club). */
  readonly mostrarClub = input<boolean>(true);
  /** Muestra el botón para unirse directo desde la tarjeta (2 pasos: botón + confirmar). */
  readonly accion = input<boolean>(false);
  readonly esMia = input<boolean>(false);
  readonly unirse = output<Lobby>();

  readonly capitan = computed(() => capitanDe(this.lobby()));
  readonly puedeUnirse = computed(() => this.accion() && !this.esMia() && sePuedeUnir(this.lobby()));
}
