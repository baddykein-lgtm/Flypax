import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const { email, businessId, token } = await request.json();

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email invalido" }, { status: 400 });
  }

  let verifiedBusinessId = "";
  if (businessId) {
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    if (!userData?.user) {
      return NextResponse.json({ error: "Token invalido" }, { status: 401 });
    }
    const { data: biz } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("owner_id", userData.user.id)
      .maybeSingle();
    if (!biz) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    verifiedBusinessId = biz.id;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/suscribirse?checkout=cancel`,
      subscription_data: {
        trial_period_days: 5,
      },
      metadata: { businessId: verifiedBusinessId },
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}