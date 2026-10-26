import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { invitadoGuard, inicioGuard, rolGuard } from './guards/rol.guard';

export const routes: Routes = [
  { path: 'login', canActivate: [invitadoGuard], loadComponent: () => import('./components/login/login').then((m) => m.Login), title: 'Ingresar · InLine Padel' },
  { path: 'registro', canActivate: [invitadoGuard], loadComponent: () => import('./components/registro/registro').then((m) => m.Registro), title: 'Crear cuenta · InLine Padel' },

  {
    path: '',
    canActivate: [rolGuard('jugador')],
    children: [
      { path: 'inicio', loadComponent: () => import('./components/inicio/inicio').then((m) => m.Inicio), title: 'Inicio · InLine Padel' },
      { path: 'clubes/:id', loadComponent: () => import('./components/club-detalle/club-detalle').then((m) => m.ClubDetalle), title: 'Club · InLine Padel' },
      { path: 'partidas', redirectTo: '/inicio', pathMatch: 'full' },
      { path: 'partidas/nueva', redirectTo: '/inicio', pathMatch: 'full' },
      { path: 'partidas/:id', loadComponent: () => import('./components/lobby-details/lobby-details').then((m) => m.LobbyDetails), title: 'Partida · InLine Padel' },
      { path: 'mis-partidas', loadComponent: () => import('./components/mis-partidas/mis-partidas').then((m) => m.MisPartidas), title: 'Mis partidas · InLine Padel' },
      { path: 'contactos', loadComponent: () => import('./components/contactos/contactos').then((m) => m.Contactos), title: 'Contactos · InLine Padel' },
      { path: 'pedidos', loadComponent: () => import('./components/pedidos/pedidos').then((m) => m.Pedidos), title: 'Invitaciones · InLine Padel' },
      { path: 'perfil', loadComponent: () => import('./components/perfil/perfil').then((m) => m.Perfil), title: 'Mi perfil · InLine Padel' },
    ],
  },

  {
    path: 'club',
    canActivate: [rolGuard('club')],
    children: [
      { path: '', loadComponent: () => import('./components/club-panel/club-panel').then((m) => m.ClubPanel), title: 'Mi club · InLine Padel' },
      { path: 'canchas', loadComponent: () => import('./components/club-canchas/club-canchas').then((m) => m.ClubCanchas), title: 'Canchas · InLine Padel' },
      { path: 'turnos', loadComponent: () => import('./components/club-turnos/club-turnos').then((m) => m.ClubTurnos), title: 'Turnos · InLine Padel' },
      { path: 'turnos/publicar', loadComponent: () => import('./components/turno-add/turno-add').then((m) => m.TurnoAdd), title: 'Publicar turnos · InLine Padel' },
      { path: 'ocupacion', loadComponent: () => import('./components/club-ocupacion/club-ocupacion').then((m) => m.ClubOcupacion), title: 'Ocupación · InLine Padel' },
      { path: 'check-in', loadComponent: () => import('./components/check-in/check-in').then((m) => m.CheckIn), title: 'Check-in · InLine Padel' },
    ],
  },

  {
    path: 'admin',
    canActivate: [rolGuard('sistema')],
    children: [
      { path: 'clubes', loadComponent: () => import('./components/admin-clubes/admin-clubes').then((m) => m.AdminClubes), title: 'Clubes · InLine Padel' },
      { path: 'clubes/nuevo', loadComponent: () => import('./components/club-form/club-form').then((m) => m.ClubForm), title: 'Nuevo club · InLine Padel' },
      { path: 'clubes/:id', loadComponent: () => import('./components/club-form/club-form').then((m) => m.ClubForm), title: 'Editar club · InLine Padel' },
      { path: 'zonas', loadComponent: () => import('./components/admin-zonas/admin-zonas').then((m) => m.AdminZonas), title: 'Zonas · InLine Padel' },
    ],
  },

  { path: 'notificaciones', canActivate: [authGuard], loadComponent: () => import('./components/notificaciones/notificaciones').then((m) => m.Notificaciones), title: 'Avisos · InLine Padel' },

  { path: '', pathMatch: 'full', canActivate: [inicioGuard], children: [] },
  { path: '**', canActivate: [inicioGuard], children: [] },
];
