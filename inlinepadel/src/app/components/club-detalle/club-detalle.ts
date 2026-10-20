import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Club, Zona } from '../../models/club.model';
import { Lobby } from '../../models/lobby.model';
import { AccionesLobby } from '../../services/acciones-lobby';
import { ClubService } from '../../services/club';
import { LobbyService } from '../../services/lobby';
import { ZonaService } from '../../services/zona';
import { leerError } from '../../utils/errores';
import { agruparPorDia } from '../../utils/partidas';
import { LobbyAdd } from '../lobby-add/lobby-add';
import { PartidaCard } from '../shared/partida-card/partida-card';

type Vista = 'unirse' | 'crear';

/** Dentro de un club: las partidas abiertas para sumarse o el alta de una nueva. */
@Component({
  imports: [RouterLink, DatePipe, PartidaCard, LobbyAdd],
  selector: 'app-club-detalle',
  templateUrl: './club-detalle.html',
})
export class ClubDetalle {
  readonly id = input.required<string>();

  private readonly clubesApi = inject(ClubService);
  private readonly zonasApi = inject(ZonaService);
  private readonly lobbiesApi = inject(LobbyService);
  private readonly acciones = inject(AccionesLobby);

  readonly club = signal<Club | null>(null);
  readonly zonas = signal<Zona[]>([]);
  readonly lobbies = signal<Lobby[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly ocupado = signal(false);
  readonly vista = signal<Vista>('unirse');

  readonly zona = computed(() => this.zonas().find((z) => z.id === this.club()?.zona)?.nombre ?? '');
  readonly porDia = computed(() => agruparPorDia(this.lobbies()));

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => this.cargar(id));
    });
  }

  cargar(id: number): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      club: this.clubesApi.get(id),
      zonas: this.zonasApi.getAll(),
      lobbies: this.lobbiesApi.todos({
        club: id,
        estado: 'EN_FORMACION',
        con_cupos: true,
        mios: false,
      }),
    }).subscribe({
      next: (r) => {
        this.club.set(r.club);
        this.zonas.set(r.zonas);
        this.lobbies.set(r.lobbies);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(leerError(e, 'No pudimos cargar el club.').mensaje);
        this.cargando.set(false);
      },
    });
  }

  async unirse(lobby: Lobby): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    const cambio = await this.acciones.unirse(lobby, false);
    this.ocupado.set(false);
    if (cambio) this.cargar(Number(this.id()));
  }

  irACrear(): void {
    this.vista.set('crear');
  }
}
