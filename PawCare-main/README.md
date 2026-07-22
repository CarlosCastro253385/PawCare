# PawCARE API

Backend en Node.js + Express + MySQL para el proyecto PawCARE.

## 1. Instalar dependencias

```
npm install
```

## 2. Configurar tu base de datos

Copia `.env.example` como `.env` y llena tus datos reales de MySQL:

```
cp .env.example .env
```

## 3. Correr en local

```
npm run dev
```

Esto levanta la API en `http://localhost:8080` (o el puerto que pongas en `.env`).
Pruébalo abriendo `http://localhost:8080` en el navegador — deberías ver:
`{"ok":true,"mensaje":"PawCARE API funcionando correctamente."}`

## Endpoints disponibles

| Método | Ruta | Para qué sirve |
|---|---|---|
| POST | `/api/login` | Iniciar sesión (`{ usuario, contrasena }`) |
| POST | `/api/registro` | Crear cuenta nueva |
| GET | `/api/mascotas` | Listar mascotas (admin) |
| GET | `/api/mascotas?id_cliente=5` | Listar solo las mascotas de un cliente |
| GET | `/api/mascotas/:id` | Ver una mascota + su prescripción |
| POST | `/api/mascotas` | Crear mascota |
| PUT | `/api/mascotas/:id` | Editar mascota |
| PUT | `/api/mascotas/:id/prescripcion` | Guardar/actualizar su prescripción |
| GET | `/api/servicios` | Listar servicios |
| POST | `/api/servicios` | Crear servicio |
| PUT | `/api/servicios/:id` | Editar servicio |
| DELETE | `/api/servicios/:id` | Eliminar servicio |
| GET | `/api/citas?mes=7&anio=2026` | Citas del mes (para el calendario) |
| POST | `/api/citas` | Crear una reservación completa (cliente + mascota + servicios) |
| PUT | `/api/citas/:id/estado` | Cambiar estado de una cita |
| GET | `/api/ganancias/espacio` | Datos para la gráfica de "Espacio en la guardería" |
| GET | `/api/ganancias/mensuales?anio=2026` | Datos para la gráfica de "Ganancias mensuales" |
| GET | `/api/ganancias/por-servicio?anio=2026` | Datos para la gráfica de "Ingresos por servicio" |
| GET | `/api/perfil/:id` | Ver perfil de usuario |
| PUT | `/api/perfil/:id` | Editar perfil de usuario |

## 4. Desplegar en tu EC2 (igual que antes)

1. Sube este proyecto a GitHub.
2. En tu instancia EC2: `git clone` (o `git pull` si ya existe la carpeta).
3. `npm install`
4. Crea el `.env` en el servidor con tus datos reales (nunca subas el `.env` a GitHub).
5. `pm2 start server.js --name pawcare-api`
6. Confirma que responde: `curl http://localhost:8080`

## Nota de seguridad (léela cuando tengas tiempo, no es urgente para tu entrega)

Ahora mismo las contraseñas se guardan y comparan en texto plano, igual que
en tu simulación con `localStorage`. Para una app real en producción
deberías usar `bcrypt` para guardar las contraseñas encriptadas. No es
obligatorio para que tu proyecto funcione y se entregue, pero es buena
práctica mencionarlo si tu profesor pregunta sobre seguridad.
