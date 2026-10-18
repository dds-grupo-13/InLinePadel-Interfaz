import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../environments/environment';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/clubes/clubes/`;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('access', 'viejo');
    localStorage.setItem('refresh', 'ref');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  it('agrega Bearer a requests de la API', () => {
    client.get(api).subscribe();
    const req = http.expectOne(api);
    expect(req.request.headers.get('Authorization')).toBe('Bearer viejo');
    req.flush({});
  });

  it('no agrega el header a otros hosts', () => {
    client.get('https://otro.example/x').subscribe();
    const req = http.expectOne('https://otro.example/x');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('ante 401 refresca una vez y reintenta', () => {
    let resultado: unknown;
    client.get(api).subscribe((r) => (resultado = r));
    http.expectOne(api).flush(null, { status: 401, statusText: 'Unauthorized' });

    http.expectOne(`${environment.apiUrl}/usuarios/auth/refresh/`).flush({ access: 'nuevo' });

    const reintento = http.expectOne(api);
    expect(reintento.request.headers.get('Authorization')).toBe('Bearer nuevo');
    reintento.flush({ ok: true });
    expect(resultado).toEqual({ ok: true });
  });
});
