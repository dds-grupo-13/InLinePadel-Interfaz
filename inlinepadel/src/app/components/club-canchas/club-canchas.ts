import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Cancha, TipoCancha } from '../../models/club.model';
import { CanchaService } from '../../services/cancha';
import { ClubActual } from '../../services/club-actual';
import { ConfirmarService } from '../../services/confirmar';
import { ToastService } from '../../services/toast';
import { leerError } from '../../utils/errores';
import { ClubSelector } from '../shared/club-selector/club-selector';
import { Modal } from '../shared/modal/modal';

@Component({
  imports: [FormsModule, Modal, ClubSelector],
  selector: 'app-club-canchas',
  templateUrl: './club-canchas.html',
})
export class ClubCanchas {
  protected readonly ctx = inject(ClubActual);
  private readonly api = inject(CanchaService);
  private readonly toast = inject(ToastService);
  private readonly confirmar = inject(ConfirmarService);

  readonly canchas = signal<Cancha[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  // formulario (alta y edición)
  readonly formAbierto = signal(false);
  readonly enviando = signal(false);
  readonly errorForm = signal<string | null>(null);
  readonly erroresCampos = signal<Record<string, string>>({});
  editando: Cancha | null = null;
  numero: number | null = null;
  tipo: TipoCancha = 'TECHADA';
  activa = true;

  readonly sugerido = computed(() => (this.canchas().reduce((m, c) => Math.max(m, c.numero), 0) || 0) + 1);

  constructor() {
    this.ctx.cargar();
    effect(() => {
      const club = this.ctx.club();
      if (club) untracked(() => this.cargar());
    });
  }

  cargar(): void {
    const club = this.ctx.club();
    if (!club) return;
    this.cargando.set(true);
    this.api.delClub(club.id).subscribe({
      next: (c) => {
        this.canchas.set([...c].sort((a, b) => a.numero - b.numero));
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(leerError(e, 'No pudimos cargar las canchas.').mensaje);
        this.cargando.set(false);
      },
    });
  }

  abrirForm(c: Cancha | null): void {
    this.editando = c;
    this.numero = c?.numero ?? this.sugerido();
    this.tipo = c?.tipo ?? 'TECHADA';
    this.activa = c?.activa ?? true;
    this.errorForm.set(null);
    this.erroresCampos.set({});
    this.formAbierto.set(true);
  }

  guardar(): void {
    const club = this.ctx.club();
    if (!club || this.numero == null) return;
    this.enviando.set(true);
    this.errorForm.set(null);
    const datos = { numero: this.numero, tipo: this.tipo, activa: this.activa };
    const op = this.editando ? this.api.editar(this.editando.id, datos) : this.api.crear({ ...datos, club: club.id });
    op.subscribe({
      next: () => {
        this.enviando.set(false);
        this.formAbierto.set(false);
        this.toast.ok(this.editando ? 'Guardamos los cambios de la cancha.' : `Cancha ${this.numero} creada.`);
        this.cargar();
      },
      error: (e) => {
        this.enviando.set(false);
        const r = leerError(e, 'No pudimos guardar la cancha.');
        this.erroresCampos.set(r.campos);
        this.errorForm.set(r.mensaje);
      },
    });
  }

  alternarActiva(c: Cancha): void {
    this.api.editar(c.id, { activa: !c.activa }).subscribe({
      next: () => {
        this.toast.ok(c.activa ? `La cancha ${c.numero} dejó de ofrecerse.` : `La cancha ${c.numero} vuelve a ofrecerse.`);
        this.cargar();
      },
      error: (e) => this.toast.error(leerError(e, 'No pudimos cambiar la cancha.').mensaje),
    });
  }

  async eliminar(c: Cancha): Promise<void> {
    const ok = await this.confirmar.pedirConfirmacion({
      titulo: `Eliminar la cancha ${c.numero}`,
      mensaje: 'Si la cancha ya tuvo turnos publicados no se borra: queda inactiva para conservar el historial. Si nunca tuvo turnos, se elimina.',
      confirmar: 'Eliminar cancha',
      peligro: true,
    });
    if (!ok) return;
    this.api.eliminar(c.id).subscribe({
      next: () => {
        this.toast.ok('Listo, la cancha ya no se ofrece.');
        this.cargar();
      },
      error: (e) => this.toast.error(leerError(e, 'No pudimos eliminar la cancha.').mensaje),
    });
  }
}
