import { HttpClient } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notificacion } from '../models/social.model';
import { Page } from '../models/page.model';
import { aParams } from '../utils/http';

@Service()
export class NotificacionService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/social/notificaciones/`;

  private readonly _noLeidas = signal(0);
  readonly noLeidas = this._noLeidas.asReadonly();

  getAll(filtros: { leida?: boolean | null }, page = 1): Observable<Page<Notificacion>> {
    return this.http.get<Page<Notificacion>>(this.url, { params: aParams({ ...filtros, page }) });
  }

  refrescarContador(): void {
    this.http.get<Page<Notificacion>>(this.url, { params: { leida: 'false', page: 1 } }).subscribe({
      next: (p) => this._noLeidas.set(p.count),
      error: () => {},
    });
  }

  reiniciar(): void {
    this._noLeidas.set(0);
  }

  marcarLeida(id: number): Observable<Notificacion> {
    return this.http.post<Notificacion>(`${this.url}${id}/marcar_leida/`, {}).pipe(tap(() => this.refrescarContador()));
  }

  marcarTodasLeidas(): Observable<{ marcadas: number }> {
    return this.http.post<{ marcadas: number }>(`${this.url}marcar_todas_leidas/`, {}).pipe(tap(() => this._noLeidas.set(0)));
  }
}
