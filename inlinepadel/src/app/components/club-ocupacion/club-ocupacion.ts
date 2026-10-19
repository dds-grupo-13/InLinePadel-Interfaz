import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TurnoOcupacion } from '../../models/club.model';
import { ClubService } from '../../services/club';
import { ClubActual } from '../../services/club-actual';
import { leerError } from '../../utils/errores';
import { hoyIso, sumarDias } from '../../utils/fechas';
import { HhmmPipe } from '../../utils/hhmm.pipe';
import { ClubSelector } from '../shared/club-selector/club-selector';
import { Cupos } from '../shared/cupos/cupos';
import { Estado } from '../shared/estado/estado';

@Component({
  imports: [FormsModule, DatePipe, HhmmPipe, Estado, Cupos, ClubSelector],
  selector: 'app-club-ocupacion',
  templateUrl: './club-ocupacion.html',
})
export class ClubOcupacion {
  protected readonly ctx = inject(ClubActual);
  private readonly api = inject(ClubService);

  readonly fecha = signal(hoyIso());
  readonly turnos = signal<TurnoOcupacion[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly porCancha = computed(() => {
    const m = new Map<number, TurnoOcupacion[]>();
    for (const t of this.turnos()) m.set(t.cancha_numero, [...(m.get(t.cancha_numero) ?? []), t]);
    return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([numero, lista]) => ({ numero, lista: lista.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)) }));
  });

  constructor() {
    this.ctx.cargar();
    effect(() => {
      const club = this.ctx.club();
      const fecha = this.fecha();
      if (club) untracked(() => this.cargar(club.id, fecha));
    });
  }

  mover(dias: number): void {
    this.fecha.set(sumarDias(this.fecha(), dias));
  }

  private cargar(id: number, fecha: string): void {
    this.cargando.set(true);
    this.error.set(null);
    this.api.ocupacion(id, { fecha }).subscribe({
      next: (t) => {
        this.turnos.set(t);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(leerError(e, 'No pudimos cargar la ocupación.').mensaje);
        this.cargando.set(false);
      },
    });
  }
}
