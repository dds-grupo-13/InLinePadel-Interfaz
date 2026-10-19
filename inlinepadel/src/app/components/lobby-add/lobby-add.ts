import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Club, Turno, Zona } from '../../models/club.model';
import { Privacidad } from '../../models/lobby.model';
import { AuthService } from '../../services/auth';
import { ClubService } from '../../services/club';
import { LobbyService } from '../../services/lobby';
import { ToastService } from '../../services/toast';
import { TurnoService } from '../../services/turno';
import { ZonaService } from '../../services/zona';
import { leerError } from '../../utils/errores';
import { hoyIso } from '../../utils/fechas';
import { HhmmPipe } from '../../utils/hhmm.pipe';

@Component({
  imports: [FormsModule, RouterLink, DatePipe, CurrencyPipe, HhmmPipe],
  selector: 'app-lobby-add',
  templateUrl: './lobby-add.html',
})
export class LobbyAdd implements OnInit {
  private readonly zonaService = inject(ZonaService);
  private readonly clubService = inject(ClubService);
  private readonly turnoService = inject(TurnoService);
  private readonly lobbies = inject(LobbyService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly zonas = signal<Zona[]>([]);
  readonly clubes = signal<Club[]>([]);
  readonly turnos = signal<Turno[]>([]);
  readonly cargandoTurnos = signal(false);
  readonly turnoElegido = signal<Turno | null>(null);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly hoy = hoyIso();

  zona: number | null = this.auth.usuarioActual()?.jugador?.zona ?? null;
  club: number | null = null;
  fecha = hoyIso();
  privacidad: Privacidad = 'PUBLICO';

  readonly clubesDeZona = computed(() => this.clubes().filter((c) => !this.zona || c.zona === this.zona));
  readonly clubElegido = computed(() => this.clubes().find((c) => c.id === this.club) ?? null);
  readonly precioPorJugador = computed(() => (this.turnoElegido() ? Number(this.turnoElegido()!.precio) / 4 : 0));

  ngOnInit(): void {
    this.zonaService.getAll().subscribe({ next: (z) => this.zonas.set(z), error: () => {} });
    this.clubService.todos().subscribe({
      next: (c) => {
        this.clubes.set(c);
        // si la zona del jugador tiene un único club, queda elegido
        const deZona = this.clubesDeZona();
        if (deZona.length === 1) this.elegirClub(deZona[0].id);
      },
      error: (e) => this.error.set(leerError(e, 'No pudimos cargar los clubes.').mensaje),
    });
  }

  cambioZona(): void {
    if (this.club && !this.clubesDeZona().some((c) => c.id === this.club)) this.elegirClub(null);
  }

  elegirClub(id: number | null): void {
    this.club = id;
    this.cargarTurnos();
  }

  cargarTurnos(): void {
    this.turnoElegido.set(null);
    this.turnos.set([]);
    if (!this.club || !this.fecha) return;
    this.cargandoTurnos.set(true);
    this.turnoService.buscar({ club: this.club, fecha: this.fecha }).subscribe({
      next: (t) => {
        this.turnos.set([...t].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio) || a.cancha_numero - b.cancha_numero));
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
