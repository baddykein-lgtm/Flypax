# Flypax

SaaS de reservas, citas, pedidos en mesa y facturas para negocios locales.

## 1. Instalar dependencias

```bash
npm install
```

## 2. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Rellena `.env.local` con:

- **Supabase** → tu proyecto → Settings → API (`URL`, `anon key`, `service_role key`)
- **Stripe** → Developers → API keys (`secret key`) y crea un producto de 19,99€/mes
  para sacar el `price_id`
- **Stripe webhook secret** → lo obtienes al crear el webhook (paso 4)

## 3. Base de datos

En tu proyecto de Supabase → SQL Editor, ejecuta el contenido de
`flypax-schema.sql` (te lo pasé en el chat — pégalo entero y dale a Run).

Esto crea las tablas `businesses`, `products`, `reservations`, `orders`,
`invoices`, `subscriptions`, con las políticas de seguridad (RLS) ya
configuradas: los negocios ven solo lo suyo, y los clientes sin cuenta
pueden crear reservas y pedidos pero no leerlos ni modificarlos.

## 4. Stripe — webhook

En local, usa la CLI de Stripe para probar el webhook:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Te dará un `whsec_...` — ese es tu `STRIPE_WEBHOOK_SECRET` en local.

En producción, crea el webhook en el dashboard de Stripe apuntando a
`https://tudominio.com/api/stripe/webhook`.

## 5. Arrancar en local

```bash
npm run dev
```

Abre http://localhost:3000

## 6. Desplegar

Como siempre:

```bash
vercel --prod
```

No olvides añadir las mismas variables de `.env.local` en
Vercel → Project Settings → Environment Variables.

## Qué hay montado ya

- `app/page.js` — landing pública
- `app/api/stripe/checkout` — crea la sesión de pago del plan (19,99€/mes)
- `app/api/stripe/webhook` — confirma el pago y activa la suscripción en Supabase
- `lib/supabaseClient.js` — cliente para el navegador (respeta RLS)
- `lib/supabaseAdmin.js` — cliente de servidor (solo rutas API, salta RLS)
- `lib/categoryConfig.js` — la configuración por tipo de negocio (restaurante,
  peluquería, clínica, taller, tienda) que ya validamos en el prototipo

## Qué falta por construir

- `/suscribirse` — página que llama a `/api/stripe/checkout`
- `/onboarding` — el asistente de 4 pasos (negocio, link, horario, preguntas por categoría)
- `/panel` — el dashboard del negocio (resumen, reservas, pedidos, carta, QR, facturas, clientes)
- `/[slug]` — la página pública + app de cliente (reservar, pedir en mesa)

Vamos construyendo cada uno en los siguientes pasos.
