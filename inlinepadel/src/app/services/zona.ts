import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, map, shareReplay, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Zona } from '../models/club.model';
import { Page } from '../models/page.model';

@Service()
export class ZonaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/clubes/zonas/`;
  private cache$: Observable<Zona[]> | null = null;

  /** Catálogo chico (sin paginar): se pide una vez y se reutiliza. */
  getAll(): Observable<Zona[]> {
    if (!this.cache$) {
      this.cache$ = this.http.get<Zona[] | Page<Zona>>(this.url).pipe(
        map((r) => (Array.isArray(r) ? r : r.results)),
        shareReplay(1),
      );
    }
    return this.cache$;
  }

  crear(nombre: string): Observable<Zona> {
    return this.http.post<Zona>(this.url, { nombre }).pipe(tap(() => (this.cache$ = null)));
  }

  editar(id: number, nombre: string): Observable<Zona> {
    return this.http.patch<Zona>(`${this.url}${id}/`, { nombre }).pipe(tap(() => (this.cache$ = null)));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}${id}/`).pipe(tap(() => (this.cache$ = null)));
  }
}
