import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Zona } from '../../models/club.model';
import { POSICIONES, Posicion } from '../../models/jugador.model';
import { AuthService } from '../../services/auth';
import { JugadorService } from '../../services/jugador';
import { ToastService } from '../../services/toast';
import { ZonaService } from '../../services/zona';
import { leerError } from '../../utils/errores';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-registro',
  templateUrl: './registro.html',
})
export class Registro implements OnInit {
  private readonly jugadores = inject(JugadorService);
  private readonly zonaService = inject(ZonaService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly posiciones = POSICIONES;
  readonly zonas = signal<Zona[]>([]);
  readonly errores = signal<Record<string, string>>({});
  readonly error = signal<string | null>(null);
  readonly enviando = signal(false);

  f = { username: '', email: '', first_name: '', last_name: '', password: '', repetir: '' };
  posicion: Posicion = 'INDISTINTO';
  zona: number | null = null;

  ngOnInit(): void {
    this.zonaService.getAll().subscribe({ next: (z) => this.zonas.set(z), error: () => {} });
  }

  get noCoinciden(): boolean {
    return !!this.f.repetir && this.f.password !== this.f.repetir;
  }

  onSubmit(): void {
    if (this.noCoinciden) return;
    this.error.set(null);
    this.errores.set({});
    this.enviando.set(true);
    const { repetir, ...usuario } = this.f;
    this.jugadores.registrar({ usuario: { ...usuario, username: usuario.username.trim() }, posicion: this.posicion, zona: this.zona }).subscribe({
      next: () =>
        // entra directo con las credenciales recién creadas
        this.auth.login(usuario.username.trim(), usuario.password).subscribe({
          next: () => {
            this.toast.ok('¡Bienvenido a InLine Padel! Ya podés buscar o armar tu primera partida.');
            this.router.navigateByUrl(this.auth.inicio());
          },
          error: () => this.router.navigateByUrl('/login'),
        }),
      error: (e) => {
        this.enviando.set(false);
        const r = leerError(e, 'No pudimos crear tu cuenta. Revisá los datos e intentá de nuevo.');
        this.errores.set(r.campos);
        this.error.set(r.mensaje);
      },
    });
  }
}
