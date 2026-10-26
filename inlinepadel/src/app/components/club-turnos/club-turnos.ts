import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Cancha, Turno } from '../../models/club.model';
import { CanchaService } from '../../services/cancha';
import { ClubActual } from '../../services/club-actual';
import { ConfirmarService } from '../../services/confirmar';
import { ToastService } from '../../services/toast';
import { TurnoService } from '../../services/turno';
import { leerError } from '../../utils/errores';
import { hhmm, hoyIso, sumarDias } from '../../utils/fechas';
import { HhmmPipe } from '../../utils/hhmm.pipe';
import { ClubSelector } from '../shared/club-selector/club-selector';
import { Estado } from '../shared/estado/estado';
import { Modal } from '../shared/modal/modal';

@Component({
  imports: [FormsModule, RouterLink, DatePipe, CurrencyPipe, HhmmPipe, Estado, Modal, ClubSelector],
  selector: 'app-club-turnos',
  templateUrl: './club-turnos.html',
})
export class ClubTurnos {
  protected readonly ctx = inject(ClubActual);
  private readonly turnoService = inject(TurnoService);
  private readonly canchaService = inject(CanchaService);
  private readonly toast = inject(ToastService);
  private readonly confirmar = inject(ConfirmarService);

  readonly fecha = signal(hoyIso());
  readonly turnos = signal<Turno[]>([]);
  readonly canchas = signal<Cancha[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly elegido = signal<Turno | null>(null);
  readonly editando = signal(false);
  readonly ocupado = signal(false);
  readonly errorForm = signal<string | null>(null);
  f = { fecha: '', hora_inicio: '', duracion: 90, precio: 0, cancha: 0 };

  readonly columnas = computed(() => {
    const porCancha = new Map<number, Turno[]>();
    for (const t of this.turnos()) porCancha.set(t.cancha, [...(porCancha.get(t.cancha) ?? []), t]);
    const conocidas = this.canchas().map((c) => ({ cancha: c, turnos: (porCancha.get(c.id) ?? []).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)) }));
    return conocidas.filter((c) => c.turnos.length || c.cancha.activa);
  });

  protected readonly estaEditable = (t: Turno) => t.estado === 'LIBRE' || t.estado === 'NO_DISPONIBLE';

  constructor() {
    this.ctx.cargar();
    effect(() => {
      const club = this.ctx.club();
      this.fecha();
      if (club) untracked(() => this.cargar());
    });
  }

  mover(dias: number): void {
    this.fecha.set(sumarDias(this.fecha(), dias));
  }

  cargar(): void {
    const club = this.ctx.club();
    if (!club) return;
    this.cargando.set(true);
    this.error.set(null);
    this.canchaService.delClub(club.id).subscribe({ next: (c) => this.canchas.set([...c].sort((a, b) => a.numero - b.numero)), error: () => {} });
    this.turnoService.buscar({ club: club.id, fecha: this.fecha() }).subscribe({
      next: (t) => {
        this.turnos.set(t);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(leerError(e, 'No pudimos cargar los turnos.').mensaje);
        this.cargando.set(false);
      },
    });
  }

  abrir(t: Turno): void {
    this.elegido.set(t);
    this.editando.set(false);
    this.errorForm.set(null);
  }

  cerrar(): void {
    this.elegido.set(null);
    this.editando.set(false);
  }

  empezarEdicion(): void {
    const t = this.elegido()!;
    this.f = { fecha: t.fecha, hora_inicio: hhmm(t.hora_inicio), duracion: t.duracion, precio: Number(t.precio), cancha: t.cancha };
    this.errorForm.set(null);
    this.editando.set(true);
  }

  guardarEdicion(): void {
    const t = this.elegido()!;
    this.ocupado.set(true);
    this.errorForm.set(null);
    this.turnoService.editar(t.id, { ...this.f }).subscribe({
      next: () => {
        this.ocupado.set(false);
        this.cerrar();
        this.toast.ok('Guardamos los cambios del turno.');
        this.cargar();
      },
      error: (e) => {
        this.ocupado.set(false);
        this.errorForm.set(leerError(e, 'No pudimos guardar el turno.').mensaje);
      },
    });
  }

  private cambiarOferta(accion: 'no_disponible' | 'disponible'): void {
    const t = this.elegido()!;
    this.ocupado.set(true);
    const op = accion === 'no_disponible' ? this.turnoService.noDisponible(t.id) : this.turnoService.disponible(t.id);
    op.subscribe({
      next: () => {
        this.ocupado.set(false);
        this.cerrar();
        this.toast.ok(accion === 'no_disponible' ? 'Retiramos el turno de la oferta.' : 'El turno vuelve a ofrecerse.');
        this.cargar();
      },
      error: (e) => {
        this.ocupado.set(false);
        this.cerrar();
        this.toast.error(leerError(e, 'No pudimos cambiar el turno.').mensaje);
        this.cargar();
      },
    });
  }

  retirar(): void { this.cambiarOferta('no_disponible'); }
  publicar(): void { this.cambiarOferta('disponible'); }

  async eliminar(): Promise<void> {
    const t = this.elegido()!;
    const ok = await this.confirmar.pedirConfirmacion({
      titulo: 'Eliminar turno',
      mensaje: `Se borra el turno de las ${hhmm(t.hora_inicio)} de la cancha ${t.cancha_numero}. No se puede deshacer.`,
      confirmar: 'Eliminar turno',
      peligro: true,
    });
    if (!ok) return;
    this.turnoService.eliminar(t.id).subscribe({
      next: () => {
        this.cerrar();
        this.toast.ok('Turno eliminado.');
        this.cargar();
      },
      error: (e) => {
        this.cerrar();
        this.toast.error(leerError(e, 'No pudimos eliminar el turno.').mensaje);
        this.cargar();
      },
    });
  }
}
