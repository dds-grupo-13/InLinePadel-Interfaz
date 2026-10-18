import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Club } from '../models/club.model';
import { Page } from '../models/page.model';

@Service()
export class ClubService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Page<Club>> {
    return this.http.get<Page<Club>>(`${environment.apiUrl}/clubes/clubes/`);
  }
}
