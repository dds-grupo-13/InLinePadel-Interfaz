import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Contacto, Invitacion } from '../models/social.model';
import { Page } from '../models/page.model';
import { aParams, traerTodas } from '../utils/http';

@Service()
export class SocialService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/social`;

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

  invitaciones(filtros: { rol?: 'enviadas' | 'recibidas'; lobby?: number; estado?: string } = {}): Observable<Invitacion[]> {
    return traerTodas<Invitacion>(this.http, `${this.base}/invitaciones/`, filtros);
  }
  contarInvitaciones(filtros: { rol?: 'enviadas' | 'recibidas'; estado?: string } = {}): Observable<number> {
    return this.http
      .get<Page<Invitacion>>(`${this.base}/invitaciones/`, { params: aParams({ ...filtros, page: 1 }) })
      .pipe(map((r) => r.count));
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
