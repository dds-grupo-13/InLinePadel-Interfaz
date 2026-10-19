import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import { Club, ClubForm, EstadoClub, TurnoOcupacion } from '../models/club.model';
import { Page } from '../models/page.model';
import { aParams, traerTodas } from '../utils/http';

@Service()
export class ClubService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/clubes/clubes/`;
  private readonly cacheClub = new Map<number, Observable<Club>>();

  getAll(filtros: { zona?: number | null; estado?: EstadoClub | '' | null; page?: number } = {}): Observable<Page<Club>> {
    return this.http.get<Page<Club>>(this.url, { params: aParams(filtros) });
  }

  /** Todos los clubes visibles para el usuario (recorre las páginas). */
  todos(filtros: { zona?: number | null; estado?: EstadoClub | '' | null } = {}): Observable<Club[]> {
    return traerTodas<Club>(this.http, this.url, filtros);
  }

  /** Detalle con caché (el listado de partidas repite los mismos clubes). */
  get(id: number): Observable<Club> {
    let c = this.cacheClub.get(id);
    if (!c) {
      c = this.http.get<Club>(`${this.url}${id}/`).pipe(shareReplay(1));
      this.cacheClub.set(id, c);
    }
    return c;
  }

  crear(datos: ClubForm): Observable<Club> {
    return this.http.post<Club>(this.url, datos);
  }

  editar(id: number, datos: Partial<ClubForm>): Observable<Club> {
    this.cacheClub.delete(id);
    return this.http.patch<Club>(`${this.url}${id}/`, datos);
  }

  suspender(id: number): Observable<Club> {
    this.cacheClub.delete(id);
    return this.http.post<Club>(`${this.url}${id}/suspender/`, {});
  }

  reactivar(id: number): Observable<Club> {
    this.cacheClub.delete(id);
    return this.http.post<Club>(`${this.url}${id}/reactivar/`, {});
  }

  darDeBaja(id: number): Observable<Club> {
    this.cacheClub.delete(id);
    return this.http.post<Club>(`${this.url}${id}/dar_de_baja/`, {});
  }

  /** Ocupación de un club por franja horaria (vista del administrador de club). */
  ocupacion(id: number, filtros: { fecha?: string; fecha_desde?: string; fecha_hasta?: string }): Observable<TurnoOcupacion[]> {
    return traerTodas<TurnoOcupacion>(this.http, `${this.url}${id}/ocupacion/`, filtros);
  }

  nombre(id: number): Observable<string> {
    return this.get(id).pipe(map((c) => c.denominacion));
  }
}
