import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cancha, TipoCancha } from '../models/club.model';
import { traerTodas } from '../utils/http';

@Service()
export class CanchaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/clubes/canchas/`;

  delClub(club: number): Observable<Cancha[]> {
    return traerTodas<Cancha>(this.http, this.url, { club });
  }

  crear(datos: { numero: number; tipo: TipoCancha; activa: boolean; club: number }): Observable<Cancha> {
    return this.http.post<Cancha>(this.url, datos);
  }

  editar(id: number, datos: Partial<Pick<Cancha, 'numero' | 'tipo' | 'activa'>>): Observable<Cancha> {
    return this.http.patch<Cancha>(`${this.url}${id}/`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}${id}/`);
  }
}
