import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClubForm as ClubFormDatos, Zona } from '../../models/club.model';
import { ClubService } from '../../services/club';
import { ToastService } from '../../services/toast';
import { ZonaService } from '../../services/zona';
import { leerError } from '../../utils/errores';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-club-form',
  templateUrl: './club-form.html',
})
export class ClubForm implements OnInit {
  readonly id = input<string>();

  private readonly api = inject(ClubService);
  private readonly zonaService = inject(ZonaService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly zonas = signal<Zona[]>([]);
  readonly cargando = signal(false);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly errores = signal<Record<string, string>>({});
  readonly esEdicion = computed(() => !!this.id());

  f: Partial<ClubFormDatos> = { denominacion: '', direccion: '', admin_username: '', admin_email: '', admin_password: '' };
  zona: number | null = null;
  modoAdmin: 'nuevo' | 'existente' = 'nuevo';
  adminExistente: number | null = null;

  ngOnInit(): void {
    this.zonaService.getAll().subscribe({ next: (z) => this.zonas.set(z), error: () => {} });
    const id = this.id();
    if (id) {
      this.cargando.set(true);
      this.api.get(+id).subscribe({
        next: (c) => {
          this.f = { denominacion: c.denominacion, direccion: c.direccion };
          this.zona = c.zona;
          this.cargando.set(false);
        },
        error: (e) => {
          this.error.set(leerError(e, 'No pudimos cargar el club.').mensaje);
          this.cargando.set(false);
        },
      });
    }
  }

  guardar(): void {
    if (this.zona == null) return;
    this.enviando.set(true);
    this.error.set(null);
    this.errores.set({});
    const base = { denominacion: this.f.denominacion!.trim(), direccion: this.f.direccion!.trim(), zona: this.zona };
    const id = this.id();
    let op;
    if (id) {
      op = this.api.editar(+id, base);
    } else if (this.modoAdmin === 'existente') {
      op = this.api.crear({ ...base, admin: this.adminExistente! });
    } else {
      op = this.api.crear({ ...base, admin_username: this.f.admin_username!.trim(), admin_email: this.f.admin_email!.trim(), admin_password: this.f.admin_password! });
    }
    op.subscribe({
      next: () => {
        this.toast.ok(id ? 'Guardamos los cambios del club.' : 'Club habilitado. Ya puede cargar sus canchas y turnos.');
        this.router.navigate(['/admin/clubes']);
      },
      error: (e) => {
        this.enviando.set(false);
        const r = leerError(e, 'No pudimos guardar el club.');
        this.errores.set(r.campos);
        this.error.set(r.mensaje);
      },
    });
  }
}
