import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Contacto, Invitacion, SolicitudAcceso } from '../models/social.model';
import { traerTodas } from '../utils/http';

/** Contactos, invitaciones a partidas y solicitudes de acceso a partidas privadas (RF06). */
@Service()
export class SocialService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/social`;

  // --- contactos ---
  contactos(estado?: string): Observable<Contacto[]> {
    return traerTodas<Contacto>(this.http, `${this.base}/contactos/`, { estado });
  }
  agregarContacto(contacto: number): Observable<Contacto> {
    return this.http.post<Contacto>(`${this.base}/contactos/`, { contacto });
  }
  aceptarContacto(id: number): Observable<Contacto> {
    return this.http.post<Contacto>(`${this.base}/contactos/${id}/aceptar/`, {});
  }
  rechazarContacto(id: number): Observable<Contacto> {
    return this.http.post<Contacto>(`${this.base}/contactos/${id}/rechazar/`, {});
  }
  quitarContacto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/contactos/${id}/`);
  }

  // --- invitaciones ---
  invitaciones(filtros: { rol?: 'enviadas' | 'recibidas'; lobby?: number; estado?: string } = {}): Observable<Invitacion[]> {
    return traerTodas<Invitacion>(this.http, `${this.base}/invitaciones/`, filtros);
  }
  invitar(lobby: number, receptor: number): Observable<Invitacion> {
    return this.http.post<Invitacion>(`${this.base}/invitaciones/`, { lobby, receptor });
  }
  aceptarInvitacion(id: number): Observable<Invitacion> {
    return this.http.post<Invitacion>(`${this.base}/invitaciones/${id}/aceptar/`, {});
  }
  rechazarInvitacion(id: number): Observable<Invitacion> {
    return this.http.post<Invitacion>(`${this.base}/invitaciones/${id}/rechazar/`, {});
  }

  // --- solicitudes de acceso (lobbies privados) ---
  solicitudes(filtros: { lobby?: number; estado?: string } = {}): Observable<SolicitudAcceso[]> {
    return traerTodas<SolicitudAcceso>(this.http, `${this.base}/solicitudes/`, filtros);
  }
  aceptarSolicitud(id: number): Observable<SolicitudAcceso> {
    return this.http.post<SolicitudAcceso>(`${this.base}/solicitudes/${id}/aceptar/`, {});
  }
  rechazarSolicitud(id: number): Observable<SolicitudAcceso> {
    return this.http.post<SolicitudAcceso>(`${this.base}/solicitudes/${id}/rechazar/`, {});
  }
}
