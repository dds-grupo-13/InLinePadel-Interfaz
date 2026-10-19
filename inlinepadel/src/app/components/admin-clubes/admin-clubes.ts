import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Club, EstadoClub, Zona } from '../../models/club.model';
import { ClubService } from '../../services/club';
import { ConfirmarService } from '../../services/confirmar';
import { ToastService } from '../../services/toast';
import { ZonaService } from '../../services/zona';
import { leerError } from '../../utils/errores';
import { Estado } from '../shared/estado/estado';
import { Paginador } from '../shared/paginador/paginador';

@Component({
  imports: [FormsModule, RouterLink, Estado, Paginador],
  selector: 'app-admin-clubes',
  templateUrl: './admin-clubes.html',
})
export class AdminClubes implements OnInit {
  private readonly api = inject(ClubService);
  private readonly zonaService = inject(ZonaService);
  private readonly toast = inject(ToastService);
  private readonly confirmar = inject(ConfirmarService);

  readonly clubes = signal<Club[]>([]);
  readonly zonas = signal<Zona[]>([]);
  readonly total = signal(0);
  readonly pagina = signal(1);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  zona: number | null = null;
  estado: EstadoClub | '' = '';

  ngOnInit(): void {
    this.zonaService.getAll().subscribe({ next: (z) => this.zonas.set(z), error: () => {} });
    this.cargar();
  }

  nombreZona(id: number): string {
    return this.zonas().find((z) => z.id === id)?.nombre ?? '';
  }

  cargar(pagina = 1): void {
    this.pagina.set(pagina);
    this.cargando.set(true);
    this.error.set(null);
    this.api.getAll({ zona: this.zona, estado: this.estado, page: pagina }).subscribe({
      next: (p) => {
        this.clubes.set(p.results);
        this.total.set(p.count);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(leerError(e, 'No pudimos cargar los clubes.').mensaje);
        this.cargando.set(false);
      },
    });
  }

  async cambiar(c: Club, accion: 'suspender' | 'reactivar' | 'baja'): Promise<void> {
    const textos = {
      suspender: { titulo: 'Suspender club', mensaje: `${c.denominacion} deja de ofrecer sus turnos libres. Las reservas ya confirmadas no se tocan.`, boton: 'Suspender', ok: 'Club suspendido.' },
      reactivar: { titulo: 'Reactivar club', mensaje: `${c.denominacion} vuelve a ofrecer sus turnos a los jugadores.`, boton: 'Reactivar', ok: 'Club reactivado.' },
      baja: { titulo: 'Dar de baja el club', mensaje: `${c.denominacion} deja de recibir reservas. El historial se conserva.`, boton: 'Dar de baja', ok: 'Club dado de baja.' },
    }[accion];
    const ok = await this.confirmar.pedirConfirmacion({ titulo: textos.titulo, mensaje: textos.mensaje, confirmar: textos.boton, peligro: accion !== 'reactivar' });
    if (!ok) return;
    const op = accion === 'suspender' ? this.api.suspender(c.id) : accion === 'reactivar' ? this.api.reactivar(c.id) : this.api.darDeBaja(c.id);
    op.subscribe({
      next: () => {
        this.toast.ok(textos.ok);
        this.cargar(this.pagina());
      },
      error: (e) => this.toast.error(leerError(e, 'No pudimos cambiar el estado del club.').mensaje),
    });
  }
}
