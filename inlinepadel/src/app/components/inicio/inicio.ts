import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { Club, Zona } from '../../models/club.model';
import { Lobby } from '../../models/lobby.model';
import { ClubService } from '../../services/club';
import { LobbyService } from '../../services/lobby';
import { SocialService } from '../../services/social';
import { ZonaService } from '../../services/zona';
import { leerError } from '../../utils/errores';
import { hoyIso, sumarDias } from '../../utils/fechas';
import { ResumenClub, resumenPorClub } from '../../utils/partidas';
import { HhmmPipe } from '../../utils/hhmm.pipe';

/** Pantalla de inicio del jugador: clubes disponibles y partidas para sumarse. */
@Component({
  imports: [FormsModule, RouterLink, HhmmPipe],
  selector: 'app-inicio',
  templateUrl: './inicio.html',
})
export class Inicio implements OnInit {
  private readonly clubesApi = inject(ClubService);
  private readonly lobbies = inject(LobbyService);
  private readonly zonasApi = inject(ZonaService);
  private readonly social = inject(SocialService);
  private readonly fecha = new DatePipe('es-AR');

  readonly clubes = signal<Club[]>([]);
  readonly zonas = signal<Zona[]>([]);
  readonly partidas = signal<Lobby[]>([]);
  readonly invitaciones = signal(0);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly zona = signal<number | null>(null);

  readonly resumenes = computed(() => resumenPorClub(this.partidas()));
  readonly totalDisponibles = computed(() =>
    [...this.resumenes().values()].reduce((total, r) => total + r.disponibles, 0),
  );
  readonly totalInvitaciones = computed(() =>
    [...this.resumenes().values()].reduce((total, r) => total + r.invitaciones, 0),
  );
  readonly totalCuposLibres = computed(() =>
    [...this.resumenes().values()].reduce((total, r) => total + r.cuposLibres, 0),
  );
  readonly clubesVisibles = computed(() =>
    this.clubes()
      .filter((c) => this.zona() === null || c.zona === this.zona())
      .sort((a, b) => {
        const disponiblesA = this.resumenes().get(a.id)?.disponibles ?? 0;
        const disponiblesB = this.resumenes().get(b.id)?.disponibles ?? 0;
        return disponiblesB - disponiblesA || a.denominacion.localeCompare(b.denominacion, 'es');
      }),
  );
  private readonly zonaPorId = computed(() => new Map(this.zonas().map((z) => [z.id, z.nombre])));

  private readonly sinResumen: ResumenClub = {
    disponibles: 0,
    invitaciones: 0,
    cuposLibres: 0,
    proximo: null,
  };

  nombreZona(club: Club): string {
    return this.zonaPorId().get(club.zona) ?? '';
  }

  resumenDe(club: Club): ResumenClub {
    return this.resumenes().get(club.id) ?? this.sinResumen;
  }

  /** "Hoy", "Mañana" o la fecha corta para la próxima partida del club. */
  etiquetaDia(fecha: string): string {
    const hoy = hoyIso();
    if (fecha === hoy) return 'Hoy';
    if (fecha === sumarDias(hoy, 1)) return 'Mañana';
    return this.fecha.transform(fecha, 'EEE d MMM') ?? fecha;
  }

  ngOnInit(): void {
    forkJoin({
      clubes: this.clubesApi.todos(),
      zonas: this.zonasApi.getAll(),
      partidas: this.lobbies.todos({ estado: 'EN_FORMACION', con_cupos: true, mios: false }),
      // si falla el contador, no debe tumbar la pantalla
      invitaciones: this.social
        .invitaciones({ rol: 'recibidas', estado: 'PENDIENTE' })
        .pipe(catchError(() => of([]))),
    }).subscribe({
      next: (r) => {
        this.clubes.set(r.clubes);
        this.zonas.set(r.zonas);
        this.partidas.set(r.partidas);
        this.invitaciones.set(r.invitaciones.length);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(leerError(e, 'No pudimos cargar los clubes.').mensaje);
        this.cargando.set(false);
      },
    });
  }

  verTodas(): void {
    this.zona.set(null);
  }
}
