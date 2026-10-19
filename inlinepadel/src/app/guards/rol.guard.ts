import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Rol } from '../models/usuario.model';
import { AuthService } from '../services/auth';

/** Deja pasar solo a los roles indicados; el resto vuelve a su pantalla de inicio. */
export const rolGuard =
  (...permitidos: Rol[]): CanActivateFn =>
  (): boolean | UrlTree => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
    const rol = auth.rol();
    return rol && permitidos.includes(rol) ? true : router.createUrlTree([auth.inicio()]);
  };

/** Pantallas públicas (login, registro): si ya hay sesión, va al inicio del rol. */
export const invitadoGuard: CanActivateFn = (): boolean | UrlTree => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? inject(Router).createUrlTree([auth.inicio()]) : true;
};

/** Ruta raíz: redirige según el rol. */
export const inicioGuard: CanActivateFn = (): UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return router.createUrlTree([auth.isLoggedIn() ? auth.inicio() : '/login']);
};
