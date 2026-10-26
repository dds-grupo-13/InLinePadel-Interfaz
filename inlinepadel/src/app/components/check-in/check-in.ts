import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LobbyService } from '../../services/lobby';
import { leerError } from '../../utils/errores';

@Component({
  imports: [FormsModule],
  selector: 'app-check-in',
  templateUrl: './check-in.html',
})
export class CheckIn {
  private readonly lobbies = inject(LobbyService);

  codigo = '';
  readonly enviando = signal(false);
  readonly resultado = signal<{ ok: boolean; texto: string } | null>(null);

  formatear(): void {
    const limpio = this.codigo.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 8);
    this.codigo = limpio.length > 4 ? `${limpio.slice(0, 4)}-${limpio.slice(4)}` : limpio;
  }

  validar(): void {
    this.resultado.set(null);
    this.enviando.set(true);
    this.lobbies.checkIn(this.codigo).subscribe({
      next: () => {
        this.enviando.set(false);
        this.resultado.set({ ok: true, texto: 'Llegada registrada. ¡Que disfruten el partido!' });
        this.codigo = '';
      },
      error: (e) => {
        this.enviando.set(false);
        this.resultado.set({ ok: false, texto: leerError(e, 'No pudimos validar el código.').mensaje });
      },
    });
  }
}
