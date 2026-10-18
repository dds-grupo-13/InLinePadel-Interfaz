import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, ReplaySubject, catchError, finalize, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth';

// refresh en curso, compartido para que varias requests con 401 hagan un solo refresh
let refrescando: ReplaySubject<string> | null = null;

const esApi = (url: string) => url.startsWith(environment.apiUrl);
const esAuth = (url: string) => /\/usuarios\/auth\/(login|refresh)\/?$/.test(url);

const conToken = (req: HttpRequest<unknown>, token: string) =>
  req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  if (!esApi(req.url) || esAuth(req.url)) {
    return next(req);
  }

  const token = auth.getAccessToken();
  const enviada = token ? conToken(req, token) : req;

  return next(enviada).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || !token) {
        return throwError(() => err);
      }
      return refrescar(auth).pipe(
        switchMap((nuevo) => next(conToken(req, nuevo))),
        catchError((e) => {
          if (e instanceof HttpErrorResponse && e.status === 401) {
            auth.expulsar();
          }
          return throwError(() => e);
        }),
      );
    }),
  );
};

function refrescar(auth: AuthService): Observable<string> {
  if (!refrescando) {
    const subject = new ReplaySubject<string>(1);
    refrescando = subject;
    auth
      .refresh()
      .pipe(finalize(() => (refrescando = null)))
      .subscribe({
        next: (r) => {
          subject.next(r.access);
          subject.complete();
        },
        error: (e) => {
          auth.expulsar();
          subject.error(e);
        },
      });
  }
  return refrescando.asObservable();
}
