import { HttpClient } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginResponse, Rol, Usuario } from '../models/usuario.model';

const ACCESS_KEY = 'access';
const REFRESH_KEY = 'refresh';
const USUARIO_KEY = 'usuario';

// Los tokens se guardan en localStorage: es legible por cualquier script de la página,
// por lo que un XSS podría robarlos. Por eso no se usa innerHTML ni bypassSecurityTrust*.
function leer(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: string | null): void {
  try {
    if (valor === null) {
      localStorage.removeItem(clave);
    } else {
      localStorage.setItem(clave, valor);
    }
  } catch {
    // storage no disponible: la sesión dura solo hasta recargar
  }
}

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly url = `${environment.apiUrl}/usuarios/auth`;

  private readonly _usuario = signal<Usuario | null>(this.usuarioGuardado());
  private readonly _logueado = signal<boolean>(leer(ACCESS_KEY) !== null);

  readonly usuarioActual = this._usuario.asReadonly();
  readonly isLoggedIn = this._logueado.asReadonly();

  /** Rol que decide qué pantallas se ofrecen: sistema > club > jugador. */
  readonly rol = computed<Rol | null>(() => {
    const u = this._usuario();
    if (!u) return null;
    if (u.es_admin_sistema) return 'sistema';
    if (u.es_admin_club) return 'club';
    return 'jugador';
  });

  /** Pantalla de inicio de cada rol. */
  inicio(): string {
    const rol = this.rol();
    return rol === 'sistema' ? '/admin/clubes' : rol === 'club' ? '/club' : '/partidas';
  }

  /** Guarda el perfil actualizado (ej: tras editar el perfil propio). */
  actualizarUsuario(usuario: Usuario): void {
    escribir(USUARIO_KEY, JSON.stringify(usuario));
    this._usuario.set(usuario);
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.url}/login/`, { username, password })
      .pipe(
        tap((r) => {
          this.guardarTokens(r.access, r.refresh);
          escribir(USUARIO_KEY, JSON.stringify(r.usuario));
          this._usuario.set(r.usuario);
        }),
      );
  }

  refresh(): Observable<{ access: string; refresh?: string }> {
    return this.http
      .post<{ access: string; refresh?: string }>(`${this.url}/refresh/`, {
        refresh: this.getRefreshToken(),
      })
      .pipe(tap((r) => this.guardarTokens(r.access, r.refresh ?? this.getRefreshToken()!)));
  }

  logout(): void {
    const refresh = this.getRefreshToken();
    if (refresh) {
      // el backend invalida el refresh; si falla igual se cierra la sesión local
      this.http.post(`${this.url}/logout/`, { refresh }).subscribe({ error: () => {} });
    }
    this.limpiar();
  }

  /** Cierra la sesión local sin avisar al backend (refresh ya inválido) y va a /login. */
  expulsar(): void {
    this.limpiar();
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return leer(ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return leer(REFRESH_KEY);
  }

  private guardarTokens(access: string, refresh: string): void {
    escribir(ACCESS_KEY, access);
    escribir(REFRESH_KEY, refresh);
    this._logueado.set(true);
  }

  private limpiar(): void {
    escribir(ACCESS_KEY, null);
    escribir(REFRESH_KEY, null);
    escribir(USUARIO_KEY, null);
    this._usuario.set(null);
    this._logueado.set(false);
  }

  private usuarioGuardado(): Usuario | null {
    const crudo = leer(USUARIO_KEY);
    try {
      return crudo ? (JSON.parse(crudo) as Usuario) : null;
    } catch {
      return null;
    }
  }
}
