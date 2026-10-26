export type EstadoPedido = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'EXPIRADA';
export type EstadoContacto = 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO';

export interface Contacto {
  id: number;
  jugador: number;
  contacto: number;
  estado: EstadoContacto;
  fecha: string;
}

export interface Invitacion {
  id: number;
  lobby: number;
  emisor: number;
  receptor: number;
  estado: EstadoPedido;
  fecha: string;
  tipo: 'INVITACION' | 'CESION';
  reemplaza: number | null;
}

export interface Notificacion {
  id: number;
  mensaje: string;
  leida: boolean;
  fecha: string;
  usuario: number;
}
