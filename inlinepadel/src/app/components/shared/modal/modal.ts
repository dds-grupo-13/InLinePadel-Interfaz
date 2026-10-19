import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';

/** Diálogo modal sobre <dialog>: el navegador resuelve foco, Esc y fondo. */
@Component({
  selector: 'app-modal',
  template: `
    <dialog #d class="modal-ip" (cancel)="$event.preventDefault(); cerrar.emit()" (click)="clickFondo($event)" aria-modal="true">
      <div class="cuerpo">
        <div class="titulo-modal">
          <h3>{{ titulo() }}</h3>
          <button type="button" class="btn btn-tool btn-sm" (click)="cerrar.emit()" aria-label="Cerrar">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
        <ng-content />
      </div>
    </dialog>
  `,
})
export class Modal {
  readonly abierto = input(false);
  readonly titulo = input('');
  readonly cerrar = output<void>();
  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('d');

  constructor() {
    effect(() => {
      const d = this.dlg().nativeElement;
      if (this.abierto()) {
        if (!d.open) d.showModal?.();
      } else if (d.open) {
        d.close?.();
      }
    });
  }

  protected clickFondo(e: MouseEvent): void {
    if (e.target === this.dlg().nativeElement) this.cerrar.emit();
  }
}
