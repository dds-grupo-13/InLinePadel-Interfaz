import { Service, signal } from '@angular/core';

export interface Aviso {
  id: number;
  tipo: 'ok' | 'error' | 'info';
  texto: string;
}

@Service()
export class ToastService {
  private siguiente = 1;
  readonly avisos = signal<Aviso[]>([]);

  ok(texto: string): void { this.mostrar('ok', texto); }
  error(texto: string): void { this.mostrar('error', texto, 8000); }
  info(texto: string): void { this.mostrar('info', texto); }

  cerrar(id: number): void {
    this.avisos.update((l) => l.filter((a) => a.id !== id));
  }

  private mostrar(tipo: Aviso['tipo'], texto: string, ms = 5000): void {
    const id = this.siguiente++;
    this.avisos.update((l) => [...l.slice(-2), { id, tipo, texto }]);
    setTimeout(() => this.cerrar(id), ms);
  }
}
