# FitCoach IA 🏋️

Entrenador personal con inteligencia artificial (Claude) que diseña planes de entrenamiento
personalizados y acompaña al cliente por chat.

- **Web** (`apps/web`): Next.js 14 + Tailwind + Prisma + Stripe + Claude API. La web también es el
  **backend/API** de la app móvil.
- **Móvil** (`apps/mobile`): Expo / React Native — **una sola base de código para Android e iOS**.

## Modelo de negocio implementado

- **Registro gratuito** con nombre, correo y contraseña (teléfono opcional).
- **Prueba gratuita de 1 día** (24 h, configurable con `TRIAL_HOURS`), sin tarjeta.
- Al terminar la prueba, **suscripción mensual de 49,99 €** vía Stripe Checkout, que muestra el
  importe en la moneda local del cliente y recoge la dirección de facturación en el pago.
- El cliente puede cancelar o cambiar de tarjeta desde el **portal de facturación de Stripe**.

## Estructura

```
apps/
├── web/                       # Web + API (Next.js)
│   ├── prisma/schema.prisma   # Usuarios, perfiles, planes, chat
│   └── src/
│       ├── app/               # Landing, registro, login, panel
│       ├── app/api/           # auth, profile, ai/plan, ai/chat, checkout, webhook
│       ├── components/        # Panel del cliente (perfil, plan, chat)
│       └── lib/               # Prisma, JWT, Stripe, Claude
└── mobile/                    # App Android + iOS (Expo)
    ├── App.tsx                # Navegación
    └── src/screens/           # Welcome, Registro, Login, Home, Perfil, Plan, Chat
```

## Puesta en marcha — Web

```bash
cd apps/web
cp .env.example .env        # rellena las claves (ver abajo)
npm install
npm run db:push             # crea la base de datos SQLite
npm run dev                 # http://localhost:3000
```

### Variables de entorno (`apps/web/.env`)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | `file:./dev.db` en desarrollo; PostgreSQL en producción |
| `AUTH_SECRET` | Secreto para las sesiones (`openssl rand -hex 32`) |
| `APP_URL` | URL pública de la web |
| `ANTHROPIC_API_KEY` | Clave de la API de Claude ([platform.claude.com](https://platform.claude.com)) |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `STRIPE_PRICE_ID` | Precio recurrente de 49,99 €/mes creado en Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secreto del webhook de Stripe |
| `TRIAL_HOURS` | Horas de prueba gratis (por defecto 24) |

### Configurar Stripe

1. Crea un producto "Plan Pro" con un **precio recurrente mensual de 49,99 EUR** y copia el
   `price_...` en `STRIPE_PRICE_ID`.
2. Activa **Adaptive Pricing** en Stripe para que cada cliente vea el precio en su moneda.
3. Webhook → endpoint `https://tudominio.com/api/stripe/webhook` con los eventos
   `checkout.session.completed`, `customer.subscription.updated` y `customer.subscription.deleted`.
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

- **Generación de plan** (`POST /api/ai/plan`): Claude (`claude-opus-4-8`) recibe el perfil del
  cliente y devuelve el plan semanal como **JSON estructurado** (salida garantizada por esquema),
  que se guarda en la base de datos y se muestra en web y móvil.
- **Chat** (`POST /api/ai/chat`): conversación con memoria (últimos 20 mensajes) y el perfil del
  cliente como contexto. En web la respuesta llega en **streaming**; la app móvil pide la respuesta
  completa (`stream: false`).
- Ambos endpoints comprueban el acceso (prueba activa o suscripción) y devuelven `402 PAYWALL`
  si ha caducado.

## Decisiones de producto (y por qué)

1. **No pedimos dirección ni teléfono obligatorios en el registro.** Cada campo extra reduce las
   conversiones; la dirección de facturación la recoge Stripe al pagar (necesaria para impuestos)
   y el teléfono queda opcional.
2. **La suscripción se vende en la web, no dentro de la app.** Apple y Google cobran un 15–30 % de
   comisión por pagos dentro de la app; con Stripe en la web conservas ~97 % de los 49,99 €.
   La app consume la suscripción ya activa de la cuenta.
3. **Prueba de 1 día sin tarjeta**, como pediste. Está parametrizada (`TRIAL_HOURS`) para que
   puedas probar 72 h o 7 días si la conversión del primer día es baja.
4. **Precios ancla recomendados** (fácil de añadir): plan anual con descuento (p. ej. 399 €/año ≈
   33 €/mes) para subir el valor medio por cliente.

## Despliegue recomendado

- **Web**: Vercel (o Railway/Fly.io) + PostgreSQL gestionado (Neon, Supabase). Cambia el
  `provider` del datasource de Prisma a `postgresql`.
- **Móvil**: EAS Build + App Store Connect / Google Play Console.

---

⚠️ Los planes generados por la IA no sustituyen el consejo médico profesional.
