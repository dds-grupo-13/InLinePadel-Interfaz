import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Lobby } from '../../models/lobby.model';
import { LobbyService } from '../../services/lobby';
import { leerError } from '../../utils/errores';
import { PartidaCard } from '../shared/partida-card/partida-card';

@Component({
  imports: [RouterLink, PartidaCard],
  selector: 'app-mis-partidas',
  templateUrl: './mis-partidas.html',
})
export class MisPartidas implements OnInit {
  private readonly lobbies = inject(LobbyService);

  readonly todas = signal<Lobby[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly pestana = signal<'proximas' | 'historial'>('proximas');

  readonly proximas = computed(() =>
    this.todas().filter((l) => l.estado === 'EN_FORMACION' || l.estado === 'COMPLETO')
      .sort((a, b) => a.turno_detalle.inicio.localeCompare(b.turno_detalle.inicio)),
  );
  readonly historial = computed(() =>
    this.todas().filter((l) => l.estado === 'JUGADO' || l.estado === 'CANCELADO')
      .sort((a, b) => b.turno_detalle.inicio.localeCompare(a.turno_detalle.inicio)),
  );
  readonly visibles = computed(() => (this.pestana() === 'proximas' ? this.proximas() : this.historial()));

  ngOnInit(): void {
    this.lobbies.todos({ mios: true }).subscribe({
      next: (l) => {
        this.todas.set(l);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(leerError(e, 'No pudimos cargar tus partidas.').mensaje);
        this.cargando.set(false);
      },
    });
  }
}
