import { Component, computed, input } from '@angular/core';

const MAPA: Record<string, [string, string]> = {
  EN_FORMACION: ['En formación', 'info'], COMPLETO: ['Completo', 'ok'], JUGADO: ['Jugado', 'off'], CANCELADO: ['Cancelado', 'bad'],
  LIBRE: ['Libre', 'ok'], BLOQUEADO: ['Reserva provisoria', 'warn'], CONFIRMADO: ['Reserva confirmada', 'ok'],
  NO_DISPONIBLE: ['No disponible', 'off'], CUMPLIDO: ['Cumplido', 'off'],
  ACTIVO: ['Activo', 'ok'], SUSPENDIDO: ['Suspendido', 'warn'], BAJA: ['Dado de baja', 'bad'],
  PENDIENTE: ['Pendiente', 'warn'], ACEPTADA: ['Aceptada', 'ok'], ACEPTADO: ['Aceptado', 'ok'],
  RECHAZADA: ['Rechazada', 'bad'], RECHAZADO: ['Rechazado', 'bad'], EXPIRADA: ['Vencida', 'off'],
  PUBLICO: ['Pública', 'info'], PRIVADO: ['Solo invitados', 'off'],
  PROVISORIA: ['Reserva provisoria', 'warn'], CONFIRMADA: ['Reserva confirmada', 'ok'], CUMPLIDA: ['Reserva cumplida', 'off'],
};

@Component({
  selector: 'app-estado',
  template: `<span class="estado" [class]="clase()">{{ texto() }}</span>`,
})
export class Estado {
  readonly valor = input.required<string>();
  protected readonly texto = computed(() => MAPA[this.valor()]?.[0] ?? this.valor());
  protected readonly clase = computed(() => 'estado ' + (MAPA[this.valor()]?.[1] ?? 'off'));
}
