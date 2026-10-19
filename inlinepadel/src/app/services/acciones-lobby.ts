import { DatePipe, CurrencyPipe } from '@angular/common';
import { Service, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Lobby } from '../models/lobby.model';
import { leerError } from '../utils/errores';
import { hhmm } from '../utils/fechas';
import { ConfirmarService } from './confirmar';
import { LobbyService } from './lobby';
import { ToastService } from './toast';

/**
 * Acciones sobre una partida que se repiten en el listado y en el detalle:
 * piden confirmación, llaman a la API y avisan el resultado en lenguaje natural.
 * Devuelven true si algo cambió y la pantalla debe recargarse.
 */
@Service()
export class AccionesLobby {
  private readonly api = inject(LobbyService);
  private readonly toast = inject(ToastService);
  private readonly confirmar = inject(ConfirmarService);
  private readonly router = inject(Router);
  private readonly fecha = new DatePipe('es-AR');
  private readonly moneda = new CurrencyPipe('es-AR');

  private resumen(l: Lobby): string {
    const t = l.turno_detalle;
    const cuando = `${this.fecha.transform(t.fecha, 'EEEE d/M')} a las ${hhmm(t.hora_inicio)}`;
    return `${t.club_nombre}, ${cuando}`;
  }

  async unirse(l: Lobby, irAlDetalle = true): Promise<boolean> {
    const privado = l.privacidad === 'PRIVADO' && !l.es_capitan;
    const precio = this.moneda.transform(l.precio_por_jugador, 'ARS', 'symbol-narrow', '1.0-0');
    const ok = await this.confirmar.pedirConfirmacion({
      titulo: privado ? 'Pedir acceso a la partida' : 'Sumarte a la partida',
      mensaje: privado
        ? `${this.resumen(l)}. Es una partida de solo amigos: el capitán tiene que aceptar tu pedido.`
        : `${this.resumen(l)}. Tu parte es ${precio} y se paga en el club.`,
      confirmar: privado ? 'Pedir acceso' : 'Unirme',
    });
    if (!ok) return false;
    try {
      const r = await firstValueFrom(this.api.unirse(l.id));
      if (r.solicitud) {
        this.toast.ok('Le avisamos al capitán. Te contamos cuando responda.');
      } else if (r.lobby!.estado === 'COMPLETO') {
        this.toast.ok(`¡Partida completa! Reserva confirmada${r.lobby!.codigo_reserva ? ' — código ' + r.lobby!.codigo_reserva : ''}.`);
        if (irAlDetalle) this.router.navigate(['/partidas', l.id]);
      } else {
        this.toast.ok('Ya sos parte de la partida.');
        if (irAlDetalle) this.router.navigate(['/partidas', l.id]);
      }
    } catch (e) {
      this.toast.error(leerError(e, 'No pudimos sumarte a la partida.').mensaje);
    }
    return true;
  }

  async abandonar(l: Lobby): Promise<boolean> {
    const confirmada = l.estado === 'COMPLETO';
    const ok = await this.confirmar.pedirConfirmacion({
      titulo: 'Salir de la partida',
      mensaje: confirmada
        ? `${this.resumen(l)}. La reserva ya estaba confirmada: al salir, el cupo queda libre, la reserva vuelve a ser provisoria y el código deja de valer.`
        : `${this.resumen(l)}. Tu cupo queda libre para otro jugador.`,
      confirmar: 'Salir de la partida',
      peligro: true,
    });
    if (!ok) return false;
    try {
      await firstValueFrom(this.api.abandonar(l.id));
      this.toast.ok('Saliste de la partida.');
    } catch (e) {
      this.toast.error(leerError(e, 'No pudimos sacarte de la partida.').mensaje);
    }
    return true;
  }

  async cancelar(l: Lobby): Promise<boolean> {
    const ok = await this.confirmar.pedirConfirmacion({
      titulo: 'Cancelar la partida',
      mensaje: `${this.resumen(l)}. Se avisa a los jugadores anotados y el turno queda libre para otros. No se puede deshacer.`,
      confirmar: 'Cancelar partida',
      cancelar: 'Mantenerla',
      peligro: true,
    });
    if (!ok) return false;
    try {
      await firstValueFrom(this.api.cancelar(l.id));
      this.toast.ok('Cancelaste la partida. El turno quedó libre.');
    } catch (e) {
      this.toast.error(leerError(e, 'No pudimos cancelar la partida.').mensaje);
    }
    return true;
  }
}
