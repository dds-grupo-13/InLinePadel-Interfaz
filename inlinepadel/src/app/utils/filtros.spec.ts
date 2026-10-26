import { convertToParamMap } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { cantidadFiltros, filtrosAQuery, filtrosDesdeQuery } from './filtros';

describe('filtros', () => {
  it('lee los filtros de la URL e ignora los vacíos o inválidos', () => {
    const f = filtrosDesdeQuery(convertToParamMap({ fecha: '2026-10-20', hora_desde: '18:00', precio_max: 'abc' }));
    expect(f).toEqual({ fecha: '2026-10-20', hora_desde: '18:00' });
  });

  it('arma la query y limpia los filtros que no están', () => {
    expect(filtrosAQuery({ fecha: '2026-10-20', precio_max: 9000 })).toEqual({
      fecha: '2026-10-20',
      hora_desde: null,
      hora_hasta: null,
      precio_max: '9000',
    });
  });

  it('cuenta los filtros activos', () => {
    expect(cantidadFiltros({})).toBe(0);
    expect(cantidadFiltros({ fecha: '2026-10-20', hora_hasta: '22:00', precio_max: null })).toBe(2);
  });
});
