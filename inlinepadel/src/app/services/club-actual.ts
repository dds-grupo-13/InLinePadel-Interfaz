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

  cargar(): void {
    if (this.cargado()) return;
    this.api.todos().subscribe({
      next: (cs) => {
        this.clubes.set(cs);
        let guardado: number | null = null;
        try {
          guardado = Number(localStorage.getItem(CLAVE)) || null;
        } catch {}
        this._id.set(guardado);
        this.cargado.set(true);
      },
      error: () => this.error.set('No pudimos cargar los datos de tu club.'),
    });
  }

  elegir(id: number): void {
    this._id.set(id);
    try {
      localStorage.setItem(CLAVE, String(id));
    } catch {}
  }

  recargar(): void {
    this.cargado.set(false);
    this.cargar();
  }
}
