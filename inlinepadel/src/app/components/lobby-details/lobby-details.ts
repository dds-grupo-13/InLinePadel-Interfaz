import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, of } from 'rxjs';
import { Club, Zona } from '../../models/club.model';
import { etiquetaPosicion, JugadorPublico } from '../../models/jugador.model';
import { Lobby, Privacidad } from '../../models/lobby.model';
import { Invitacion } from '../../models/social.model';
import { AccionesLobby } from '../../services/acciones-lobby';
import { AuthService } from '../../services/auth';
import { ClubService } from '../../services/club';
import { JugadorService } from '../../services/jugador';
import { LobbyService } from '../../services/lobby';
import { SocialService } from '../../services/social';
import { ToastService } from '../../services/toast';
import { ZonaService } from '../../services/zona';
import { leerError } from '../../utils/errores';
import { iniciales } from '../../utils/fechas';
import { HhmmPipe } from '../../utils/hhmm.pipe';
import { Cupos } from '../shared/cupos/cupos';
import { Estado } from '../shared/estado/estado';
import { JugadorNombre } from '../shared/jugador-nombre/jugador-nombre';
import { Modal } from '../shared/modal/modal';
import { Reserva } from '../shared/reserva/reserva';

interface Puesto {
  cupo: number;
  jugador: JugadorPublico | null;
}

@Component({
  imports: [RouterLink, DatePipe, CurrencyPipe, HhmmPipe, Cupos, Estado, Reserva, Modal, JugadorNombre],
  selector: 'app-lobby-details',
  templateUrl: './lobby-details.html',
})
export class LobbyDetails {
  readonly id = input.required<string>();
  readonly desde = input<string>();

  private readonly lobbies = inject(LobbyService);
  private readonly clubService = inject(ClubService);
  private readonly zonaService = inject(ZonaService);
  private readonly social = inject(SocialService);
  private readonly jugadores = inject(JugadorService);
  private readonly acciones = inject(AccionesLobby);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  readonly lobby = signal<Lobby | null>(null);
  readonly club = signal<Club | null>(null);
  readonly zona = signal<Zona | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly ocupado = signal(false);

  readonly miInvitacion = signal<Invitacion | null>(null);
  readonly invitacionesEnviadas = signal<Invitacion[]>([]);

  readonly invitarAbierto = signal(false);
  readonly cargandoContactos = signal(false);
  readonly contactos = signal<JugadorPublico[]>([]);
  readonly elegidos = signal<Set<number>>(new Set());

  readonly cederAbierto = signal(false);
  readonly receptorCesion = signal<number | null>(null);

  protected readonly miId = computed(() => this.auth.usuarioActual()?.id ?? 0);
  readonly inscripto = computed(() => !!this.lobby()?.inscripciones.some((i) => i.jugador.id === this.miId()));
  readonly abierta = computed(() => this.lobby()?.estado === 'EN_FORMACION');
  readonly vigente = computed(() => ['EN_FORMACION', 'COMPLETO'].includes(this.lobby()?.estado ?? ''));
  readonly volverA = computed(() => {
    if (this.desde() === 'mis-partidas') return ['/mis-partidas'];
    const l = this.lobby();
    return l ? ['/clubes', l.turno_detalle.club] : ['/inicio'];
  });
  readonly textoVolver = computed(() => (this.desde() === 'mis-partidas' ? 'Volver a mis partidas' : 'Volver al club'));
  readonly puestos = computed<Puesto[]>(() => {
    const l = this.lobby();
    return [1, 2, 3, 4].map((cupo) => ({ cupo, jugador: l?.inscripciones.find((i) => i.numero_cupo === cupo)?.jugador ?? null }));
  });

  protected readonly posicion = etiquetaPosicion;
  protected readonly iniciales = iniciales;

  constructor() {
    effect(() => {
      this.id();
      untracked(() => this.cargar());
    });
  }

  cargar(alCargar?: (l: Lobby) => void): void {
    const id = Number(this.id());
    this.error.set(null);
    this.lobbies.get(id).subscribe({
      next: (l) => {
        this.lobby.set(l);
        this.cargando.set(false);
        this.cargarContexto(l);
        alCargar?.(l);
      },
      error: (e) => {
        this.cargando.set(false);
        this.error.set(
          leerError(e, 'No pudimos cargar la partida.').status === 404
            ? 'Esta partida es solo por invitación o ya no está disponible.'
            : leerError(e).mensaje,
        );
      },
    });
  }

  private cargarContexto(l: Lobby): void {
    this.clubService.get(l.turno_detalle.club).subscribe({
      next: (c) => {
        this.club.set(c);
        this.zonaService.getAll().subscribe((zs) => this.zona.set(zs.find((z) => z.id === c.zona) ?? null));
      },
      error: () => {},
    });
    const inscripto = l.inscripciones.some((i) => i.jugador.id === this.miId());
    const vacio = <T>(o: Observable<T[]>) => o.pipe(catchError(() => of([] as T[])));
    forkJoin({
      recibidas: inscripto ? of([] as Invitacion[]) : vacio(this.social.invitaciones({ lobby: l.id, rol: 'recibidas', estado: 'PENDIENTE' })),
      enviadas: inscripto ? vacio(this.social.invitaciones({ lobby: l.id, rol: 'enviadas' })) : of([] as Invitacion[]),
    }).subscribe((r) => {
      this.miInvitacion.set(r.recibidas[0] ?? null);
      this.invitacionesEnviadas.set(r.enviadas);
    });
  }

  private async tras(accion: Promise<boolean>): Promise<void> {
    this.ocupado.set(true);
    if (await accion) this.cargar();
    this.ocupado.set(false);
  }

  unirse(): Promise<void> { return this.tras(this.acciones.unirse(this.lobby()!, false)); }
  abandonar(): Promise<void> { return this.tras(this.acciones.abandonar(this.lobby()!)); }
  cancelar(): Promise<void> { return this.tras(this.acciones.cancelar(this.lobby()!)); }

  cambiarPrivacidad(p: Privacidad): void {
    const l = this.lobby();
    if (!l || l.privacidad === p) return;
    this.lobbies.cambiarPrivacidad(l.id, p).subscribe({
      next: () => {
        this.toast.ok(p === 'PRIVADO' ? 'Ahora es una partida de solo invitados.' : 'Ahora es una partida pública.');
        this.cargar();
      },
      error: (e) => this.toast.error(leerError(e, 'No pudimos cambiar la privacidad.').mensaje),
    });
  }

  responderInvitacion(aceptar: boolean): void {
    const inv = this.miInvitacion();
    if (!inv) return;
    this.ocupado.set(true);
    const cesion = inv.tipo === 'CESION';
    const op = aceptar ? this.social.aceptarInvitacion(inv.id) : this.social.rechazarInvitacion(inv.id);
    op.subscribe({
      next: () => {
        this.ocupado.set(false);
        if (aceptar && cesion) {
          this.cargar((l) => this.toast.ok(`Tomaste el lugar: la reserva está confirmada${l.codigo_reserva ? ' — código ' + l.codigo_reserva : ''}.`));
          return;
        }
        this.toast.ok(aceptar ? 'Aceptaste la invitación: ya sos parte de la partida.' : cesion ? 'Rechazaste el lugar.' : 'Rechazaste la invitación.');
        this.cargar();
      },
      error: (e) => {
        this.toast.error(leerError(e, 'No pudimos responder la invitación.').mensaje);
        this.ocupado.set(false);
        this.cargar();
      },
    });
  }

  abrirInvitar(): void {
    this.invitarAbierto.set(true);
    this.elegidos.set(new Set());
    this.cargarContactos(this.invitacionesEnviadas().filter((i) => i.estado === 'PENDIENTE').map((i) => i.receptor));
  }

  abrirCeder(): void {
    this.cederAbierto.set(true);
    this.receptorCesion.set(null);
    this.cargarContactos([]);
  }

  confirmarCesion(): void {
    const l = this.lobby();
    const receptor = this.receptorCesion();
    if (!l || receptor === null || this.ocupado()) return;
    this.ocupado.set(true);
    this.lobbies.ceder(l.id, receptor).subscribe({
      next: () => {
        const nombre = this.contactos().find((c) => c.id === receptor)?.nombre ?? 'tu contacto';
        this.toast.ok(`Ofreciste tu lugar a ${nombre}. Seguís en la partida hasta que acepte.`);
        this.ocupado.set(false);
        this.cederAbierto.set(false);
        this.cargar();
      },
      error: (e) => {
        this.toast.error(leerError(e, 'No pudimos ofrecer tu lugar.').mensaje);
        this.ocupado.set(false);
        this.cederAbierto.set(false);
        this.cargar();
      },
    });
  }

  private cargarContactos(ademasExcluidos: number[]): void {
    this.cargandoContactos.set(true);
    this.social.contactos('ACEPTADO').subscribe({
      next: (cs) => {
        const yo = this.miId();
        const l = this.lobby()!;
        const excluidos = new Set([...l.inscripciones.map((i) => i.jugador.id), ...ademasExcluidos]);
        const ids = cs.map((c) => (c.jugador === yo ? c.contacto : c.jugador)).filter((id) => !excluidos.has(id));
        if (ids.length === 0) {
          this.contactos.set([]);
          this.cargandoContactos.set(false);
          return;
        }
        forkJoin(ids.map((id) => this.jugadores.obtener(id))).subscribe((js) => {
          this.contactos.set(js.filter((j): j is JugadorPublico => !!j));
          this.cargandoContactos.set(false);
        });
      },
      error: (e) => {
        this.cargandoContactos.set(false);
        this.toast.error(leerError(e, 'No pudimos cargar tus contactos.').mensaje);
      },
    });
  }

  alternar(id: number): void {
    this.elegidos.update((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  enviarInvitaciones(): void {
    const l = this.lobby()!;
    const ids = [...this.elegidos()];
    if (!ids.length) return;
    this.ocupado.set(true);
    forkJoin(
      ids.map((id) =>
        this.social.invitar(l.id, id).pipe(
          catchError((e) => of({ fallo: leerError(e, 'No se pudo enviar.').mensaje, id })),
        ),
      ),
    ).subscribe((res) => {
      const nombre = (id: number) => this.contactos().find((c) => c.id === id)?.nombre ?? 'un contacto';
      const fallos = res.filter((r): r is { fallo: string; id: number } => 'fallo' in r);
      const bien = res.length - fallos.length;
      if (bien) this.toast.ok(bien === 1 ? 'Invitación enviada.' : `${bien} invitaciones enviadas.`);
      fallos.forEach((f) => this.toast.error(`${nombre(f.id)}: ${f.fallo}`));
      this.ocupado.set(false);
      this.invitarAbierto.set(false);
      this.cargar();
    });
  }
}
