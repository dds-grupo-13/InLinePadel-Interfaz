import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { AuthService } from '../../../services/auth';
import { JugadorService } from '../../../services/jugador';

@Component({
  selector: 'app-jugador-nombre',
  template: `{{ texto() }}`,
})
export class JugadorNombre {
  readonly id = input.required<number>();
  private readonly auth = inject(AuthService);
  private readonly jugadores = inject(JugadorService);

  private readonly datos = toSignal(
    toObservable(this.id).pipe(switchMap((id) => (id ? this.jugadores.obtener(id) : of(null)))),
    { initialValue: undefined },
  );

  protected readonly texto = computed(() => {
    if (this.id() === this.auth.usuarioActual()?.id) return 'Vos';
    const d = this.datos();
    if (d === undefined) return '…';
    return d ? d.nombre : 'Un jugador que ya no está activo';
  });
}
