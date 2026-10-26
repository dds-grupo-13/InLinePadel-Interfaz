import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import { DatosUsuario, Jugador, JugadorPublico, Posicion } from '../models/jugador.model';
import { Page } from '../models/page.model';
import { Usuario } from '../models/usuario.model';
import { aParams } from '../utils/http';

export interface RegistroDatos {
  usuario: DatosUsuario;
  posicion: Posicion;
  zona: number | null;
}

@Service()
export class JugadorService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/usuarios/jugadores/`;
  private readonly cache = new Map<number, Observable<JugadorPublico | null>>();

  registrar(datos: RegistroDatos): Observable<Jugador> {
    return this.http.post<Jugador>(this.url, datos);
  }

  miPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.url}me/`);
  }

  actualizarPerfil(cambios: { usuario?: Partial<DatosUsuario>; posicion?: Posicion; zona?: number | null }): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.url}me/`, cambios);
  }

  darDeBaja(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}${id}/`);
  }

  buscar(q: string, page = 1, filtros: { zona?: number | null; posicion?: Posicion | '' } = {}): Observable<Page<JugadorPublico>> {
    return this.http.get<Page<JugadorPublico>>(this.url, { params: aParams({ ...filtros, q, page }) });
  }

  obtener(id: number): Observable<JugadorPublico | null> {
    let j = this.cache.get(id);
    if (!j) {
      j = this.http.get<JugadorPublico | Jugador>(`${this.url}${id}/`).pipe(
        map((r) => ('usuario' in r ? this.aPublico(id, r) : r)),
        catchError(() => of(null)),
        shareReplay(1),
      );
      this.cache.set(id, j);
    }
    return j;
  }

  private aPublico(id: number, j: Jugador): JugadorPublico {
    const u = j.usuario;
    const nombre = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
    return { id, username: u.username, nombre: nombre || u.username, posicion: j.posicion, zona: j.zona };
  }
}
