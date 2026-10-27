import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Lobby, LobbyFiltros } from '../../models/lobby.model';
import { LobbyService } from '../../services/lobby';
import { leerError } from '../../utils/errores';
import { Paginador } from '../shared/paginador/paginador';
import { PartidaCard } from '../shared/partida-card/partida-card';

type Pestana = 'proximas' | 'historial';

interface Listado {
  items: Lobby[];
  count: number;
  pagina: number;
  cargando: boolean;
}

const FILTROS: Record<Pestana, LobbyFiltros> = {
  proximas: { mios: true, estado: ['EN_FORMACION', 'COMPLETO'], orden: 'inicio' },
  historial: { mios: true, estado: ['JUGADO', 'CANCELADO'], orden: '-inicio' },
};

const vacio = (): Listado => ({ items: [], count: 0, pagina: 1, cargando: true });

@Component({
  imports: [RouterLink, PartidaCard, Paginador],
  selector: 'app-mis-partidas',
  templateUrl: './mis-partidas.html',
})
export class MisPartidas implements OnInit {
  private readonly lobbies = inject(LobbyService);

  readonly proximas = signal<Listado>(vacio());
  readonly historial = signal<Listado>(vacio());
  readonly error = signal<string | null>(null);
  readonly pestana = signal<Pestana>('proximas');

  ngOnInit(): void {
    this.cargar('proximas');
    this.cargar('historial');
  }

  listado(): Listado {
    return this.pestana() === 'proximas' ? this.proximas() : this.historial();
  }

  irAPagina(pestana: Pestana, pagina: number): void {
    this.cargar(pestana, pagina);
  }

  private cargar(pestana: Pestana, pagina = 1): void {
    const destino = pestana === 'proximas' ? this.proximas : this.historial;
    destino.update((l) => ({ ...l, cargando: true }));
    this.lobbies.getAll(FILTROS[pestana], pagina).subscribe({
      next: (r) => destino.set({ items: r.results, count: r.count, pagina, cargando: false }),
      error: (e) => {
        this.error.set(leerError(e, 'No pudimos cargar tus partidas.').mensaje);
        destino.update((l) => ({ ...l, cargando: false }));
      },
    });
  }
}
