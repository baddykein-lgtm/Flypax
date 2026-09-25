import { NextResponse } from "next/server";
import { stripeConnect } from "@/lib/stripeConnect";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const { orderId, sessionId } = await request.json();
  if (!orderId || !sessionId) {
    console.error("order-verify: faltan datos", { orderId, sessionId });
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, business_id, paid, stripe_session_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.stripe_session_id !== sessionId) {
    console.error("order-verify no encontro coincidencia:", { orderId, sessionId, order });
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  if (order.paid) {
    return NextResponse.json({ paid: true });
  }

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("stripe_connect_account_id")
    .eq("id", order.business_id)
    .maybeSingle();

  try {
    const session = await stripeConnect.checkout.sessions.retrieve(sessionId, {
      stripeAccount: business.stripe_connect_account_id,
    });

    if (session.payment_status === "paid") {
      await supabaseAdmin.from("orders").update({ paid: true, status: "nuevo" }).eq("id", orderId);
      return NextResponse.json({ paid: true });
    }

    return NextResponse.json({ paid: false });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}