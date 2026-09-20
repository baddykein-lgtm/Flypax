import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Stripe llama a esta URL cada vez que pasa algo con un pago o una
// suscripción. Aquí es donde actualizamos la tabla "subscriptions"
// para que el negocio quede marcado como activo (o cancelado).
//
// Configúralo en Stripe → Developers → Webhooks:
//   URL: https://tudominio.com/api/stripe/webhook
//   Eventos: checkout.session.completed, customer.subscription.updated,
//            customer.subscription.deleted

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Firma inválida: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        // businessId solo existe si el pago fue una reactivación desde el panel
        // (negocio ya creado). En el alta normal el negocio aún no existe: se
        // guarda con business_id null y /api/subscriptions/link lo enlaza por
        // email en cuanto /onboarding crea el negocio.
        const businessId = session.metadata?.businessId || null;
        const email = session.customer_details?.email || session.customer_email || null;

        await supabaseAdmin.from("subscriptions").upsert(
          {
            business_id: businessId,
            customer_email: email,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            status: "active",
          },
          { onConflict: "stripe_customer_id" }
        );
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: sub.status,
            current_period_end: sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null,
          })
          .eq("stripe_subscription_id", sub.id);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Error procesando webhook de Stripe:", event.type, err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
