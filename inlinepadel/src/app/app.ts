import { Component, computed, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Modal } from './components/shared/modal/modal';
import { AuthService } from './services/auth';
import { ConfirmarService } from './services/confirmar';
import { NotificacionService } from './services/notificacion';
import { ToastService } from './services/toast';

interface Item {
  ruta: string;
  texto: string;
  icono: string;
  exacto?: boolean;
  destacado?: boolean;
}

const JUGADOR: Item[] = [
  { ruta: '/inicio', texto: 'Inicio', icono: 'bi-house-door', exacto: true },
  { ruta: '/contactos', texto: 'Contactos', icono: 'bi-people' },
  { ruta: '/perfil', texto: 'Perfil', icono: 'bi-person-circle' },
];
const CLUB: Item[] = [
  { ruta: '/club', texto: 'Resumen', icono: 'bi-speedometer2', exacto: true },
  { ruta: '/club/turnos', texto: 'Turnos', icono: 'bi-grid-3x3-gap' },
  { ruta: '/club/ocupacion', texto: 'Ocupación', icono: 'bi-bar-chart-steps' },
  { ruta: '/club/check-in', texto: 'Check-in', icono: 'bi-qr-code-scan' },
  { ruta: '/club/canchas', texto: 'Canchas', icono: 'bi-columns-gap' },
];
const SISTEMA: Item[] = [
  { ruta: '/admin/clubes', texto: 'Clubes', icono: 'bi-buildings' },
  { ruta: '/admin/zonas', texto: 'Zonas', icono: 'bi-geo-alt' },
];

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Modal],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly toast = inject(ToastService);
  protected readonly confirmar = inject(ConfirmarService);
  protected readonly notif = inject(NotificacionService);
  private readonly router = inject(Router);

  protected readonly menu = computed<Item[]>(() => {
    switch (this.auth.rol()) {
      case 'jugador': return JUGADOR;
      case 'club': return CLUB;
      case 'sistema': return SISTEMA;
      default: return [];
    }
  });
  constructor() {
    // los avisos sin leer se consultan al entrar y cada minuto (límite de la API: 100 pedidos/min)
    effect((onCleanup) => {
      if (!this.auth.isLoggedIn()) {
        this.notif.reiniciar();
        return;
      }
      this.notif.refrescarContador();
      const t = setInterval(() => this.notif.refrescarContador(), 60_000);
      onCleanup(() => clearInterval(t));
    });
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
