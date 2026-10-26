import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { Invitacion } from '../../models/social.model';
import { LobbyService } from '../../services/lobby';
import { SocialService } from '../../services/social';
import { ToastService } from '../../services/toast';
import { leerError } from '../../utils/errores';
import { Estado } from '../shared/estado/estado';
import { JugadorNombre } from '../shared/jugador-nombre/jugador-nombre';
import { LobbyResumen } from '../shared/lobby-resumen/lobby-resumen';

type Pestana = 'recibidas' | 'enviadas';

@Component({
  imports: [RouterLink, DatePipe, Estado, JugadorNombre, LobbyResumen],
  selector: 'app-pedidos',
  templateUrl: './pedidos.html',
})
export class Pedidos implements OnInit {
  private readonly social = inject(SocialService);
  private readonly toast = inject(ToastService);
  private readonly lobbies = inject(LobbyService);

  readonly recibidas = signal<Invitacion[]>([]);
  readonly enviadas = signal<Invitacion[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly ocupado = signal(false);
  readonly pestana = signal<Pestana>('recibidas');

  readonly recibidasPendientes = computed(() => this.recibidas().filter((i) => i.estado === 'PENDIENTE'));

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    forkJoin({
      recibidas: this.social.invitaciones({ rol: 'recibidas' }),
      enviadas: this.social.invitaciones({ rol: 'enviadas' }),
    }).subscribe({
      next: (r) => {
        this.recibidas.set(r.recibidas);
        this.enviadas.set(r.enviadas);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(leerError(e, 'No pudimos cargar tus invitaciones.').mensaje);
        this.cargando.set(false);
      },
    });
  }

  private ejecutar<T>(op: Observable<T>, ok: string | ((r: T) => string), fallo: string): void {
    this.ocupado.set(true);
    op.subscribe({
      next: (r) => {
        this.toast.ok(typeof ok === 'string' ? ok : ok(r));
        this.ocupado.set(false);
        this.cargar();
      },
      error: (e) => {
        this.toast.error(leerError(e, fallo).mensaje);
        this.ocupado.set(false);
        this.cargar();
      },
    });
  }

  aceptarInvitacion(i: Invitacion): void {
    if (i.tipo === 'CESION') {
      const tomar = this.social.aceptarInvitacion(i.id).pipe(
        switchMap(() => this.lobbies.get(i.lobby).pipe(catchError(() => of(null)))),
        map((l) => l?.codigo_reserva ?? null),
      );
      this.ejecutar(
        tomar,
        (codigo) => `Tomaste el lugar: la reserva está confirmada${codigo ? ' — código ' + codigo : ''}.`,
        'No pudimos aceptar el lugar.',
      );
      return;
    }
    this.ejecutar(this.social.aceptarInvitacion(i.id), 'Aceptaste la invitación: ya sos parte de la partida.', 'No pudimos aceptar la invitación.');
  }
  rechazarInvitacion(i: Invitacion): void {
    const cesion = i.tipo === 'CESION';
    this.ejecutar(this.social.rechazarInvitacion(i.id), cesion ? 'Rechazaste el lugar.' : 'Rechazaste la invitación.', cesion ? 'No pudimos rechazar el lugar.' : 'No pudimos rechazar la invitación.');
  }
}
