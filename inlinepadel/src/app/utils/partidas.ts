import { Turno } from '../models/club.model';
import { Lobby, ProximoLobby, ResumenClubApi } from '../models/lobby.model';

export function capitanDe(lobby: Lobby): string {
  const inscripcion = lobby.inscripciones.find((i) => i.jugador.id === lobby.capitan);
  return inscripcion?.jugador.nombre || inscripcion?.jugador.username || 'Sin capitán';
}

export interface ResumenClub {
  disponibles: number;
  invitaciones: number;
  cuposLibres: number;
  proximo: ProximoLobby | null;
}

export function resumenesPorClub(filas: ResumenClubApi[]): Map<number, ResumenClub> {
  return new Map(
    filas.map((f) => [
      f.club,
      { disponibles: f.disponibles, invitaciones: f.invitaciones, cuposLibres: f.cupos_libres, proximo: f.proximo },
    ]),
  );
}

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

export function sePuedeUnir(lobby: Lobby): boolean {
  return (
    lobby.estado === 'EN_FORMACION' &&
    !lobby.vencido &&
    lobby.cupos_libres > 0 &&
    (lobby.privacidad === 'PUBLICO' || lobby.fui_invitado)
  );
}
