import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../environments/environment';
import { NotificacionService } from './notificacion';

describe('NotificacionService', () => {
  const url = `${environment.apiUrl}/social/notificaciones/`;
  let service: NotificacionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(NotificacionService);
    http = TestBed.inject(HttpTestingController);
  });

  it('el contador sale del total de no leídas', () => {
    service.refrescarContador();
    const req = http.expectOne((r) => r.url === url);
    expect(req.request.params.get('leida')).toBe('false');
    req.flush({ count: 4, next: null, previous: null, results: [] });
    expect(service.noLeidas()).toBe(4);
  });

  it('si falla la consulta el contador no cambia', () => {
    service.refrescarContador();
    http.expectOne((r) => r.url === url).flush(null, { status: 500, statusText: 'Error' });
    expect(service.noLeidas()).toBe(0);
  });

  it('marcar todas como leídas pone el contador en cero', () => {
    service.refrescarContador();
    http.expectOne((r) => r.url === url).flush({ count: 2, next: null, previous: null, results: [] });
    service.marcarTodasLeidas().subscribe();
    http.expectOne(`${url}marcar_todas_leidas/`).flush({ marcadas: 2 });
    expect(service.noLeidas()).toBe(0);
  });

  it('marcar una como leída vuelve a consultar el contador', () => {
    service.marcarLeida(7).subscribe();
    http.expectOne(`${url}7/marcar_leida/`).flush({});
    http.expectOne((r) => r.url === url && r.method === 'GET');
  });
});
