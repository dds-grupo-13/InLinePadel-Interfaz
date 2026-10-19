import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Lobby } from '../../../models/lobby.model';
import { HhmmPipe } from '../../../utils/hhmm.pipe';
import { Cupos } from '../cupos/cupos';
import { Estado } from '../estado/estado';

/** Resumen de una partida: lo mínimo para decidir si sumarse (club, día y hora, cupos, precio, estado de la reserva). */
@Component({
  imports: [RouterLink, DatePipe, CurrencyPipe, HhmmPipe, Cupos, Estado],
  selector: 'app-partida-card',
  template: `
    @let l = lobby();
    <article class="partida" [class.mia]="l.inscripciones.length && esMia()">
      <div>
        <div class="cuando">
          <a class="stretched" [routerLink]="['/partidas', l.id]">
            {{ l.turno_detalle.fecha | date: 'EEE d MMM' }} · {{ l.turno_detalle.hora_inicio | hhmm }}
          </a>
        </div>
        <div class="donde">
          {{ l.turno_detalle.club_nombre }}@if (zona()) { · {{ zona() }} }
          <br />Cancha {{ l.turno_detalle.cancha_numero }} {{ l.turno_detalle.cancha_tipo === 'TECHADA' ? 'techada' : 'descubierta' }}
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
          @if (accion() && l.cupos_libres > 0 && l.estado === 'EN_FORMACION') {
            <button type="button" class="btn btn-primary btn-sm" (click)="unirse.emit(l)">
              {{ l.privacidad === 'PRIVADO' ? 'Pedir acceso' : 'Unirme' }}
            </button>
          }
        </div>
      </div>
    </article>
  `,
})
export class PartidaCard {
  readonly lobby = input.required<Lobby>();
  readonly zona = input<string>('');
  /** Muestra el botón para unirse directo desde la tarjeta (2 pasos: botón + confirmar). */
  readonly accion = input<boolean>(false);
  readonly esMia = input<boolean>(false);
  readonly unirse = output<Lobby>();
}
