import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Turno, TurnoNuevo } from '../models/club.model';
import { traerTodas } from '../utils/http';

export interface TurnoFiltros {
  club?: number | null;
  zona?: number | null;
  cancha?: number | null;
  fecha?: string | null;
  fecha_desde?: string | null;
  fecha_hasta?: string | null;
  hora_desde?: string | null;
  hora_hasta?: string | null;
  precio_max?: number | null;
  estado?: string | null;
}

@Service()
export class TurnoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/clubes/turnos/`;

  buscar(filtros: TurnoFiltros): Observable<Turno[]> {
    return traerTodas<Turno>(this.http, this.url, filtros);
  }

  editar(id: number, datos: Partial<Pick<Turno, 'fecha' | 'hora_inicio' | 'duracion' | 'cancha'> & { precio: number }>): Observable<Turno> {
    return this.http.patch<Turno>(`${this.url}${id}/`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}${id}/`);
  }

  noDisponible(id: number): Observable<Turno> {
    return this.http.post<Turno>(`${this.url}${id}/no_disponible/`, {});
  }

  disponible(id: number): Observable<Turno> {
    return this.http.post<Turno>(`${this.url}${id}/disponible/`, {});
  }

  crearMasivo(turnos: TurnoNuevo[]): Observable<Turno[]> {
    return this.http.post<Turno[]>(`${this.url}crear_masivo/`, turnos);
  }
}
