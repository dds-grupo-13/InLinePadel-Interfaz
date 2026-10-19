import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { leerError } from './errores';

describe('leerError', () => {
  it('devuelve el mensaje por defecto si no es un error HTTP', () => {
    expect(leerError(new Error('x'), 'Falló').mensaje).toBe('Falló');
  });

  it('usa el detalle del backend en un 409', () => {
    const e = new HttpErrorResponse({ status: 409, error: { detail: 'El turno ya fue tomado.' } });
    const r = leerError(e);
    expect(r.status).toBe(409);
    expect(r.mensaje).toContain('El turno ya fue tomado.');
  });

  it('asigna los errores de validación al campo correspondiente', () => {
    const e = new HttpErrorResponse({ status: 400, error: { email: ['Email inválido.'] } });
    expect(leerError(e).campos['email']).toBe('Email inválido.');
  });

  it('no expone códigos técnicos cuando no hay conexión', () => {
    const e = new HttpErrorResponse({ status: 0 });
    expect(leerError(e).mensaje).not.toMatch(/\b0\b|HttpErrorResponse/);
  });
});
