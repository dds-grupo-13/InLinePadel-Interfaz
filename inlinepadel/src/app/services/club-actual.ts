import { Service, computed, inject, signal } from '@angular/core';
import { Club } from '../models/club.model';
import { ClubService } from './club';

const CLAVE = 'club-actual';

@Service()
export class ClubActual {
  private readonly api = inject(ClubService);

  readonly clubes = signal<Club[]>([]);
  readonly cargado = signal(false);
  readonly error = signal<string | null>(null);
  private readonly _id = signal<number | null>(null);

  readonly club = computed(() => this.clubes().find((c) => c.id === this._id()) ?? this.clubes()[0] ?? null);

  private generacion = 0;
  private enCurso = false;

  /** Trae los clubes del usuario; si ya había datos los deja visibles mientras se refrescan. */
  cargar(): void {
    if (this.enCurso) return;
    this.enCurso = true;
    const gen = this.generacion;
    this.api.todos().subscribe({
      next: (cs) => {
        if (gen !== this.generacion) return;
        this.enCurso = false;
        this.clubes.set(cs);
        let guardado: number | null = null;
        try {
          guardado = Number(localStorage.getItem(CLAVE)) || null;
        } catch {}
        this._id.set(guardado);
        this.cargado.set(true);
      },
      error: () => {
        if (gen !== this.generacion) return;
        this.enCurso = false;
        this.error.set('No pudimos cargar los datos de tu club.');
      },
    });
  }

  /** Olvida todo lo del usuario anterior (se llama al cerrar sesión). */
  reiniciar(): void {
    this.generacion++;
    this.enCurso = false;
    this.clubes.set([]);
    this.cargado.set(false);
    this.error.set(null);
    this._id.set(null);
    try {
      localStorage.removeItem(CLAVE);
    } catch {}
  }

  elegir(id: number): void {
    this._id.set(id);
    try {
      localStorage.setItem(CLAVE, String(id));
    } catch {}
  }

  recargar(): void {
    this.cargar();
  }
}
