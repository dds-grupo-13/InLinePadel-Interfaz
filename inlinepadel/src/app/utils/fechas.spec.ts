import { describe, expect, it } from 'vitest';
import { hhmm, iniciales, sumarDias, sumarMinutos } from './fechas';

describe('fechas', () => {
  it('suma días cruzando de mes', () => expect(sumarDias('2026-10-30', 3)).toBe('2026-11-02'));
  it('recorta los segundos de la hora', () => expect(hhmm('18:30:00')).toBe('18:30'));
  it('suma minutos a una hora', () => expect(sumarMinutos('18:00', 90)).toBe('19:30'));
  it('arma las iniciales', () => expect(iniciales('Ana Pérez')).toBe('AP'));
});
