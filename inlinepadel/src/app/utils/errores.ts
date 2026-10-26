import { HttpErrorResponse } from '@angular/common/http';

export interface ErrorApi {
  status: number;
  mensaje: string;
  campos: Record<string, string>;
}

const ETIQUETAS: Record<string, string> = {
  username: 'Usuario',
  email: 'Email',
  first_name: 'Nombre',
  last_name: 'Apellido',
  password: 'Contraseña',
  password_actual: 'Contraseña actual',
  denominacion: 'Nombre del club',
  direccion: 'Dirección',
  zona: 'Zona',
  nombre: 'Nombre',
  numero: 'Número de cancha',
  tipo: 'Tipo de cancha',
  fecha: 'Fecha',
  hora_inicio: 'Hora de inicio',
  duracion: 'Duración',
  precio: 'Precio',
  cancha: 'Cancha',
  turno: 'Turno',
  privacidad: 'Privacidad',
  posicion: 'Posición',
  codigo_reserva: 'Código de reserva',
  contacto: 'Contacto',
  receptor: 'Jugador invitado',
  admin: 'Administrador',
  admin_username: 'Usuario del administrador',
  admin_email: 'Email del administrador',
  admin_password: 'Contraseña del administrador',
};

const GENERALES = new Set(['detail', 'non_field_errors']);

function aplanar(valor: unknown, clave: string, generales: string[], campos: Record<string, string>): void {
  if (valor == null) return;
  if (typeof valor === 'string') {
    if (!clave || GENERALES.has(clave)) generales.push(valor);
    else campos[clave] = campos[clave] ? `${campos[clave]} ${valor}` : valor;
    return;
  }
  if (Array.isArray(valor)) {
    valor.forEach((v) => aplanar(v, clave, generales, campos));
    return;
  }
  if (typeof valor === 'object') {
    for (const [k, v] of Object.entries(valor as Record<string, unknown>)) aplanar(v, k, generales, campos);
  }
}

export function leerError(err: unknown, porDefecto = 'No se pudo completar la operación. Probá de nuevo.'): ErrorApi {
  if (!(err instanceof HttpErrorResponse)) return { status: -1, mensaje: porDefecto, campos: {} };
  const status = err.status;
  if (status === 0) {
    return { status, campos: {}, mensaje: 'No hay conexión con el servidor. Revisá tu internet e intentá de nuevo.' };
  }
  if (status === 429) {
    return { status, campos: {}, mensaje: 'Hiciste demasiados intentos seguidos. Esperá unos minutos y volvé a probar.' };
  }
  if (status >= 500) {
    return { status, campos: {}, mensaje: 'Hubo un problema en el servidor. Intentá de nuevo en unos minutos.' };
  }
  const generales: string[] = [];
  const campos: Record<string, string> = {};
  aplanar(err.error, '', generales, campos);
  const partes = [...generales, ...Object.entries(campos).map(([k, m]) => `${ETIQUETAS[k] ? ETIQUETAS[k] + ': ' : ''}${m}`)];
  let mensaje = partes.join(' ');
  if (!mensaje) {
    mensaje =
      status === 401 ? 'Tu sesión venció. Volvé a iniciar sesión.'
      : status === 403 ? 'No tenés permiso para hacer esto.'
      : status === 404 ? 'No encontramos lo que buscabas. Puede que ya no exista.'
      : porDefecto;
  }
  return { status, mensaje, campos };
}
