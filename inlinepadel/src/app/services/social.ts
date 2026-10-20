import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Contacto, Invitacion } from '../models/social.model';
import { traerTodas } from '../utils/http';

/** Contactos e invitaciones a partidas privadas (RF06). */
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
}
