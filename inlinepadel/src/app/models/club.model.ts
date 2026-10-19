export type EstadoClub = 'ACTIVO' | 'SUSPENDIDO' | 'BAJA';
export type TipoCancha = 'TECHADA' | 'DESCUBIERTA';
export type EstadoTurno = 'LIBRE' | 'BLOQUEADO' | 'CONFIRMADO' | 'NO_DISPONIBLE' | 'CUMPLIDO';

export interface Zona {
  id: number;
  nombre: string;
}

export interface Club {
  id: number;
  denominacion: string;
  direccion: string;
  estado: EstadoClub;
  zona: number;
  /** Solo lo ve el personal del sistema. */
  admin?: number | null;
}

export interface ClubForm {
  denominacion: string;
  direccion: string;
  zona: number;
  admin?: number;
  admin_username?: string;
  admin_email?: string;
  admin_password?: string;
}

export interface Cancha {
  id: number;
  numero: number;
  activa: boolean;
  tipo: TipoCancha;
  club: number;
}

export interface Turno {
  id: number;
  fecha: string;
  hora_inicio: string;
  duracion: number;
  precio: string;
  estado: EstadoTurno;
  cancha: number;
  inicio: string;
  fin: string;
  club: number;
  club_nombre: string;
  cancha_numero: number;
  cancha_tipo: TipoCancha;
}

export interface TurnoNuevo {
  cancha: number;
  fecha: string;
  hora_inicio: string;
  duracion: number;
  precio: number;
}

export interface TurnoOcupacion {
  id: number;
  fecha: string;
  hora_inicio: string;
  cancha: number;
  cancha_numero: number;
  estado: EstadoTurno;
  lobby: {
    id: number;
    estado: string;
    privacidad: string;
    cupos_ocupados: number;
    reserva: 'CONFIRMADA' | 'PROVISORIA';
    codigo_reserva: string | null;
  } | null;
}
