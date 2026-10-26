import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { etiquetaPosicion, JugadorPublico } from '../../models/jugador.model';
import { Contacto } from '../../models/social.model';
import { AuthService } from '../../services/auth';
import { ConfirmarService } from '../../services/confirmar';
import { JugadorService } from '../../services/jugador';
import { SocialService } from '../../services/social';
import { ToastService } from '../../services/toast';
import { leerError } from '../../utils/errores';
import { iniciales } from '../../utils/fechas';
import { Estado } from '../shared/estado/estado';
import { JugadorNombre } from '../shared/jugador-nombre/jugador-nombre';

type Pestana = 'amigos' | 'recibidas' | 'enviadas' | 'buscar';

@Component({
  imports: [FormsModule, RouterLink, Estado, JugadorNombre],
  selector: 'app-contactos',
  templateUrl: './contactos.html',
})
export class Contactos implements OnInit {
  private readonly social = inject(SocialService);
  private readonly jugadores = inject(JugadorService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirmar = inject(ConfirmarService);
  private readonly destroyRef = inject(DestroyRef);

  readonly todos = signal<Contacto[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly pestana = signal<Pestana>('amigos');
  readonly ocupado = signal(false);

  q = '';
  readonly resultados = signal<JugadorPublico[]>([]);
  readonly buscando = signal(false);
  readonly busquedaHecha = signal(false);
  private readonly consulta$ = new Subject<string>();

  protected readonly yo = computed(() => this.auth.usuarioActual()?.id ?? 0);
  readonly amigos = computed(() => this.todos().filter((c) => c.estado === 'ACEPTADO'));
  readonly recibidas = computed(() => this.todos().filter((c) => c.estado === 'PENDIENTE' && c.contacto === this.yo()));
  readonly enviadas = computed(() => this.todos().filter((c) => c.estado === 'PENDIENTE' && c.jugador === this.yo()));

  protected readonly posicion = etiquetaPosicion;
  protected readonly iniciales = iniciales;

  constructor() {
    this.consulta$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((q) => {
          this.buscando.set(q.length >= 2);
          this.busquedaHecha.set(false);
        }),
        switchMap((q) =>
          q.length < 2 ? of(null) : this.jugadores.buscar(q).pipe(catchError(() => of(null))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((p) => {
        this.resultados.set(p?.results ?? []);
        this.buscando.set(false);
        this.busquedaHecha.set(p !== null);
      });
  }

  ngOnInit(): void {
    this.cargar();
  }

  otro(c: Contacto): number {
    return c.jugador === this.yo() ? c.contacto : c.jugador;
  }

  cargar(): void {
    this.social.contactos().subscribe({
      next: (c) => {
        this.todos.set(c);
        this.cargando.set(false);
        if (this.recibidas().length && this.pestana() === 'amigos' && !this.amigos().length) this.pestana.set('recibidas');
      },
      error: (e) => {
        this.error.set(leerError(e, 'No pudimos cargar tus contactos.').mensaje);
        this.cargando.set(false);
      },
    });
  }

  escribio(): void {
    this.consulta$.next(this.q.trim());
  }

  relacion(id: number): 'ninguna' | 'amigo' | 'enviada' | 'recibida' | 'rechazada' {
    const c = this.todos().find((x) => this.otro(x) === id);
    if (!c) return 'ninguna';
    if (c.estado === 'ACEPTADO') return 'amigo';
    if (c.estado === 'RECHAZADO') return 'rechazada';
    return c.jugador === this.yo() ? 'enviada' : 'recibida';
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

  agregar(j: JugadorPublico): void {
    this.ejecutar(this.social.agregarContacto(j.id), `Le enviamos tu solicitud a ${j.nombre}.`, 'No pudimos enviar la solicitud.');
  }
  aceptar(c: Contacto): void {
    this.ejecutar(this.social.aceptarContacto(c.id), 'Ya son contactos. Ahora podés invitarlo a tus partidas.', 'No pudimos aceptar la solicitud.');
  }
  rechazar(c: Contacto): void {
    this.ejecutar(this.social.rechazarContacto(c.id), 'Rechazaste la solicitud.', 'No pudimos rechazar la solicitud.');
  }
  async quitar(c: Contacto, cancelando = false): Promise<void> {
    const ok = await this.confirmar.pedirConfirmacion({
      titulo: cancelando ? 'Cancelar solicitud' : 'Quitar contacto',
      mensaje: cancelando ? 'Se retira la solicitud que enviaste.' : 'Dejan de ser contactos y no vas a poder invitarlo a tus partidas.',
      confirmar: cancelando ? 'Cancelar solicitud' : 'Quitar contacto',
      cancelar: 'Volver',
      peligro: true,
    });
    if (ok) this.ejecutar(this.social.quitarContacto(c.id), cancelando ? 'Solicitud cancelada.' : 'Contacto eliminado.', 'No pudimos completar la acción.');
  }
}

