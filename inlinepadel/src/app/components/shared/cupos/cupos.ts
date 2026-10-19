import { Component, computed, input } from '@angular/core';
import { Inscripcion } from '../../../models/lobby.model';
import { iniciales } from '../../../utils/fechas';

const POS = [
  { x: 30, y: 27 }, { x: 30, y: 57 }, // lado izquierdo de la red
  { x: 90, y: 27 }, { x: 90, y: 57 }, // lado derecho
];

/** La cancha vista desde arriba con los cuatro cupos: ocupados llenos, libres punteados. */
@Component({
  selector: 'app-cupos',
  template: `
    <svg class="cupos-cancha" viewBox="0 0 120 84" role="img" [attr.aria-label]="etiqueta()" [style.width.px]="ancho()">
      <rect class="piso" x="2" y="2" width="116" height="80" rx="6" />
      <rect class="linea" x="8" y="8" width="104" height="68" />
      <line class="linea" x1="34" y1="8" x2="34" y2="76" />
      <line class="linea" x1="86" y1="8" x2="86" y2="76" />
      <line class="linea red" x1="60" y1="4" x2="60" y2="80" />
      @for (p of puestos(); track $index) {
        @if (p.ocupado) {
          <circle class="ocupado" [attr.cx]="p.x" [attr.cy]="p.y" r="11" />
          @if (p.inicial) { <text [attr.x]="p.x" [attr.y]="p.y + 1" font-size="11">{{ p.inicial }}</text> }
        } @else {
          <circle class="vacio" [attr.cx]="p.x" [attr.cy]="p.y" r="11" />
        }
      }
    </svg>
  `,
})
export class Cupos {
  /** Con la lista se pueden mostrar las iniciales; si no, alcanza con la cantidad. */
  readonly inscripciones = input<Inscripcion[] | null>(null);
  readonly ocupados = input<number>(0);
  readonly ancho = input<number>(120);

  protected readonly cantidad = computed(() => this.inscripciones()?.length ?? this.ocupados());
  protected readonly etiqueta = computed(() => `${this.cantidad()} de 4 jugadores anotados`);

  protected readonly puestos = computed(() => {
    const lista = this.inscripciones();
    return POS.map((p, i) => {
      const ins = lista?.find((x) => x.numero_cupo === i + 1);
      const ocupado = lista ? !!ins : i < this.ocupados();
      return { ...p, ocupado, inicial: ins ? iniciales(ins.jugador.nombre || ins.jugador.username).slice(0, 2) : '' };
    });
  });
}
