import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Turno } from '../../models/club.model';
import { Privacidad } from '../../models/lobby.model';
import { LobbyService } from '../../services/lobby';
import { ToastService } from '../../services/toast';
import { TurnoService } from '../../services/turno';
import { leerError } from '../../utils/errores';
import { hoyIso, sumarDias } from '../../utils/fechas';
import { HhmmPipe } from '../../utils/hhmm.pipe';
import { agruparTurnos } from '../../utils/partidas';

/** Alta de partida dentro de un club: se elige día, turno y cancha, y se confirma. */
@Component({
  imports: [FormsModule, DatePipe, CurrencyPipe, HhmmPipe],
  selector: 'app-lobby-add',
  templateUrl: './lobby-add.html',
})
export class LobbyAdd {
  readonly clubId = input.required<number>();

  private readonly turnoService = inject(TurnoService);
  private readonly lobbies = inject(LobbyService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly turnos = signal<Turno[]>([]);
  readonly cargandoTurnos = signal(false);
  readonly turnoElegido = signal<Turno | null>(null);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly hoy = hoyIso();

  fecha = hoyIso();
  privacidad: Privacidad = 'PUBLICO';

  readonly grupos = computed(() => agruparTurnos(this.turnos()));
  readonly canchasLibres = computed(() => new Set(this.turnos().map((t) => t.cancha)).size);
  readonly precioPorJugador = computed(() => (this.turnoElegido() ? Number(this.turnoElegido()!.precio) / 4 : 0));

  constructor() {
    effect(() => {
      const id = this.clubId();
      if (!id) return;
      untracked(() => this.cargarTurnos());
    });
  }

  esHoy(): boolean {
    return this.fecha === this.hoy;
  }

  esManana(): boolean {
    return this.fecha === sumarDias(this.hoy, 1);
  }

  elegirDia(dias: number): void {
    this.fecha = sumarDias(this.hoy, dias);
    this.cargarTurnos();
  }

  cargarTurnos(): void {
    this.turnoElegido.set(null);
    this.turnos.set([]);
    this.error.set(null);
    if (!this.fecha) return;
    this.cargandoTurnos.set(true);
    this.turnoService.buscar({ club: this.clubId(), fecha: this.fecha }).subscribe({
      next: (t) => {
        this.turnos.set(t);
        this.cargandoTurnos.set(false);
      },
      error: (e) => {
        this.cargandoTurnos.set(false);
        this.error.set(leerError(e, 'No pudimos cargar los turnos.').mensaje);
      },
    });
  }

  crear(): void {
    const turno = this.turnoElegido();
    if (!turno || this.enviando()) return;
    this.enviando.set(true);
    this.error.set(null);
    this.lobbies.crear(turno.id, this.privacidad).subscribe({
      next: (l) => {
        this.toast.ok('Partida creada. El turno quedó reservado de forma provisoria: ahora hay que juntar a los otros tres.');
        this.router.navigate(['/partidas', l.id]);
      },
      error: (e) => {
        this.enviando.set(false);
        const r = leerError(e, 'No pudimos crear la partida.');
        this.error.set(r.mensaje);
        // 409: otro jugador se quedó con el turno; se vuelve a mostrar la grilla actualizada
        if (r.status === 409) this.cargarTurnos();
      },
    });
  }
}
