import { JugadorPublico } from './jugador.model';
import { Turno } from './club.model';

export type EstadoLobby = 'EN_FORMACION' | 'COMPLETO' | 'JUGADO' | 'CANCELADO';
export type Privacidad = 'PUBLICO' | 'PRIVADO';
export type CanceladaPor = 'CAPITAN' | 'ABANDONO' | 'VENCIMIENTO' | 'CLUB' | 'SISTEMA';

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
  vencido: boolean;
  fecha_creacion: string;
  plazo_limite: string;
  fecha_check_in: string;
  capitan: number;
  es_capitan: boolean;
  fui_invitado: boolean;
  turno: number;
  turno_detalle: Turno;
  inscripciones: Inscripcion[];
  cupos_ocupados: number;
  cupos_libres: number;
  precio_total: string;
  precio_por_jugador: string;
  estado_reserva: 'PROVISORIA' | 'CONFIRMADA' | 'CUMPLIDA' | null;
  mensaje_reserva: string;
  codigo_reserva: string | null;
  cierre: string;
  reserva_firme: boolean;
  puede_cancelar: boolean;
  puede_abandonar: boolean;
  puede_ceder: boolean;
  aviso_cierre: string | null;
  cancelada_por: CanceladaPor | null;
  motivo_cancelacion: string;
  cesion_pendiente: { id: number; receptor: number } | null;
}

export interface LobbyFiltros {
  zona?: number | null;
  club?: number | null;
  fecha?: string | null;
  hora_desde?: string | null;
  hora_hasta?: string | null;
  precio_max?: number | null;
  privacidad?: Privacidad | '' | null;
  estado?: EstadoLobby | EstadoLobby[] | '' | null;
  con_cupos?: boolean | null;
  mios?: boolean | null;
  orden?: 'inicio' | '-inicio' | null;
}

export type FiltrosBusqueda = Pick<LobbyFiltros, 'fecha' | 'hora_desde' | 'hora_hasta' | 'precio_max'>;

export interface ProximoLobby {
  id: number;
  fecha: string;
  hora_inicio: string;
  inicio: string;
}

export interface ResumenClubApi {
  club: number;
  disponibles: number;
  cupos_libres: number;
  invitaciones: number;
  proximo: ProximoLobby | null;
}
