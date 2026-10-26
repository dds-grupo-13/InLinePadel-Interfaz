# InLine Padel — Interfaz (Angular)

SPA de InLine Padel. Consume la API REST del backend `../InLinePadel`.

## Requisitos

- Node.js **≥ 24.15** (Angular 22). Verificar con `node -v`.

## Desarrollo local

```powershell
cd inlinepadel
npm ci
npm start
```

> La app Angular vive en `inlinepadel/`. En la raíz del repo hay un
> `package.json` con scripts proxy, así que `npm start` / `npm run build`
> también funcionan desde `InLinePadel-Interfaz/`.

- Aplicación: <http://localhost:4200>
- En modo desarrollo la API apunta a `http://localhost:8000/api`
  (`src/environments/environment.development.ts`). Levantar el backend con
  `python manage.py runserver`.

## Docker (SPA + API + PostgreSQL)

Requiere Docker Desktop encendido y el backend como carpeta hermana
(`../InLinePadel`, que es este workspace).

```powershell
copy .env.example .env    # completar DB_NAME / DB_USER / DB_PASSWORD / SECRET_KEY
docker compose up --build -d
docker compose exec app python manage.py seed_demo_data
```

- Aplicación: <http://localhost:4200> (nginx sirviendo el build de producción)
- API: <http://localhost:8000/api> (gunicorn)
- Base: contenedor `postgres:17`, datos en el volumen `pgdata`.

Comandos útiles:

```powershell
docker compose ps
docker compose logs -f app
docker compose down        # conserva los datos
docker compose down -v     # borra también la base
```

## Build de producción

```powershell
cd inlinepadel
npm run build
```

Salida en `inlinepadel/dist/inlinepadel/`.
