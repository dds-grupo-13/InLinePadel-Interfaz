export type Posicion = 'REVES' | 'DRIVE' | 'INDISTINTO';

export const POSICIONES: { valor: Posicion; etiqueta: string }[] = [
  { valor: 'REVES', etiqueta: 'Revés' },
  { valor: 'DRIVE', etiqueta: 'Drive' },
  { valor: 'INDISTINTO', etiqueta: 'Indistinto' },
];

export const etiquetaPosicion = (p: string | null | undefined): string =>
  POSICIONES.find((x) => x.valor === p)?.etiqueta ?? '';

export interface DatosUsuario {
  id?: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password?: string;
  password_actual?: string;
}

export interface Jugador {
  usuario: DatosUsuario;
  posicion: Posicion;
  zona: number | null;
}

export interface JugadorPublico {
  id: number;
  username: string;
  nombre: string;
  posicion: Posicion;
  zona: number | null;
}
