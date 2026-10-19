import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, WritableSignal, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Cancha, TurnoNuevo } from '../../models/club.model';
import { CanchaService } from '../../services/cancha';
import { ClubActual } from '../../services/club-actual';
import { ToastService } from '../../services/toast';
import { TurnoService } from '../../services/turno';
import { leerError } from '../../utils/errores';
import { aIso, hoyIso, sumarDias, sumarMinutos } from '../../utils/fechas';
import { ClubSelector } from '../shared/club-selector/club-selector';

const MAX = 500;
const DIAS = [
  { n: 1, corto: 'L', largo: 'Lunes' }, { n: 2, corto: 'M', largo: 'Martes' }, { n: 3, corto: 'X', largo: 'Miércoles' },
  { n: 4, corto: 'J', largo: 'Jueves' }, { n: 5, corto: 'V', largo: 'Viernes' }, { n: 6, corto: 'S', largo: 'Sábado' },
  { n: 0, corto: 'D', largo: 'Domingo' },
];

/** Publica de una vez la grilla de varios días y canchas (una sola operación: se crean todos o ninguno). */
@Component({
  imports: [FormsModule, RouterLink, DatePipe, CurrencyPipe, ClubSelector],
  selector: 'app-turno-add',
  templateUrl: './turno-add.html',
})
export class TurnoAdd {
  protected readonly ctx = inject(ClubActual);
  private readonly canchaService = inject(CanchaService);
  private readonly turnoService = inject(TurnoService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly dias = DIAS;
  readonly max = MAX;
  readonly hoy = hoyIso();
  readonly canchas = signal<Cancha[]>([]);
  readonly cargando = signal(true);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);

  // el formulario guarda su estado en estadoes para que el resumen se recalcule solo
  readonly elegidas = signal<Set<number>>(new Set());
  readonly diasSemana = signal<Set<number>>(new Set([0, 1, 2, 3, 4, 5, 6]));
  readonly desde = signal(hoyIso());
  readonly hasta = signal(sumarDias(hoyIso(), 6));
  readonly primera = signal('18:00');
  readonly ultima = signal('22:30');
  readonly duracion = signal(90);
  readonly precio = signal<number | null>(null);

  readonly turnos = computed<TurnoNuevo[]>(() => {
    const precio = this.precio();
    if (precio == null || !this.elegidas().size || !this.primera() || !this.ultima() || !this.desde() || !this.hasta()) return [];
    const horas: string[] = [];
    for (let h: string | null = this.primera(); h && h <= this.ultima(); h = sumarMinutos(h, this.duracion())) horas.push(h);
    const ahora = new Date();
    const lista: TurnoNuevo[] = [];
    for (let f = this.desde(); f <= this.hasta(); f = sumarDias(f, 1)) {
      const [a, m, d] = f.split('-').map(Number);
      if (!this.diasSemana().has(new Date(a, m - 1, d).getDay())) continue;
      for (const cancha of this.elegidas()) {
        for (const h of horas) {
          const [hh, mm] = h.split(':').map(Number);
          if (new Date(a, m - 1, d, hh, mm) <= ahora) continue; // no se publican horarios que ya pasaron
          lista.push({ cancha, fecha: f, hora_inicio: h, duracion: this.duracion(), precio });
        }
      }
    }
    return lista;
  });
  readonly excede = computed(() => this.turnos().length > MAX);
  readonly cantDias = computed(() => new Set(this.turnos().map((t) => t.fecha)).size);

  constructor() {
    this.ctx.cargar();
    effect(() => {
      const club = this.ctx.club();
      if (club) untracked(() => this.cargarCanchas(club.id));
    });
  }

  private cargarCanchas(id: number): void {
    this.cargando.set(true);
    this.canchaService.delClub(id).subscribe({
      next: (c) => {
        const activas = c.filter((x) => x.activa).sort((a, b) => a.numero - b.numero);
        this.canchas.set(activas);
        this.elegidas.set(new Set(activas.map((x) => x.id)));
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(leerError(e, 'No pudimos cargar las canchas.').mensaje);
        this.cargando.set(false);
      },
    });
  }

  alternar(estado: WritableSignal<Set<number>>, valor: number): void {
    estado.update((s) => {
      const n = new Set(s);
      n.has(valor) ? n.delete(valor) : n.add(valor);
      return n;
    });
  }

  publicar(): void {
    const lista = this.turnos();
    if (!lista.length || this.excede()) return;
    this.enviando.set(true);
    this.error.set(null);
    this.turnoService.crearMasivo(lista).subscribe({
      next: (creados) => {
        this.toast.ok(`Publicaste ${creados.length} turnos.`);
        this.router.navigate(['/club/turnos']);
      },
      error: (e) => {
        this.enviando.set(false);
        this.error.set(leerError(e, 'No pudimos publicar los turnos. No se creó ninguno.').mensaje);
      },
    });
  }
}
