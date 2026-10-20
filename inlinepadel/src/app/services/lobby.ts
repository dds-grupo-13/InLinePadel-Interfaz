import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Lobby, LobbyFiltros, Privacidad } from '../models/lobby.model';
import { Page } from '../models/page.model';
import { aParams, traerTodas } from '../utils/http';

@Service()
export class LobbyService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/partidas/lobbies/`;

  getAll(filtros: LobbyFiltros, page = 1): Observable<Page<Lobby>> {
    return this.http.get<Page<Lobby>>(this.url, { params: aParams({ ...filtros, page }) });
  }

  todos(filtros: LobbyFiltros): Observable<Lobby[]> {
    return traerTodas<Lobby>(this.http, this.url, filtros);
  }

  get(id: number): Observable<Lobby> {
    return this.http.get<Lobby>(`${this.url}${id}/`);
  }

  /** Crea la partida y toma el turno en la misma operación (CU01). */
  crear(turno: number, privacidad: Privacidad): Observable<Lobby> {
    return this.http.post<Lobby>(this.url, { turno, privacidad });
  }

  cambiarPrivacidad(id: number, privacidad: Privacidad): Observable<Lobby> {
    return this.http.patch<Lobby>(`${this.url}${id}/`, { privacidad });
  }

  /** Se une a una partida pública o acepta la invitación de una privada. */
  unirse(id: number): Observable<Lobby> {
    return this.http.post<Lobby>(`${this.url}${id}/unirse/`, {});
  }

  abandonar(id: number): Observable<unknown> {
    return this.http.post(`${this.url}${id}/abandonar/`, {});
  }

  cancelar(id: number): Observable<void> {
    return this.http.post<void>(`${this.url}${id}/cancelar/`, {});
  }

  /** El club valida el código de reserva al llegar los jugadores. */
  checkIn(codigo_reserva: string): Observable<{ detail: string; lobby: number }> {
    return this.http.post<{ detail: string; lobby: number }>(`${this.url}check_in/`, { codigo_reserva });
  }
}
