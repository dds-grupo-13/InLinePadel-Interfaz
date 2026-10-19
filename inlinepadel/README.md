# InLine Padel — Interfaz (Angular)

Frontend del sistema InLine Padel (Grupo 13, Desarrollo de Software, UTN FRD). Consume la API del repositorio `InLinePadel` (Django REST).

## Cómo correrlo

1. Levantar el backend en `http://localhost:8000` (ver el README del repositorio `InLinePadel`).
2. En esta carpeta:

```bash
npm install
ng serve        # http://localhost:4200, las llamadas a /api se redirigen al backend con src/proxy.conf.json
ng test         # pruebas unitarias (Vitest)
ng build        # build de producción (bundle inicial ~650 kB, el límite del RNF es 1,5 MB)
```

## Correrlo con Docker (local)

Sigue el diagrama de despliegue: un contenedor por nodo (Servidor Web, Servidor de Aplicación, Servidor de Base de Datos). El `docker-compose.yml` vive en este repo y asume que el backend (`InLinePadel`) está clonado como carpeta hermana; el `Dockerfile` del backend está en su propio repo.

```bash
cd InLinePadel-Interfaz
docker compose up --build
```

- Aplicación: http://localhost:4200 (nginx con el build de Angular)
- API: http://localhost:8000/api (gunicorn + Django)
- Base: PostgreSQL en el volumen `pgdata` (las migraciones corren solas al arrancar)
- Primer administrador: `docker compose exec app python manage.py createsuperuser`

Los valores por defecto sirven solo para local; para cambiarlos copiá `.env.example` a `.env` junto al compose. Para frenar: `docker compose down` (con `-v` también borra los datos).

## Pantallas por rol

La barra superior (y la barra inferior en celular) muestra solo lo que corresponde al rol del usuario.

| Rol | Pantallas |
|---|---|
| Sin sesión | Ingresar, Crear cuenta |
| Jugador | Partidas (buscar con filtros), Nueva partida (4 pasos), Detalle de partida (reserva, código, invitar, solicitudes), Mis partidas, Contactos, Pedidos, Perfil |
| Administrador de club | Resumen, Canchas, Turnos (grilla), Publicar turnos (masivo), Ocupación, Check-in por código |
| Administrador del sistema | Clubes (alta, suspensión, baja), Zonas |
| Todos | Notificaciones |

## Estructura

- `models/`: tipos de la API. `services/`: acceso HTTP y estado compartido. `guards/`: acceso por rol. `utils/`: errores en lenguaje natural, fechas, paginación.
- `components/`: una pantalla por carpeta; `components/shared/` tiene las piezas reutilizables (estado, cancha con cupos, banner de reserva, paginador, modal).
- Estilos: Bootstrap 5.3 + tema propio en `src/styles.css` (modo claro/oscuro según el sistema).

## Notas

- Los errores del backend (incluido el 409) se muestran en lenguaje natural, nunca con códigos técnicos.
- Material extra respecto de la bibliografía de la cátedra: Bootstrap Icons y las fuentes autoalojadas (`@fontsource`).

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Conexión con el backend (JWT)

- `apiUrl` está en `src/environments/environment.development.ts` (`http://localhost:8000/api`). Con `ng serve` se usa por defecto, por lo que el backend debe permitir el origen `http://localhost:4200` por CORS.
- Alternativa con proxy: `ng serve --proxy-config=src/proxy.conf.json` (y poner `apiUrl: '/api'`).
- Rutas: `/login` (pública) y `/clubes` (requiere sesión). El interceptor agrega `Authorization: Bearer <access>` y, ante un 401, hace un refresh único y reintenta.
