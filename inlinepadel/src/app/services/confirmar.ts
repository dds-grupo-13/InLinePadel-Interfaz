import { Service, signal } from '@angular/core';

export interface PedidoConfirmacion {
  titulo: string;
  mensaje: string;
  confirmar?: string;
  cancelar?: string;
  peligro?: boolean;
}

/** Diálogo de confirmación para acciones que no se pueden deshacer. */
@Service()
export class ConfirmarService {
  readonly pedido = signal<PedidoConfirmacion | null>(null);
  private resolver: ((v: boolean) => void) | null = null;

  pedirConfirmacion(p: PedidoConfirmacion): Promise<boolean> {
    this.resolver?.(false);
    this.pedido.set(p);
    return new Promise<boolean>((res) => (this.resolver = res));
  }

  responder(valor: boolean): void {
    this.pedido.set(null);
    this.resolver?.(valor);
    this.resolver = null;
  }
}
