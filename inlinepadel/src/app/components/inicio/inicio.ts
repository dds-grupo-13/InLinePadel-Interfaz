import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { Club, Zona } from '../../models/club.model';
import { FiltrosBusqueda } from '../../models/lobby.model';
import { ClubService } from '../../services/club';
import { LobbyService } from '../../services/lobby';
import { SocialService } from '../../services/social';
import { ZonaService } from '../../services/zona';
import { leerError } from '../../utils/errores';
import { hoyIso, sumarDias } from '../../utils/fechas';
import { filtrosAQuery, filtrosDesdeQuery } from '../../utils/filtros';
import { HhmmPipe } from '../../utils/hhmm.pipe';
import { ResumenClub, resumenesPorClub } from '../../utils/partidas';
import { FiltrosPartidas } from '../shared/filtros-partidas/filtros-partidas';

@Component({
  imports: [FormsModule, RouterLink, HhmmPipe, FiltrosPartidas],
  selector: 'app-inicio',
  templateUrl: './inicio.html',
})
export class Inicio implements OnInit {
  private readonly clubesApi = inject(ClubService);
  private readonly lobbies = inject(LobbyService);
  private readonly zonasApi = inject(ZonaService);
  private readonly social = inject(SocialService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fecha = new DatePipe('es-AR');

  readonly clubes = signal<Club[]>([]);
  readonly zonas = signal<Zona[]>([]);
  readonly resumenes = signal<Map<number, ResumenClub>>(new Map());
  readonly invitaciones = signal(0);
  private readonly clubesListos = signal(false);
  private readonly resumenListo = signal(false);
  readonly cargando = computed(() => !this.error() && !(this.clubesListos() && this.resumenListo()));
  readonly buscando = signal(false);
  readonly error = signal<string | null>(null);
  readonly zona = signal<number | null>(null);
  readonly filtros = signal<FiltrosBusqueda>(filtrosDesdeQuery(this.route.snapshot.queryParamMap));
  private readonly consulta = computed(() => ({ ...this.filtros(), zona: this.zona() }));

  readonly totalDisponibles = computed(() => this.sumar((r) => r.disponibles));
  readonly totalInvitaciones = computed(() => this.sumar((r) => r.invitaciones));
  readonly totalCuposLibres = computed(() => this.sumar((r) => r.cuposLibres));
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
      invitaciones: this.social.contarInvitaciones({ rol: 'recibidas', estado: 'PENDIENTE' }).pipe(catchError(() => of(0))),
    }).subscribe({
      next: (r) => {
        this.clubes.set(r.clubes);
        this.zonas.set(r.zonas);
        this.invitaciones.set(r.invitaciones);
        this.clubesListos.set(true);
      },
      error: (e) => this.error.set(leerError(e, 'No pudimos cargar los clubes.').mensaje),
    });
  }

  filtrar(filtros: FiltrosBusqueda): void {
    this.filtros.set(filtros);
    this.router.navigate([], { relativeTo: this.route, queryParams: filtrosAQuery(filtros), queryParamsHandling: 'merge', replaceUrl: true });
  }

  verTodas(): void {
    this.zona.set(null);
  }

  private sumar(campo: (r: ResumenClub) => number): number {
    return this.clubesVisibles().reduce((total, c) => total + campo(this.resumenDe(c)), 0);
  }

  constructor() {
    toObservable(this.consulta)
      .pipe(
        tap(() => this.buscando.set(true)),
        switchMap((c) =>
          this.lobbies.resumenPorClub(c).pipe(
            map((filas) => ({ filas })),
            catchError((e) => of({ e })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((r) => {
        this.buscando.set(false);
        this.resumenListo.set(true);
        if ('filas' in r) {
          this.error.set(null);
          this.resumenes.set(resumenesPorClub(r.filas));
        } else {
          this.error.set(leerError(r.e, 'No pudimos cargar las partidas.').mensaje);
        }
      });
  }
}
