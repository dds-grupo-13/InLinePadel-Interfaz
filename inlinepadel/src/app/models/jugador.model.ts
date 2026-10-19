export type Posicion = 'REVES' | 'DRIVE' | 'INDISTINTO';

export const POSICIONES: { valor: Posicion; etiqueta: string }[] = [
  { valor: 'REVES', etiqueta: 'Revés' },
  { valor: 'DRIVE', etiqueta: 'Drive' },
  { valor: 'INDISTINTO', etiqueta: 'Indistinto' },
];

export const etiquetaPosicion = (p: string | null | undefined): string =>
  POSICIONES.find((x) => x.valor === p)?.etiqueta ?? '';

/** Datos de cuenta tal como los devuelve/recibe la API (UsuarioSerializer). */
export interface DatosUsuario {
  id?: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password?: string;
  password_actual?: string;
}

/** Perfil propio del jugador (RegistroJugadorSerializer). */
export interface Jugador {
  usuario: DatosUsuario;
  posicion: Posicion;
  zona: number | null;
}

/** Datos mínimos de un tercero (JugadorPublicoSerializer). */
export interface JugadorPublico {
  id: number;
  username: string;
  nombre: string;
  posicion: Posicion;
  zona: number | null;
}
