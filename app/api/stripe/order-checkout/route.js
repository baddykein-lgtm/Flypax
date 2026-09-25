import { NextResponse } from "next/server";
import { stripeConnect } from "@/lib/stripeConnect";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const { businessId, slug, tableNumber, clientName, items } = await request.json();

  if (!businessId || !tableNumber || !items || items.length === 0) {
    return NextResponse.json({ error: "Faltan datos del pedido" }, { status: 400 });
  }

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, name, stripe_connect_account_id, stripe_connect_status")
    .eq("id", businessId)
    .maybeSingle();

  if (!business || business.stripe_connect_status !== "connected") {
    return NextResponse.json({ error: "Este negocio no acepta pago online todavia" }, { status: 400 });
  }

  const total = items.reduce((sum, l) => sum + l.qty * Number(l.price), 0);

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      business_id: businessId,
      table_number: tableNumber,
      client_name: clientName || null,
      items,
      total,
      status: "pendiente_pago",
      paid: false,
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  try {
    const session = await stripeConnect.checkout.sessions.create(
      {
        mode: "payment",
        line_items: items.map((l) => ({
          price_data: {
            currency: "eur",
            product_data: { name: l.name },
            unit_amount: Math.round(Number(l.price) * 100),
          },
          quantity: l.qty,
        })),
        success_url:
          process.env.NEXT_PUBLIC_SITE_URL +
          "/pedido-confirmado?orderId=" +
          order.id +
          "&session_id={CHECKOUT_SESSION_ID}",
        cancel_url: process.env.NEXT_PUBLIC_SITE_URL + "/" + (slug || ""),
        metadata: { orderId: order.id },
      },
      { stripeAccount: business.stripe_connect_account_id }
    );

    await supabaseAdmin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (e) {
    console.error("Error en order-checkout:", e);
    return NextResponse.json({ error: e.message || "Error desconocido de Stripe" }, { status: 500 });
  }
}