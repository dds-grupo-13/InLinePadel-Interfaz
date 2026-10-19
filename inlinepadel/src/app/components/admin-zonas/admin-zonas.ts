import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Zona } from '../../models/club.model';
import { ConfirmarService } from '../../services/confirmar';
import { ToastService } from '../../services/toast';
import { ZonaService } from '../../services/zona';
import { leerError } from '../../utils/errores';

@Component({
  imports: [FormsModule],
  selector: 'app-admin-zonas',
  templateUrl: './admin-zonas.html',
})
export class AdminZonas implements OnInit {
  private readonly api = inject(ZonaService);
  private readonly toast = inject(ToastService);
  private readonly confirmar = inject(ConfirmarService);

  readonly zonas = signal<Zona[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly editando = signal<number | null>(null);
  nueva = '';
  nombreEdicion = '';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.getAll().subscribe({
      next: (z) => {
        this.zonas.set(z);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(leerError(e, 'No pudimos cargar las zonas.').mensaje);
        this.cargando.set(false);
      },
    });
  }

  agregar(): void {
    const nombre = this.nueva.trim();
    if (!nombre) return;
    this.api.crear(nombre).subscribe({
      next: () => {
        this.nueva = '';
        this.toast.ok('Zona creada.');
        this.cargar();
      },
      error: (e) => this.toast.error(leerError(e, 'No pudimos crear la zona.').mensaje),
    });
  }

  editar(z: Zona): void {
    this.editando.set(z.id);
    this.nombreEdicion = z.nombre;
  }

  guardar(z: Zona): void {
    const nombre = this.nombreEdicion.trim();
    if (!nombre) return;
    this.api.editar(z.id, nombre).subscribe({
      next: () => {
        this.editando.set(null);
        this.toast.ok('Guardamos el nombre de la zona.');
        this.cargar();
      },
      error: (e) => this.toast.error(leerError(e, 'No pudimos guardar la zona.').mensaje),
    });
  }

  async eliminar(z: Zona): Promise<void> {
    const ok = await this.confirmar.pedirConfirmacion({
      titulo: 'Eliminar zona',
      mensaje: `Se elimina la zona ${z.nombre}. Si tiene clubes asociados no se puede eliminar.`,
      confirmar: 'Eliminar zona',
      peligro: true,
    });
    if (!ok) return;
    this.api.eliminar(z.id).subscribe({
      next: () => {
        this.toast.ok('Zona eliminada.');
        this.cargar();
      },
      error: (e) => {
        const r = leerError(e, 'No pudimos eliminar la zona.');
        this.toast.error(r.status === 409 ? 'No se puede eliminar: hay clubes en esa zona.' : r.mensaje);
      },
    });
  }
}
