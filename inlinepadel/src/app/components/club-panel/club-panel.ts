import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TurnoOcupacion } from '../../models/club.model';
import { CanchaService } from '../../services/cancha';
import { ClubActual } from '../../services/club-actual';
import { ClubService } from '../../services/club';
import { leerError } from '../../utils/errores';
import { hoyIso } from '../../utils/fechas';
import { HhmmPipe } from '../../utils/hhmm.pipe';
import { ClubSelector } from '../shared/club-selector/club-selector';
import { Estado } from '../shared/estado/estado';

@Component({
  imports: [RouterLink, DatePipe, HhmmPipe, Estado, ClubSelector],
  selector: 'app-club-panel',
  templateUrl: './club-panel.html',
})
export class ClubPanel {
  protected readonly ctx = inject(ClubActual);
  private readonly clubService = inject(ClubService);
  private readonly canchaService = inject(CanchaService);

  readonly hoy = hoyIso();
  readonly turnos = signal<TurnoOcupacion[]>([]);
  readonly canchas = signal<number | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly cuenta = computed(() => {
    const t = this.turnos();
    const n = (e: string) => t.filter((x) => x.estado === e).length;
    const liberables = t.filter((x) => x.estado === 'BLOQUEADO' && x.lobby?.vencido).length;
    return { total: t.length, libres: n('LIBRE') + liberables, provisorias: n('BLOQUEADO') - liberables, confirmadas: n('CONFIRMADO') + n('CUMPLIDO'), retirados: n('NO_DISPONIBLE') };
  });
  readonly reservas = computed(() => this.turnos().filter((t) => t.lobby));

  constructor() {
    this.ctx.cargar();
    effect(() => {
      const club = this.ctx.club();
      if (club) untracked(() => this.cargar(club.id));
      else if (this.ctx.cargado()) this.cargando.set(false);
    });
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.error.set(null);
    this.clubService.ocupacion(id, { fecha: this.hoy }).subscribe({
      next: (t) => {
        this.turnos.set(t);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(leerError(e, 'No pudimos cargar la ocupación de hoy.').mensaje);
        this.cargando.set(false);
      },
    });
    this.canchaService.delClub(id).subscribe({ next: (c) => this.canchas.set(c.length), error: () => {} });
  }
}
