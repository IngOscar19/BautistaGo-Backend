# BautistaGo - Backend

Backend del sistema integral de gestión de pedidos y telemetría de reparto en tiempo real para Carnitas Bautista. Expone una API REST para la gestión de clientes, pedidos, catálogo de productos, personal operativo y analítica del negocio, junto con un canal de comunicación en tiempo real para el seguimiento de repartos.

## Descripción general

El sistema administra el ciclo de vida completo de un pedido: desde su creación por parte del cliente (mostrador, para comer en el local o a domicilio), pasando por su preparación en cocina, hasta su entrega por un repartidor. Incorpora control de acceso por roles, actualizaciones de estado protegidas ante condiciones de carrera, notificaciones push y un canal de WebSockets para transmitir la posición y el estado de los pedidos en tiempo real a clientes y personal operativo.

## Stack tecnológico

- **Node.js** con **Express** y **TypeScript**, con tipado estático en todo el código fuente.
- **PostgreSQL** como motor de base de datos, administrado mediante **Prisma ORM**.
- **Docker** y **Docker Compose** para la contenedorización del entorno de base de datos.
- **Socket.io** para comunicación en tiempo real (telemetría de pedidos y repartos).
- **JWT (jsonwebtoken)** para autenticación basada en tokens.
- **bcrypt** para el hash de contraseñas.
- **Zod** para la validación y el saneamiento de datos de entrada.
- **Swagger / OpenAPI 3.0** (swagger-jsdoc y swagger-ui-express) para documentación interactiva de la API.
- **Helmet** y **CORS** para cabeceras de seguridad HTTP y control de orígenes permitidos.
- **express-rate-limit** para limitación de tasa de peticiones.
- **Firebase Admin SDK** para el envío de notificaciones push (opcional).
- **Winston** para el registro de logs estructurados.
- **Jest** y **Supertest** para pruebas automatizadas.

## Arquitectura

El proyecto sigue una organización por capas dentro de `src/`:

- **`domain/`**: entidades, tipos, interfaces, estrategias y estados del negocio. Contiene la lógica central del dominio, independiente de frameworks.
- **`application/`**: casos de uso, DTOs, fachadas y fábricas que orquestan la lógica de negocio.
- **`infrastructure/`**: implementaciones concretas de acceso a datos (Prisma), WebSockets, notificaciones push, logging y la configuración de Swagger.
- **`http/`**: controladores, rutas, middlewares y el gateway de WebSockets que exponen la aplicación al exterior.

Esta separación permite aislar las reglas de negocio de los detalles de implementación (base de datos, framework HTTP, proveedor de notificaciones), facilitando las pruebas y el mantenimiento.

### Modelo de datos

La base de datos se modela con Prisma e incluye, entre otras, las siguientes entidades: `User` (con roles `CUSTOMER`, `KITCHEN_OPERATOR`, `DELIVERY_DRIVER`, `ADMIN`), `Product`, `Order` (con un campo `version` para control de concurrencia), `OrderItem`, `DeliveryDriver`, `Payment` y `OrderStatusLog` (bitácora de cambios de estado de cada pedido).

## Características principales

- **Autenticación y sesiones basadas en JWT**, con access tokens de corta duración y refresh tokens persistentes y rotables.
- **Control de acceso por roles (RBAC)** mediante middlewares (`authenticateJwt`, `requireRole`) que restringen endpoints según el rol del usuario.
- **Gestión completa de pedidos**: creación con cálculo dinámico de precios por pieza o por peso, historial del cliente, filtrado por estado, transición controlada de estados, asignación de repartidor y cancelación.
- **Catálogo de productos** con alta, consulta pública, y activación/desactivación de disponibilidad.
- **Administración de personal operativo** (alta, listado, desactivación y reactivación de cuentas), restringida a administradores.
- **Analítica de negocio** con métricas filtrables por rango de fechas.
- **Bloqueo optimista** en los pedidos para evitar condiciones de carrera cuando varios operadores intentan modificar el mismo registro simultáneamente.
- **Telemetría en tiempo real** vía Socket.io, organizada en salas por pedido, para el seguimiento de repartos.
- **Notificaciones push** mediante Firebase Cloud Messaging (configuración opcional).
- **Documentación interactiva** de la API disponible en `/api-docs` siguiendo la especificación OpenAPI 3.0.
- **Healthcheck** público para verificación de disponibilidad del servicio.
- **Validación de entrada con Zod** y protección contra inyecciones mediante las consultas parametrizadas de Prisma, cabeceras de seguridad con Helmet y políticas de CORS.

## Endpoints principales

La API se organiza en los siguientes módulos:

### Autenticación y cuentas (`/api/auth`)

- `POST /api/auth/register` - Registro público de clientes.
- `POST /api/auth/login` - Inicio de sesión, devuelve access token y refresh token.
- `POST /api/auth/refresh` - Rotación de tokens.
- `POST /api/auth/logout` - Cierre de sesión, revoca el refresh token.
- `PATCH /api/auth/fcm-token` - Registro del token de notificaciones push del usuario.
- `GET /api/auth/me` - Perfil del usuario autenticado.

### Comandas y pedidos (`/api/orders`)

- `POST /api/orders` - Creación de un pedido.
- `GET /api/orders` - Listado general de pedidos, para personal operativo.
- `GET /api/orders/my-history` - Historial de pedidos del cliente autenticado.
- `GET /api/orders/status/{status}` - Listado de pedidos filtrado por estado.
- `GET /api/orders/{id}` - Detalle de un pedido específico.
- `PATCH /api/orders/{id}/status` - Cambio de estado de un pedido (con bloqueo optimista).
- `PATCH /api/orders/{id}/assign-driver` - Asignación de repartidor a un pedido.
- `POST /api/orders/{id}/cancel` - Cancelación de un pedido.

### Catálogo y menú (`/api/products`)

- `GET /api/products` - Consulta pública del menú disponible.
- `POST /api/products` - Alta de un nuevo producto.
- `GET /api/products/{id}` - Detalle público de un producto.
- `PATCH /api/products/{id}/availability` - Activación/desactivación de disponibilidad.
- `DELETE /api/products/{id}` - Eliminación lógica de un producto.

### Usuarios y personal (`/api/users`)

- `POST /api/users/employees` - Alta de personal operativo.
- `GET /api/users/employees` - Listado de personal registrado.
- `DELETE /api/users/{id}` - Desactivación lógica de una cuenta.
- `PATCH /api/users/{id}/reactivate` - Reactivación de una cuenta previamente desactivada.

### Analítica (`/api/analytics`)

- `GET /api/analytics/dashboard` - Métricas del negocio filtradas por rango de fechas.

### Salud y documentación

- `GET /health` - Verificación de disponibilidad del servicio.
- `GET /api-docs` - Documentación interactiva de la API (Swagger UI).

La especificación completa y actualizada de cada endpoint, incluyendo esquemas de entrada y salida, está disponible en tiempo de ejecución en `/api-docs`.

## Seguridad

- Las contraseñas se almacenan únicamente como hash mediante bcrypt (factor de costo 12).
- Los access tokens JWT tienen una vigencia corta y los refresh tokens se almacenan como hash y rotan en cada renovación, invalidando automáticamente tokens reutilizados de forma sospechosa.
- Todo payload de entrada es validado con esquemas de Zod antes de llegar a la capa de negocio.
- Las consultas a base de datos se realizan de forma parametrizada mediante Prisma, eliminando el riesgo de inyección SQL.
- Se aplican cabeceras de seguridad HTTP con Helmet, políticas de CORS configurables y limitación de tasa de peticiones.

## Concurrencia y manejo de recursos

- Los pedidos implementan bloqueo optimista mediante una columna `version`: si dos solicitudes intentan modificar el mismo pedido al mismo tiempo, solo una prevalece y la otra recibe un código 409.
- Las operaciones críticas, como la asignación de repartidores, se ejecutan dentro de transacciones.
- El acceso a la base de datos se administra mediante el pool de conexiones de Prisma.
- Las conexiones de WebSocket se organizan en salas por pedido y se limpian de forma determinística al desconectarse el cliente, evitando fugas de memoria.

## Puesta en marcha

### Requisitos previos

- Node.js 20 o superior.
- Docker y Docker Compose (para levantar PostgreSQL localmente).

### Pasos

1. Clonar el repositorio e instalar las dependencias:

   ```bash
   npm install
   ```

2. Copiar el archivo de variables de entorno de ejemplo y completarlo:

   ```bash
   cp .env.example .env
   ```

3. Levantar la base de datos PostgreSQL con Docker Compose:

   ```bash
   docker compose up -d
   ```

4. Aplicar las migraciones de Prisma:

   ```bash
   npm run db:migrate
   ```

5. (Opcional) Ejecutar el seed de datos iniciales:

   ```bash
   npm run db:seed
   ```

6. Iniciar el servidor en modo desarrollo:

   ```bash
   npm run dev
   ```

El servidor quedará disponible en `http://localhost:3000`, con la documentación interactiva en `http://localhost:3000/api-docs` y el healthcheck en `http://localhost:3000/health`.

### Variables de entorno

| Variable | Descripción |
|---|---|
| `NODE_ENV` | Entorno de ejecución (`development`, `production`, etc.). |
| `PORT` | Puerto en el que escucha el servidor HTTP. |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL. |
| `JWT_SECRET` | Clave secreta para firmar los access tokens (mínimo 32 caracteres). |
| `JWT_EXPIRES_IN` | Vigencia del access token. |
| `JWT_REFRESH_SECRET` | Clave secreta para firmar los refresh tokens. |
| `JWT_REFRESH_EXPIRES_IN` | Vigencia del refresh token. |
| `FIREBASE_PROJECT_ID` | Identificador del proyecto de Firebase (opcional, para notificaciones push). |
| `FIREBASE_CLIENT_EMAIL` | Correo de la cuenta de servicio de Firebase (opcional). |
| `FIREBASE_PRIVATE_KEY` | Clave privada de la cuenta de servicio de Firebase (opcional). |
| `CORS_ORIGINS` | Lista de orígenes permitidos, separados por coma. |
| `RATE_LIMIT_WINDOW_MS` | Ventana de tiempo para la limitación de tasa de peticiones, en milisegundos. |
| `RATE_LIMIT_MAX` | Número máximo de peticiones permitidas por ventana. |

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor en modo desarrollo con recarga automática. |
| `npm run build` | Compila el proyecto TypeScript a JavaScript. |
| `npm start` | Ejecuta la versión compilada del servidor. |
| `npm run lint` / `npm run lint:fix` | Analiza y corrige el estilo del código. |
| `npm run format` / `npm run format:check` | Aplica o verifica el formato del código con Prettier. |
| `npm run typecheck` | Verifica los tipos de TypeScript sin generar archivos. |
| `npm test` | Ejecuta las pruebas automatizadas con cobertura. |
| `npm run db:migrate` | Aplica las migraciones de la base de datos. |
| `npm run db:seed` | Ejecuta el script de datos iniciales. |
| `npm run db:studio` | Abre Prisma Studio para explorar la base de datos. |
| `npm run db:generate` | Genera el cliente de Prisma. |

## Pruebas

El proyecto incluye pruebas automatizadas con Jest y Supertest. Para ejecutarlas:

```bash
npm test
```

## Documentación adicional

Además de este README, el proyecto cuenta con una colección de pruebas en Postman (carpeta `postman/`) y con documentación técnica extendida del proyecto, que detalla la arquitectura, los requerimientos y las métricas del sistema en un documento aparte.