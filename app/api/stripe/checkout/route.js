import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

// Crea una sesión de pago de Stripe para el plan de 19,99€/mes.
// El frontend llama a esto y redirige al usuario a session.url.
export async function POST(request) {
  const { email, businessId } = await request.json();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/suscribirse?checkout=cancel`,
    // Guardamos el business_id para que el webhook sepa a qué negocio
    // asociar la suscripción cuando llegue la confirmación de pago.
    metadata: { businessId: businessId || "" },
  });

  return NextResponse.json({ url: session.url });
}
