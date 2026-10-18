import { Jugador } from './jugador.model';

export interface Usuario {
  id: number;
  username: string;
  es_admin_club: boolean;
  es_admin_sistema: boolean;
  jugador?: Jugador;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  usuario: Usuario;
}
