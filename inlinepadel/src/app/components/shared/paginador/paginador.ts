import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-paginador',
  template: `
    @if (paginas() > 1) {
      <nav class="d-flex justify-content-center align-items-center gap-3 mt-3" aria-label="Paginación">
        <button type="button" class="btn btn-tool" [disabled]="pagina() <= 1" (click)="cambio.emit(pagina() - 1)">
          <i class="bi bi-chevron-left" aria-hidden="true"></i> Anterior
        </button>
        <span class="muted">Página {{ pagina() }} de {{ paginas() }}</span>
        <button type="button" class="btn btn-tool" [disabled]="pagina() >= paginas()" (click)="cambio.emit(pagina() + 1)">
          Siguiente <i class="bi bi-chevron-right" aria-hidden="true"></i>
        </button>
      </nav>
    }
  `,
})
export class Paginador {
  readonly count = input.required<number>();
  readonly pagina = input<number>(1);
  readonly tamano = input<number>(20);
  readonly cambio = output<number>();
  protected readonly paginas = computed(() => Math.max(1, Math.ceil(this.count() / this.tamano())));
}
