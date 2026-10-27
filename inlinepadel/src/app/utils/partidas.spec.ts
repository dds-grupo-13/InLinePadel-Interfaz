import { describe, expect, it } from 'vitest';
import { Turno } from '../models/club.model';
import { Lobby } from '../models/lobby.model';
import { agruparPorDia, agruparTurnos, capitanDe, resumenesPorClub, sePuedeUnir } from './partidas';

const turno = (extra: Partial<Turno> = {}): Turno => ({
  id: 1,
  fecha: '2026-10-20',
  hora_inicio: '20:00:00',
  duracion: 90,
  precio: '40000.00',
  estado: 'LIBRE',
  cancha: 1,
  inicio: '2026-10-20T20:00:00',
  fin: '2026-10-20T21:30:00',
  club: 1,
  club_nombre: 'Club Norte',
  cancha_numero: 1,
  cancha_tipo: 'TECHADA',
  ...extra,
});

const lobby = (extra: Partial<Lobby> = {}): Lobby => ({
  id: 1,
  privacidad: 'PUBLICO',
  estado: 'EN_FORMACION',
  fecha_creacion: '2026-10-19T10:00:00',
  plazo_limite: '2026-10-21T10:00:00',
  fecha_check_in: '2026-10-20T19:00:00',
  capitan: 1,
  es_capitan: false,
  fui_invitado: false,
  turno: 1,
  turno_detalle: turno(),
  inscripciones: [
    {
      id: 1,
      lobby: 1,
      jugador: { id: 1, username: 'nico', nombre: 'Nico', posicion: 'DRIVE', zona: null },
      numero_cupo: 1,
      fecha_inscripcion: '2026-10-19T10:00:00',
    },
  ],
  cupos_ocupados: 1,
  cupos_libres: 3,
  precio_total: '40000.00',
  precio_por_jugador: '10000.00',
  estado_reserva: 'PROVISORIA',
  mensaje_reserva: '',
  codigo_reserva: null,
  ...extra,
});

describe('partidas', () => {
  it('encuentra el nombre del capitán', () => {
    expect(capitanDe(lobby())).toBe('Nico');
  });

  it('usa el username si el capitán no tiene nombre', () => {
    const l = lobby({
      inscripciones: [
        {
          id: 1,
          lobby: 1,
          jugador: { id: 1, username: 'nico', nombre: '', posicion: 'DRIVE', zona: null },
          numero_cupo: 1,
          fecha_inscripcion: '',
        },
      ],
    });
    expect(capitanDe(l)).toBe('nico');
  });

  it('adapta el resumen que devuelve el backend por club', () => {
    const resumen = resumenesPorClub([
      { club: 1, disponibles: 2, cupos_libres: 5, invitaciones: 1, proximo: { id: 2, fecha: '2026-10-20', hora_inicio: '18:00:00', inicio: '2026-10-20T18:00:00' } },
      { club: 2, disponibles: 1, cupos_libres: 3, invitaciones: 0, proximo: null },
    ]);
    expect(resumen.get(1)).toEqual({
      disponibles: 2,
      invitaciones: 1,
      cuposLibres: 5,
      proximo: { id: 2, fecha: '2026-10-20', hora_inicio: '18:00:00', inicio: '2026-10-20T18:00:00' },
    });
    expect(resumen.get(2)?.proximo).toBeNull();
    expect(resumen.has(3)).toBe(false);
  });

  it('agrupa por día y ordena por fecha y hora', () => {
    const grupos = agruparPorDia([
      lobby({ id: 1, turno_detalle: turno({ fecha: '2026-10-21', inicio: '2026-10-21T20:00:00' }) }),
      lobby({ id: 2, turno_detalle: turno({ fecha: '2026-10-20', inicio: '2026-10-20T09:00:00' }) }),
      lobby({ id: 3, turno_detalle: turno({ fecha: '2026-10-20', inicio: '2026-10-20T18:00:00' }) }),
    ]);
    expect(grupos.map((g) => g.fecha)).toEqual(['2026-10-20', '2026-10-21']);
    expect(grupos[0].lobbies.map((l) => l.id)).toEqual([2, 3]);
  });

  it('agrupa turnos por hora y ordena las canchas', () => {
    const grupos = agruparTurnos([
      turno({ id: 1, hora_inicio: '20:00:00', cancha_numero: 2 }),
      turno({ id: 2, hora_inicio: '18:00:00', cancha_numero: 1 }),
      turno({ id: 3, hora_inicio: '20:00:00', cancha_numero: 1 }),
    ]);
    expect(grupos.map((g) => g.hora)).toEqual(['18:00:00', '20:00:00']);
    expect(grupos[1].turnos.map((t) => t.cancha_numero)).toEqual([1, 2]);
  });

  it('solo permite unirse a públicas con cupo o privadas invitadas', () => {
    expect(sePuedeUnir(lobby())).toBe(true);
    expect(sePuedeUnir(lobby({ privacidad: 'PRIVADO' }))).toBe(false);
    expect(sePuedeUnir(lobby({ privacidad: 'PRIVADO', fui_invitado: true }))).toBe(true);
    expect(sePuedeUnir(lobby({ cupos_libres: 0 }))).toBe(false);
    expect(sePuedeUnir(lobby({ estado: 'COMPLETO' }))).toBe(false);
  });
});
