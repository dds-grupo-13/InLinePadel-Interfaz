const dos = (n: number) => String(n).padStart(2, '0');

export function aIso(d: Date): string {
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

export const hoyIso = (): string => aIso(new Date());

export function sumarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  return aIso(new Date(a, m - 1, d + dias));
}

export const hhmm = (hora: string | null | undefined): string => (hora ?? '').slice(0, 5);

export function sumarMinutos(hora: string, minutos: number): string | null {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + minutos;
  if (total >= 24 * 60) return null;
  return `${dos(Math.floor(total / 60))}:${dos(total % 60)}`;
}

export const iniciales = (nombre: string): string =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
