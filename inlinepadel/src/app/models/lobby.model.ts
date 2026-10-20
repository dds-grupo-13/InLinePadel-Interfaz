import { JugadorPublico } from './jugador.model';
import { Turno } from './club.model';

export type EstadoLobby = 'EN_FORMACION' | 'COMPLETO' | 'JUGADO' | 'CANCELADO';
export type Privacidad = 'PUBLICO' | 'PRIVADO';

export interface Inscripcion {
  id: number;
  lobby: number;
  jugador: JugadorPublico;
  numero_cupo: number;
  fecha_inscripcion: string;
}

export interface Lobby {
  id: number;
  privacidad: Privacidad;
  estado: EstadoLobby;
  fecha_creacion: string;
  plazo_limite: string;
  fecha_check_in: string;
  capitan: number;
  es_capitan: boolean;
  /** Privada: el jugador recibió una invitación pendiente. */
  fui_invitado: boolean;
  turno: number;
  turno_detalle: Turno;
  inscripciones: Inscripcion[];
  cupos_ocupados: number;
  cupos_libres: number;
  precio_total: string;
  precio_por_jugador: string;
  estado_reserva: 'PROVISORIA' | 'CONFIRMADA' | null;
  mensaje_reserva: string;
  codigo_reserva: string | null;
}

export interface LobbyFiltros {
  zona?: number | null;
  club?: number | null;
  fecha?: string | null;
  hora_desde?: string | null;
  hora_hasta?: string | null;
  precio_max?: number | null;
  privacidad?: Privacidad | '' | null;
  estado?: EstadoLobby | '' | null;
  con_cupos?: boolean | null;
  mios?: boolean | null;
}
