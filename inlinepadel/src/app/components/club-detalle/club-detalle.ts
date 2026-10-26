import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Club, Zona } from '../../models/club.model';
import { FiltrosBusqueda, Lobby } from '../../models/lobby.model';
import { AccionesLobby } from '../../services/acciones-lobby';
import { AuthService } from '../../services/auth';
import { ClubService } from '../../services/club';
import { LobbyService } from '../../services/lobby';
import { ToastService } from '../../services/toast';
import { ZonaService } from '../../services/zona';
import { leerError } from '../../utils/errores';
import { hoyIso, sumarDias } from '../../utils/fechas';
import { cantidadFiltros, filtrosAQuery, filtrosDesdeQuery } from '../../utils/filtros';
import { agruparPorDia } from '../../utils/partidas';
import { LobbyAdd } from '../lobby-add/lobby-add';
import { FiltrosPartidas } from '../shared/filtros-partidas/filtros-partidas';
import { Paginador } from '../shared/paginador/paginador';
import { PartidaCard } from '../shared/partida-card/partida-card';

type Vista = 'unirse' | 'crear';

@Component({
  imports: [RouterLink, DatePipe, PartidaCard, LobbyAdd, FiltrosPartidas, Paginador],
  selector: 'app-club-detalle',
  templateUrl: './club-detalle.html',
})
export class ClubDetalle {
  readonly id = input.required<string>();

  private readonly clubesApi = inject(ClubService);
  private readonly zonasApi = inject(ZonaService);
  private readonly lobbiesApi = inject(LobbyService);
  private readonly acciones = inject(AccionesLobby);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly club = signal<Club | null>(null);
  readonly zonas = signal<Zona[]>([]);
  readonly lobbies = signal<Lobby[]>([]);
  readonly total = signal(0);
  readonly pagina = signal(1);
  readonly filtros = signal<FiltrosBusqueda>(filtrosDesdeQuery(this.route.snapshot.queryParamMap));
  readonly totalInvitaciones = signal(0);
  readonly totalCuposLibres = signal(0);
  readonly cargando = signal(true);
  readonly actualizando = signal(false);
  readonly error = signal<string | null>(null);
  readonly ocupado = signal(false);
  readonly vista = signal<Vista>('unirse');

  readonly hayFiltros = computed(() => cantidadFiltros(this.filtros()) > 0);
  readonly zona = computed(() => this.zonas().find((z) => z.id === this.club()?.zona)?.nombre ?? '');
  readonly porDia = computed(() => agruparPorDia(this.lobbies()));

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => {
        this.vista.set('unirse');
        this.pagina.set(1);
        this.cargar(id);
      });
    });
  }

  cargar(id: number, silencioso = false): void {
    if (silencioso) {
      this.actualizando.set(true);
    } else {
      this.cargando.set(true);
    }
    this.error.set(null);
    forkJoin({
      club: this.clubesApi.get(id),
      zonas: this.zonasApi.getAll(),
      lobbies: this.lobbiesApi.getAll(
        { ...this.filtros(), club: id, estado: 'EN_FORMACION', con_cupos: true, orden: 'inicio' },
        this.pagina(),
      ),
      resumen: this.lobbiesApi.resumenPorClub({ ...this.filtros(), club: id }),
    }).subscribe({
      next: (r) => {
        this.club.set(r.club);
        this.zonas.set(r.zonas);
        this.lobbies.set(r.lobbies.results);
        this.total.set(r.lobbies.count);
        const fila = r.resumen.find((f) => f.club === id);
        this.totalInvitaciones.set(fila?.invitaciones ?? 0);
        this.totalCuposLibres.set(fila?.cupos_libres ?? 0);
        this.cargando.set(false);
        this.actualizando.set(false);
      },
      error: (e) => {
        const err = leerError(e, 'No pudimos cargar el club.');
        if (err.status === 404 && this.pagina() > 1) {
          // La página pedida ya no existe (por ejemplo, tras unirse y bajar la cantidad de partidas).
          this.pagina.set(1);
          this.cargar(id, silencioso);
          return;
        }
        const mensaje = err.mensaje;
        if (silencioso) {
          this.toast.error(mensaje);
        } else {
          this.error.set(mensaje);
        }
        this.cargando.set(false);
        this.actualizando.set(false);
      },
    });
  }

  async unirse(lobby: Lobby): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    const cambio = await this.acciones.unirse(lobby, false);
    this.ocupado.set(false);
    if (cambio) this.cargar(Number(this.id()), true);
  }

  estoy(l: Lobby): boolean {
    const yo = this.auth.usuarioActual()?.id;
    return l.inscripciones.some((i) => i.jugador.id === yo);
  }

  recargar(): void {
    this.cargar(Number(this.id()), true);
  }

  filtrar(filtros: FiltrosBusqueda): void {
    this.filtros.set(filtros);
    this.pagina.set(1);
    this.router.navigate([], { relativeTo: this.route, queryParams: filtrosAQuery(filtros), queryParamsHandling: 'merge', replaceUrl: true });
    this.cargar(Number(this.id()), true);
  }

  irAPagina(pagina: number): void {
    this.pagina.set(pagina);
    this.cargar(Number(this.id()), true);
  }

  irACrear(): void {
    this.vista.set('crear');
  }

  etiquetaDia(fecha: string): string {
    const hoy = hoyIso();
    if (fecha === hoy) return 'Hoy';
    if (fecha === sumarDias(hoy, 1)) return 'Mañana';
    return '';
  }
}
