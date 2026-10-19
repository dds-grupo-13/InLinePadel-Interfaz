import { HttpClient, HttpParams } from '@angular/common/http';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';
import { Page } from '../models/page.model';

/** Arma HttpParams salteando los valores vacíos. */
export function aParams(filtros: object = {}): HttpParams {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(filtros)) {
    if (v === null || v === undefined || v === '') continue;
    p = p.set(k, String(v));
  }
  return p;
}

/** Recorre todas las páginas de un listado (la API pagina de a 20). */
export function traerTodas<T>(http: HttpClient, url: string, filtros: object = {}): Observable<T[]> {
  let pagina = 1;
  const pedir = (n: number) => http.get<Page<T>>(url, { params: aParams(filtros).set('page', n) });
  return pedir(1).pipe(
    expand((r) => (r.next ? pedir(++pagina) : EMPTY)),
    map((r) => r.results),
    reduce((acc, items) => acc.concat(items), [] as T[]),
  );
}
