import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { leerError } from '../../utils/errores';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-login',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  readonly error = signal<string | null>(null);
  readonly enviando = signal(false);

  onSubmit(): void {
    this.error.set(null);
    this.enviando.set(true);
    this.auth.login(this.username.trim(), this.password).subscribe({
      next: () => this.router.navigateByUrl(this.auth.inicio()),
      error: (e) => {
        this.enviando.set(false);
        this.error.set(leerError(e, 'No pudimos iniciar tu sesión. Probá de nuevo.').mensaje);
      },
    });
  }
}
