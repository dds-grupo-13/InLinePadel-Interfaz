import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { Rol } from '../models/usuario.model';
import { AuthService } from '../services/auth';
import { authGuard } from './auth.guard';
import { inicioGuard, invitadoGuard, rolGuard } from './rol.guard';

describe('guards', () => {
  const logueado = signal(false);
  const rol = signal<Rol | null>(null);
  const inicios: Record<Rol, string> = { jugador: '/inicio', club: '/club', sistema: '/admin/clubes' };
  const ruta = {} as ActivatedRouteSnapshot;
  const estado = {} as RouterStateSnapshot;

  const correr = (guard: typeof authGuard) => TestBed.runInInjectionContext(() => guard(ruta, estado));
  const destino = (r: unknown) => TestBed.inject(Router).serializeUrl(r as UrlTree);

  beforeEach(() => {
    logueado.set(false);
    rol.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => logueado(),
            rol: () => rol(),
            inicio: () => (rol() ? inicios[rol()!] : '/inicio'),
          },
        },
      ],
    });
  });

  it('authGuard manda al login sin sesión', () => {
    expect(destino(correr(authGuard))).toBe('/login');
  });

  it('authGuard deja pasar con sesión', () => {
    logueado.set(true);
    expect(correr(authGuard)).toBe(true);
  });

  it('rolGuard manda al login sin sesión', () => {
    expect(destino(correr(rolGuard('club')))).toBe('/login');
  });

  it('rolGuard deja pasar a un rol permitido', () => {
    logueado.set(true);
    rol.set('club');
    expect(correr(rolGuard('club', 'sistema'))).toBe(true);
  });

  it('rolGuard devuelve al inicio de su rol si no está permitido', () => {
    logueado.set(true);
    rol.set('jugador');
    expect(destino(correr(rolGuard('sistema')))).toBe('/inicio');
  });

  it('invitadoGuard deja pasar sin sesión y redirige con sesión', () => {
    expect(correr(invitadoGuard)).toBe(true);
    logueado.set(true);
    rol.set('sistema');
    expect(destino(correr(invitadoGuard))).toBe('/admin/clubes');
  });

  it('inicioGuard redirige según la sesión', () => {
    expect(destino(correr(inicioGuard))).toBe('/login');
    logueado.set(true);
    rol.set('club');
    expect(destino(correr(inicioGuard))).toBe('/club');
  });
});
