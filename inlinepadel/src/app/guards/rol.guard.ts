import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Rol } from '../models/usuario.model';
import { AuthService } from '../services/auth';

export const rolGuard =
  (...permitidos: Rol[]): CanActivateFn =>
  (): boolean | UrlTree => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
    const rol = auth.rol();
    return rol && permitidos.includes(rol) ? true : router.createUrlTree([auth.inicio()]);
  };

export const invitadoGuard: CanActivateFn = (): boolean | UrlTree => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? inject(Router).createUrlTree([auth.inicio()]) : true;
};

export const inicioGuard: CanActivateFn = (): UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return router.createUrlTree([auth.isLoggedIn() ? auth.inicio() : '/login']);
};
