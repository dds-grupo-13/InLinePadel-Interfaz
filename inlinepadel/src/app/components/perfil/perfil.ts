import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Zona } from '../../models/club.model';
import { POSICIONES, Posicion } from '../../models/jugador.model';
import { AuthService } from '../../services/auth';
import { ConfirmarService } from '../../services/confirmar';
import { JugadorService } from '../../services/jugador';
import { ToastService } from '../../services/toast';
import { ZonaService } from '../../services/zona';
import { leerError } from '../../utils/errores';

@Component({
  imports: [FormsModule],
  selector: 'app-perfil',
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly jugadores = inject(JugadorService);
  private readonly zonaService = inject(ZonaService);
  private readonly toast = inject(ToastService);
  private readonly confirmar = inject(ConfirmarService);
  private readonly router = inject(Router);

  readonly posiciones = POSICIONES;
  readonly zonas = signal<Zona[]>([]);
  readonly errores = signal<Record<string, string>>({});
  readonly guardando = signal(false);
  readonly cambiandoClave = signal(false);
  readonly erroresClave = signal<Record<string, string>>({});

  f = { username: this.auth.usuarioActual()?.username ?? '', first_name: '', last_name: '', email: '' };
  posicion: Posicion = 'INDISTINTO';
  zona: number | null = null;
  clave = { password_actual: '', password: '', repetir: '' };

  ngOnInit(): void {
    this.zonaService.getAll().subscribe({ next: (z) => this.zonas.set(z), error: () => {} });
    this.jugadores.miPerfil().subscribe({
      next: (u) => {
        this.auth.actualizarUsuario(u);
        this.cargarForm();
      },
      error: () => this.cargarForm(),
    });
  }

  private cargarForm(): void {
    const j = this.auth.usuarioActual()?.jugador;
    if (!j) return;
    this.f = { username: j.usuario.username ?? this.f.username, first_name: j.usuario.first_name ?? '', last_name: j.usuario.last_name ?? '', email: j.usuario.email ?? '' };
    this.posicion = j.posicion;
    this.zona = j.zona;
  }

  get noCoinciden(): boolean {
    return !!this.clave.repetir && this.clave.password !== this.clave.repetir;
  }

  guardar(): void {
    this.guardando.set(true);
    this.errores.set({});
    this.jugadores.actualizarPerfil({ usuario: { ...this.f }, posicion: this.posicion, zona: this.zona }).subscribe({
      next: (u) => {
        this.auth.actualizarUsuario(u);
        this.guardando.set(false);
        this.toast.ok('Guardamos los cambios de tu perfil.');
      },
      error: (e) => {
        this.guardando.set(false);
        const r = leerError(e, 'No pudimos guardar los cambios.');
        this.errores.set(r.campos);
        this.toast.error(r.mensaje);
      },
    });
  }

  cambiarClave(): void {
    if (this.noCoinciden) return;
    this.cambiandoClave.set(true);
    this.erroresClave.set({});
    const { password_actual, password } = this.clave;
    this.jugadores.actualizarPerfil({ usuario: { password_actual, password } }).subscribe({
      next: () => {
        this.cambiandoClave.set(false);
        this.clave = { password_actual: '', password: '', repetir: '' };
        this.toast.ok('Cambiaste tu contraseña.');
      },
      error: (e) => {
        this.cambiandoClave.set(false);
        const r = leerError(e, 'No pudimos cambiar la contraseña.');
        this.erroresClave.set(r.campos);
        this.toast.error(r.mensaje);
      },
    });
  }

  async darDeBaja(): Promise<void> {
    const ok = await this.confirmar.pedirConfirmacion({
      titulo: 'Dar de baja mi cuenta',
      mensaje: 'Vas a salir de tus partidas vigentes (si sos capitán, la capitanía pasa al siguiente jugador) y no vas a poder volver a entrar con esta cuenta. No se puede deshacer.',
      confirmar: 'Dar de baja mi cuenta',
      cancelar: 'Mantener mi cuenta',
      peligro: true,
    });
    if (!ok) return;
    const id = this.auth.usuarioActual()!.id;
    this.jugadores.darDeBaja(id).subscribe({
      next: () => {
        this.auth.logout();
        this.router.navigate(['/login']);
        this.toast.info('Tu cuenta fue dada de baja. ¡Gracias por jugar!');
      },
      error: (e) => this.toast.error(leerError(e, 'No pudimos dar de baja tu cuenta.').mensaje),
    });
  }
}
