import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Club, Zona } from '../../models/club.model';
import { Lobby } from '../../models/lobby.model';
import { AccionesLobby } from '../../services/acciones-lobby';
import { AuthService } from '../../services/auth';
import { ClubService } from '../../services/club';
import { LobbyService } from '../../services/lobby';
import { ZonaService } from '../../services/zona';
import { leerError } from '../../utils/errores';
import { hoyIso } from '../../utils/fechas';
import { Paginador } from '../shared/paginador/paginador';
import { PartidaCard } from '../shared/partida-card/partida-card';

@Component({
  imports: [FormsModule, RouterLink, PartidaCard, Paginador],
  selector: 'app-lobby-list',
  templateUrl: './lobby-list.html',
})
export class LobbyList implements OnInit {
  private readonly lobbies = inject(LobbyService);
  private readonly clubService = inject(ClubService);
  private readonly zonaService = inject(ZonaService);
  private readonly acciones = inject(AccionesLobby);
  private readonly auth = inject(AuthService);

  readonly zonas = signal<Zona[]>([]);
  readonly clubes = signal<Club[]>([]);
  readonly resultado = signal<Lobby[]>([]);
  readonly total = signal(0);
  readonly pagina = signal(1);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly hoy = hoyIso();

  zona: number | null = this.auth.usuarioActual()?.jugador?.zona ?? null;
  club: number | null = null;
  fecha = '';
  horaDesde = '';
  horaHasta = '';
  precioMax: number | null = null;
  soloConCupos = true;

  readonly clubesDeZona = computed(() => this.clubes().filter((c) => !this.zona || c.zona === this.zona));
  private readonly zonaPorId = computed(() => new Map(this.zonas().map((z) => [z.id, z.nombre])));
  private readonly clubPorId = computed(() => new Map(this.clubes().map((c) => [c.id, c])));

  ngOnInit(): void {
    this.zonaService.getAll().subscribe({ next: (z) => this.zonas.set(z), error: () => {} });
    this.clubService.todos().subscribe({ next: (c) => this.clubes.set(c), error: () => {} });
    this.buscar();
  }

  nombreZona(l: Lobby): string {
    const club = this.clubPorId().get(l.turno_detalle.club);
    return club ? (this.zonaPorId().get(club.zona) ?? '') : '';
  }

  cambioZona(): void {
    if (this.club && !this.clubesDeZona().some((c) => c.id === this.club)) this.club = null;
    this.buscar();
  }

  limpiar(): void {
    this.zona = null;
    this.club = null;
    this.fecha = '';
    this.horaDesde = '';
    this.horaHasta = '';
    this.precioMax = null;
    this.soloConCupos = true;
    this.buscar();
  }

  buscar(pagina = 1): void {
    this.cargando.set(true);
    this.error.set(null);
    this.pagina.set(pagina);
    this.lobbies
      .getAll(
        {
          estado: 'EN_FORMACION',
          mios: false,
          zona: this.zona,
          club: this.club,
          fecha: this.fecha,
          hora_desde: this.horaDesde,
          hora_hasta: this.horaHasta,
          precio_max: this.precioMax,
          con_cupos: this.soloConCupos ? true : null,
        },
        pagina,
      )
      .subscribe({
        next: (p) => {
          this.resultado.set(p.results);
          this.total.set(p.count);
          this.cargando.set(false);
        },
        error: (e) => {
          this.error.set(leerError(e, 'No pudimos cargar las partidas.').mensaje);
          this.cargando.set(false);
        },
      });
  }

  async unirse(l: Lobby): Promise<void> {
    if (await this.acciones.unirse(l)) this.buscar(this.pagina());
  }
}
