import { Component, computed, input, output, signal } from '@angular/core';
import { FiltrosBusqueda } from '../../../models/lobby.model';
import { cantidadFiltros } from '../../../utils/filtros';
import { hoyIso, sumarDias } from '../../../utils/fechas';

@Component({
  selector: 'app-filtros-partidas',
  template: `
    <div class="filtros-partidas">
      <button type="button" class="btn btn-tool btn-sm filtros-toggle" [attr.aria-expanded]="abierto()" (click)="abierto.set(!abierto())">
        <i class="bi bi-sliders" aria-hidden="true"></i> Filtros
        @if (activos() > 0) { <span class="cuenta">{{ activos() }}</span> }
      </button>

      <div class="filtros-cuerpo" [class.abierto]="abierto()">
        <div class="filtro-grupo">
          <span class="form-label" id="filtro-dia">Día</span>
          <div class="dia-chips" role="group" aria-labelledby="filtro-dia">
            <button type="button" class="btn btn-sm" [class.btn-primary]="valor().fecha === hoy" [class.btn-tool]="valor().fecha !== hoy" (click)="elegirDia(0)">Hoy</button>
            <button type="button" class="btn btn-sm" [class.btn-primary]="valor().fecha === manana" [class.btn-tool]="valor().fecha !== manana" (click)="elegirDia(1)">Mañana</button>
            <input type="date" class="form-control form-control-sm" aria-label="Elegir otro día" [min]="hoy" [value]="valor().fecha ?? ''" (change)="cambiar('fecha', $any($event.target).value)" />
          </div>
        </div>

        <div class="filtro-grupo">
          <span class="form-label" id="filtro-franja">Franja horaria</span>
          <div class="franja" role="group" aria-labelledby="filtro-franja">
            <input type="time" class="form-control form-control-sm" aria-label="Desde las" [value]="valor().hora_desde ?? ''" (change)="cambiar('hora_desde', $any($event.target).value)" />
            <span class="muted">a</span>
            <input type="time" class="form-control form-control-sm" aria-label="Hasta las" [value]="valor().hora_hasta ?? ''" (change)="cambiar('hora_hasta', $any($event.target).value)" />
          </div>
        </div>

        <div class="filtro-grupo">
          <label class="form-label" for="filtro-precio">Precio máx. por jugador</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text">$</span>
            <input id="filtro-precio" type="number" min="0" step="500" inputmode="numeric" class="form-control" placeholder="Sin tope" [value]="valor().precio_max ?? ''" (change)="cambiar('precio_max', $any($event.target).value)" />
          </div>
        </div>

        <ng-content />

        @if (activos() > 0) {
          <button type="button" class="btn btn-tool btn-sm filtros-limpiar" (click)="limpiar()">
            <i class="bi bi-x-lg" aria-hidden="true"></i> Limpiar
          </button>
        }
      </div>
    </div>
  `,
})
export class FiltrosPartidas {
  readonly valor = input<FiltrosBusqueda>({});
  readonly cambio = output<FiltrosBusqueda>();

  protected readonly abierto = signal(false);
  protected readonly hoy = hoyIso();
  protected readonly manana = sumarDias(this.hoy, 1);
  protected readonly activos = computed(() => cantidadFiltros(this.valor()));

  protected elegirDia(dias: number): void {
    this.cambiar('fecha', sumarDias(this.hoy, dias));
  }

  protected cambiar(clave: keyof FiltrosBusqueda, texto: string): void {
    const nuevo: FiltrosBusqueda = { ...this.valor() };
    if (clave === 'precio_max') {
      const n = Number(texto);
      nuevo.precio_max = n > 0 ? n : null;
    } else {
      nuevo[clave] = texto || null;
    }
    this.cambio.emit(nuevo);
  }

  protected limpiar(): void {
    this.cambio.emit({});
  }
}
