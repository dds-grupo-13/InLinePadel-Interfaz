import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Notificacion } from '../../models/social.model';
import { NotificacionService } from '../../services/notificacion';
import { ToastService } from '../../services/toast';
import { leerError } from '../../utils/errores';
import { Paginador } from '../shared/paginador/paginador';

@Component({
  imports: [DatePipe, Paginador],
  selector: 'app-notificaciones',
  templateUrl: './notificaciones.html',
})
export class Notificaciones implements OnInit {
  private readonly api = inject(NotificacionService);
  private readonly toast = inject(ToastService);

  readonly items = signal<Notificacion[]>([]);
  readonly total = signal(0);
  readonly pagina = signal(1);
  readonly soloNuevas = signal(false);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(pagina = 1): void {
    this.pagina.set(pagina);
    this.cargando.set(true);
    this.api.getAll({ leida: this.soloNuevas() ? false : null }, pagina).subscribe({
      next: (p) => {
        this.items.set(p.results);
        this.total.set(p.count);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(leerError(e, 'No pudimos cargar tus avisos.').mensaje);
        this.cargando.set(false);
      },
    });
  }

  filtrar(soloNuevas: boolean): void {
    this.soloNuevas.set(soloNuevas);
    this.cargar();
  }

  leer(n: Notificacion): void {
    if (n.leida) return;
    this.api.marcarLeida(n.id).subscribe({
      next: () => this.items.update((l) => l.map((x) => (x.id === n.id ? { ...x, leida: true } : x))),
      error: () => {},
    });
  }

  marcarTodas(): void {
    this.api.marcarTodasLeidas().subscribe({
      next: () => {
        this.items.update((l) => l.map((x) => ({ ...x, leida: true })));
        this.toast.ok('Marcaste todos los avisos como leídos.');
        if (this.soloNuevas()) this.cargar();
      },
      error: (e) => this.toast.error(leerError(e).mensaje),
    });
  }
}
