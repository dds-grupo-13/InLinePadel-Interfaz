import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/usuarios/auth`;
  const usuario = { id: 1, username: 'ana', es_admin_club: false, es_admin_sistema: false };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('login guarda tokens y usuario', () => {
    service.login('ana', 'pw').subscribe();
    const req = http.expectOne(`${base}/login/`);
    expect(req.request.body).toEqual({ username: 'ana', password: 'pw' });
    req.flush({ access: 'a1', refresh: 'r1', usuario });

    expect(service.getAccessToken()).toBe('a1');
    expect(service.getRefreshToken()).toBe('r1');
    expect(service.isLoggedIn()).toBe(true);
    expect(service.usuarioActual()?.username).toBe('ana');
  });

  it('logout envía el refresh y limpia la sesión', () => {
    service.login('ana', 'pw').subscribe();
    http.expectOne(`${base}/login/`).flush({ access: 'a1', refresh: 'r1', usuario });

    service.logout();
    const req = http.expectOne(`${base}/logout/`);
    expect(req.request.body).toEqual({ refresh: 'r1' });
    req.flush(null);

    expect(service.getAccessToken()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
    expect(service.usuarioActual()).toBeNull();
  });
});
