import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  imports: [FormsModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  readonly error = signal<string | null>(null);

  onSubmit(): void {
    this.error.set(null);
    this.auth.login(this.username, this.password).subscribe({
      next: () => this.router.navigate(['/clubes']),
      error: (e) => this.error.set(this.mensaje(e)),
    });
  }

  private mensaje(e: { status?: number; error?: unknown }): string {
    if (e.status === 0) return 'No se pudo conectar con el servidor';
    if (e.status === 429) return 'Demasiados intentos, probá más tarde';
    const cuerpo = e.error as Record<string, unknown> | undefined;
    const detalle = cuerpo?.['detail'] ?? cuerpo?.['non_field_errors'];
    return typeof detalle === 'string' ? detalle : Array.isArray(detalle) ? detalle.join(' ') : 'Credenciales inválidas';
  }
}
