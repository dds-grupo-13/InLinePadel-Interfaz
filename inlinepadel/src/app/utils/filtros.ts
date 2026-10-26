import { ParamMap } from '@angular/router';
import { FiltrosBusqueda } from '../models/lobby.model';

const CLAVES = ['fecha', 'hora_desde', 'hora_hasta', 'precio_max'] as const;

export function filtrosDesdeQuery(query: ParamMap): FiltrosBusqueda {
  const filtros: FiltrosBusqueda = {};
  const fecha = query.get('fecha');
  if (fecha) filtros.fecha = fecha;
  const desde = query.get('hora_desde');
  if (desde) filtros.hora_desde = desde;
  const hasta = query.get('hora_hasta');
  if (hasta) filtros.hora_hasta = hasta;
  const precio = Number(query.get('precio_max'));
  if (precio > 0) filtros.precio_max = precio;
  return filtros;
}

export function filtrosAQuery(filtros: FiltrosBusqueda): Record<string, string | null> {
  return Object.fromEntries(CLAVES.map((k) => [k, filtros[k] ? String(filtros[k]) : null]));
}

export function cantidadFiltros(filtros: FiltrosBusqueda): number {
  return CLAVES.filter((k) => filtros[k]).length;
}

export function mismosFiltros(a: FiltrosBusqueda, b: FiltrosBusqueda): boolean {
  return CLAVES.every((k) => (a[k] ?? null) === (b[k] ?? null));
}
