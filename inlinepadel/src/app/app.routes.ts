import { Routes } from '@angular/router';
import { ClubList } from './components/club-list/club-list';
import { Login } from './components/login/login';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'clubes', component: ClubList, canActivate: [authGuard] },
  { path: '', redirectTo: 'clubes', pathMatch: 'full' },
  { path: '**', redirectTo: 'clubes' },
];
