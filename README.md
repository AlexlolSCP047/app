# FitCoach IA 🏋️

Entrenador personal con inteligencia artificial que diseña planes de entrenamiento
personalizados, se adapta a tu feedback y te acompaña por chat.

- **Web** (`apps/web`): Next.js 14 + Tailwind + Prisma + Stripe + IA (Cerebras/Claude). La web
  también es el **backend/API** de la app móvil.
- **Móvil** (`apps/mobile`): Expo / React Native — **una sola base de código para Android e iOS**.

## Funciones principales

- **🔥 Hoy**: resumen semanal con sesiones completadas, racha de semanas y la próxima sesión a un
  toque de distancia.
- **▶️ Modo entrenamiento**: sesión guiada a pantalla completa, ejercicio a ejercicio, con series,
  temporizador de descanso automático y valoración final que alimenta el plan adaptativo.
- **📅 Plan adaptativo**: al completar cada sesión marcas si fue *fácil, justa o difícil*; la IA
  usa ese feedback para ajustar la intensidad del siguiente plan (sobrecarga progresiva real).
- **📖 Biblioteca de ejercicios**: técnica paso a paso, músculos implicados y errores comunes de
  cualquier ejercicio, más **sustitución inteligente** si uno no es viable.
- **📈 Progreso**: registro de peso corporal con gráfica y marcas por ejercicio, junto al
  historial de sesiones.
- **💬 Chat** con el entrenador IA (streaming en web) y **⚙️ perfil por pasos** tipo cuestionario
  (objetivo, nivel, días, duración, material, zonas prioritarias, lesiones).

## Modelo de negocio implementado

- **Registro gratuito** con nombre, correo y contraseña (teléfono opcional).
- **Prueba gratuita de 1 día con tarjeta por adelantado**: Stripe no cobra nada hasta el segundo día
  y el cliente puede cancelar antes sin coste.
- Al terminar la prueba, **suscripción mensual de 14,99 €** vía Stripe Checkout, que muestra el
  importe en la moneda local del cliente y recoge la dirección de facturación en el pago.
- El cliente puede cancelar o cambiar de tarjeta desde el **portal de facturación de Stripe**.

## Estructura

```
apps/
├── web/                       # Web + API (Next.js)
│   ├── prisma/schema.prisma   # Usuarios, perfiles, planes, chat, sesiones, progreso
│   └── src/
│       ├── app/               # Landing, registro, login, panel
│       ├── app/api/           # auth, profile, ai/*, workouts, progress, checkout, webhook
│       ├── components/        # Panel del cliente (hoy, plan, ejercicios, progreso, chat, perfil)
│       └── lib/               # Prisma, JWT, Stripe, IA (Cerebras/Claude)
└── mobile/                    # App Android + iOS (Expo)
    ├── App.tsx                # Navegación
    └── src/screens/           # Welcome, Registro, Login, Home, Perfil, Plan, Chat
```

## Puesta en marcha — Web

```bash
cd apps/web
cp .env.example .env        # rellena las claves (ver abajo)
npm install
npm run db:push             # crea las tablas en tu base de datos PostgreSQL (Neon)
npm run dev                 # http://localhost:3000
```

### Variables de entorno (`apps/web/.env`)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de PostgreSQL (gratis en https://neon.tech); la misma en local y producción |
| `AUTH_SECRET` | Secreto para las sesiones (`openssl rand -hex 32`) |
| `APP_URL` | URL pública de la web |
| `CEREBRAS_API_KEY` | Clave de la API de Cerebras — IA gratis ([cloud.cerebras.ai](https://cloud.cerebras.ai)) |
| `CEREBRAS_MODEL` | Modelo de Cerebras (opcional; por defecto `gemma-4-31b`) |
| `AI_PROVIDER` | `cerebras` o `claude` (opcional; automático según las claves presentes) |
| `ANTHROPIC_API_KEY` | Clave de la API de Claude, solo si usas `AI_PROVIDER=claude` ([platform.claude.com](https://platform.claude.com)) |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `STRIPE_PRICE_ID` | Precio recurrente de 14,99 €/mes creado en Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secreto del webhook de Stripe |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Correo saliente para "olvidé mi contraseña" — p. ej. Gmail con contraseña de aplicación (`smtp.gmail.com`, `587`) |
| `RESEND_API_KEY` + `EMAIL_FROM` | Alternativa a SMTP: [resend.com](https://resend.com) con dominio verificado |

### Configurar Stripe

1. Crea un producto "Plan Pro" con un **precio recurrente mensual de 14,99 EUR** y copia el
   `price_...` en `STRIPE_PRICE_ID`.
2. Activa **Adaptive Pricing** en Stripe para que cada cliente vea el precio en su moneda.
3. Webhook → endpoint `https://tudominio.com/api/stripe/webhook` con los eventos
   `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`
   y `customer.subscription.deleted`.
   En local: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## Puesta en marcha — App móvil

```bash
cd apps/mobile
npm install
npm start            # abre Expo; escanea el QR con Expo Go (Android/iOS)
```

Edita `src/api.ts` y ajusta `API_URL`:

- Emulador Android: `http://10.0.2.2:3000`
- Dispositivo físico: `http://<IP-de-tu-ordenador>:3000`
- Producción: `https://tudominio.com`

Para publicar en las tiendas usa [EAS Build](https://docs.expo.dev/build/introduction/):
`npx eas build --platform android` / `--platform ios`.

## Cómo funciona la IA

El proveedor de IA es **intercambiable** con la variable `AI_PROVIDER`:

| Proveedor | Modelo por defecto | Coste | Se activa con |
|---|---|---|---|
| **Cerebras** (por defecto) | `gemma-4-31b` | Gratis | `CEREBRAS_API_KEY` presente |
| Claude (Anthropic) | `claude-opus-4-8` | De pago (mayor calidad) | `AI_PROVIDER=claude` + `ANTHROPIC_API_KEY` |

- **Generación de plan** (`POST /api/ai/plan`): el modelo recibe el perfil del cliente **y el
  feedback de sus últimas sesiones** (fácil/justo/difícil) y devuelve el plan semanal como
  **JSON estructurado** (salida garantizada por esquema), ajustando la intensidad a su evolución.
- **Biblioteca** (`POST /api/ai/exercise`): detalle de técnica de cualquier ejercicio
  (`mode: "detail"`) o una alternativa equivalente (`mode: "substitute"`), también con salida
  estructurada.
- **Chat** (`POST /api/ai/chat`): conversación con memoria (últimos 20 mensajes) y el perfil del
  cliente como contexto. En web la respuesta llega en **streaming**; la app móvil pide la respuesta
  completa (`stream: false`).
- Todos los endpoints comprueban el acceso (prueba activa o suscripción) y devuelven `402 PAYWALL`
  si ha caducado.

## Decisiones de producto (y por qué)

1. **No pedimos dirección ni teléfono obligatorios en el registro.** Cada campo extra reduce las
   conversiones; la dirección de facturación la recoge Stripe al pagar (necesaria para impuestos)
   y el teléfono queda opcional.
2. **La suscripción se vende en la web, no dentro de la app.** Apple y Google cobran un 15–30 % de
   comisión por pagos dentro de la app; con Stripe en la web conservas ~97 % de los 14,99 €.
   La app consume la suscripción ya activa de la cuenta.
3. **Precios ancla recomendados** (fácil de añadir): plan anual con descuento (p. ej. 399 €/año ≈
   33 €/mes) para subir el valor medio por cliente.

## Despliegue recomendado

- **Web**: Vercel (o Railway/Fly.io) + PostgreSQL gestionado (Neon, Supabase). Cambia el
  `provider` del datasource de Prisma a `postgresql`.
- **Móvil**: EAS Build + App Store Connect / Google Play Console.

---

⚠️ Los planes generados por la IA no sustituyen el consejo médico profesional.
