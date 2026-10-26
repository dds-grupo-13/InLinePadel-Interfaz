import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TurnoOcupacion } from '../../models/club.model';
import { ClubService } from '../../services/club';
import { ClubActual } from '../../services/club-actual';
import { leerError } from '../../utils/errores';
import { hoyIso, sumarDias } from '../../utils/fechas';
import { HhmmPipe } from '../../utils/hhmm.pipe';
import { ToastService } from '../../services/toast';
import { TurnoService } from '../../services/turno';
import { ClubSelector } from '../shared/club-selector/club-selector';
import { Cupos } from '../shared/cupos/cupos';
import { Estado } from '../shared/estado/estado';
import { Modal } from '../shared/modal/modal';

@Component({
  imports: [FormsModule, DatePipe, HhmmPipe, Estado, Cupos, ClubSelector, Modal],
  selector: 'app-club-ocupacion',
  templateUrl: './club-ocupacion.html',
})
export class ClubOcupacion {
  protected readonly ctx = inject(ClubActual);
  private readonly api = inject(ClubService);
  private readonly turnosApi = inject(TurnoService);
  private readonly toast = inject(ToastService);

  readonly fecha = signal(hoyIso());
  readonly turnos = signal<TurnoOcupacion[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly MOTIVO_MIN = 5;
  readonly MOTIVO_MAX = 200;
  readonly cancelando = signal<TurnoOcupacion | null>(null);
  readonly motivo = signal('');
  readonly enviando = signal(false);
  readonly errorCancelacion = signal<string | null>(null);
  readonly motivoValido = computed(() => this.motivo().trim().length >= this.MOTIVO_MIN);

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

  puedeCancelar(t: TurnoOcupacion): boolean {
    const reserva = t.lobby?.reserva;
    return (reserva === 'PROVISORIA' || reserva === 'CONFIRMADA') && t.fecha >= hoyIso();
  }

  abrirCancelacion(t: TurnoOcupacion): void {
    this.cancelando.set(t);
    this.motivo.set('');
    this.errorCancelacion.set(null);
  }

  cerrarCancelacion(): void {
    if (!this.enviando()) this.cancelando.set(null);
  }

  confirmarCancelacion(): void {
    const t = this.cancelando();
    const club = this.ctx.club();
    if (!t || !club || !this.motivoValido() || this.enviando()) return;
    this.enviando.set(true);
    this.errorCancelacion.set(null);
    this.turnosApi.cancelarPorClub(t.id, this.motivo().trim()).subscribe({
      next: () => {
        this.enviando.set(false);
        this.cancelando.set(null);
        this.toast.ok('Cancelaste la partida. Se avisó a los jugadores y el turno quedó como no disponible.');
        this.cargar(club.id, this.fecha());
      },
      error: (e) => {
        this.enviando.set(false);
        this.errorCancelacion.set(leerError(e, 'No pudimos cancelar la partida.').mensaje);
      },
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
