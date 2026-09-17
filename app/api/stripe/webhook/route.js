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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const businessId = session.metadata?.businessId;
      if (businessId) {
        await supabaseAdmin.from("subscriptions").upsert({
          business_id: businessId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: "active",
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq("stripe_subscription_id", sub.id);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
