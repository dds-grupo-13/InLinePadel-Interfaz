import { describe, expect, it } from 'vitest';
import { HhmmPipe } from './hhmm.pipe';

describe('HhmmPipe', () => {
  const pipe = new HhmmPipe();

  it('recorta los segundos', () => expect(pipe.transform('19:30:00')).toBe('19:30'));
  it('devuelve vacío si no hay hora', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
