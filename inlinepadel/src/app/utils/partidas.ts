import { Turno } from '../models/club.model';
import { Lobby } from '../models/lobby.model';

/** Nombre del capitán a partir de las inscripciones del lobby. */
export function capitanDe(lobby: Lobby): string {
  const inscripcion = lobby.inscripciones.find((i) => i.jugador.id === lobby.capitan);
  return inscripcion?.jugador.nombre || inscripcion?.jugador.username || 'Sin capitán';
}

/** Cantidad de partidas por club (clave: id del club). */
export function conteoPorClub(lobbies: Lobby[]): Map<number, number> {
  const conteo = new Map<number, number>();
  for (const l of lobbies) {
    const club = l.turno_detalle.club;
    conteo.set(club, (conteo.get(club) ?? 0) + 1);
  }
  return conteo;
}

/** Agrupa los lobbies por día, ordenados por fecha y hora. */
export function agruparPorDia(lobbies: Lobby[]): { fecha: string; lobbies: Lobby[] }[] {
  const porFecha = new Map<string, Lobby[]>();
  for (const l of lobbies) {
    const fecha = l.turno_detalle.fecha;
    const lista = porFecha.get(fecha);
    if (lista) {
      lista.push(l);
    } else {
      porFecha.set(fecha, [l]);
    }
  }
  return [...porFecha.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, items]) => ({
      fecha,
      lobbies: items.sort((a, b) => a.turno_detalle.inicio.localeCompare(b.turno_detalle.inicio)),
    }));
}

export interface GrupoTurno {
  hora: string;
  duracion: number;
  turnos: Turno[];
}

/** Agrupa los turnos libres por horario: una fila por hora, con sus canchas. */
export function agruparTurnos(turnos: Turno[]): GrupoTurno[] {
  const porHora = new Map<string, Turno[]>();
  for (const t of turnos) {
    const lista = porHora.get(t.hora_inicio);
    if (lista) {
      lista.push(t);
    } else {
      porHora.set(t.hora_inicio, [t]);
    }
  }
  return [...porHora.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hora, items]) => ({
      hora,
      duracion: items[0].duracion,
      turnos: items.sort((a, b) => a.cancha_numero - b.cancha_numero),
    }));
}

/** Una partida es unible si está abierta, tiene lugar y es pública o el jugador fue invitado. */
export function sePuedeUnir(lobby: Lobby): boolean {
  return (
    lobby.estado === 'EN_FORMACION' &&
    lobby.cupos_libres > 0 &&
    (lobby.privacidad === 'PUBLICO' || lobby.fui_invitado)
  );
}
