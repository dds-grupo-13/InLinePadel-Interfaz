import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import { Invitacion, SolicitudAcceso } from '../../models/social.model';
import { AuthService } from '../../services/auth';
import { SocialService } from '../../services/social';
import { ToastService } from '../../services/toast';
import { leerError } from '../../utils/errores';
import { Estado } from '../shared/estado/estado';
import { JugadorNombre } from '../shared/jugador-nombre/jugador-nombre';
import { LobbyResumen } from '../shared/lobby-resumen/lobby-resumen';

type Pestana = 'recibidas' | 'enviadas' | 'accesos';

@Component({
  imports: [RouterLink, DatePipe, Estado, JugadorNombre, LobbyResumen],
  selector: 'app-pedidos',
  templateUrl: './pedidos.html',
})
export class Pedidos implements OnInit {
  private readonly social = inject(SocialService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly recibidas = signal<Invitacion[]>([]);
  readonly enviadas = signal<Invitacion[]>([]);
  readonly solicitudes = signal<SolicitudAcceso[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly ocupado = signal(false);
  readonly pestana = signal<Pestana>('recibidas');

  private readonly yo = computed(() => this.auth.usuarioActual()?.id ?? 0);
  readonly recibidasPendientes = computed(() => this.recibidas().filter((i) => i.estado === 'PENDIENTE'));
  /** Pedidos de otros jugadores a partidas privadas que yo capitaneo. */
  readonly paraResponder = computed(() => this.solicitudes().filter((s) => s.jugador !== this.yo()));
  readonly mias = computed(() => this.solicitudes().filter((s) => s.jugador === this.yo()));
  readonly pendientesParaResponder = computed(() => this.paraResponder().filter((s) => s.estado === 'PENDIENTE').length);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    forkJoin({
      recibidas: this.social.invitaciones({ rol: 'recibidas' }),
      enviadas: this.social.invitaciones({ rol: 'enviadas' }),
      solicitudes: this.social.solicitudes(),
    }).subscribe({
      next: (r) => {
        this.recibidas.set(r.recibidas);
        this.enviadas.set(r.enviadas);
        this.solicitudes.set(r.solicitudes);
        this.cargando.set(false);
        if (!r.recibidas.some((i) => i.estado === 'PENDIENTE') && r.solicitudes.some((s) => s.estado === 'PENDIENTE' && s.jugador !== this.yo())) {
          this.pestana.set('accesos');
        }
      },
      error: (e) => {
        this.error.set(leerError(e, 'No pudimos cargar tus invitaciones.').mensaje);
        this.cargando.set(false);
      },
    });
  }

  private ejecutar(op: Observable<unknown>, ok: string, fallo: string): void {
    this.ocupado.set(true);
    op.subscribe({
      next: () => {
        this.toast.ok(ok);
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
    this.ejecutar(this.social.aceptarInvitacion(i.id), 'Aceptaste la invitación: ya sos parte de la partida.', 'No pudimos aceptar la invitación.');
  }
  rechazarInvitacion(i: Invitacion): void {
    this.ejecutar(this.social.rechazarInvitacion(i.id), 'Rechazaste la invitación.', 'No pudimos rechazar la invitación.');
  }
  aceptarSolicitud(s: SolicitudAcceso): void {
    this.ejecutar(this.social.aceptarSolicitud(s.id), 'Aceptaste el pedido: el jugador ya está en la partida.', 'No pudimos aceptar el pedido.');
  }
  rechazarSolicitud(s: SolicitudAcceso): void {
    this.ejecutar(this.social.rechazarSolicitud(s.id), 'Rechazaste el pedido.', 'No pudimos rechazar el pedido.');
  }
}
