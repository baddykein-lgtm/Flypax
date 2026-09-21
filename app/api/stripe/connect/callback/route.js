import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const businessId = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (oauthError || !code || !businessId) {
    return NextResponse.redirect(siteUrl + "/panel/ajustes?connect=error");
  }

  try {
    const res = await fetch("https://connect.stripe.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_secret: process.env.STRIPE_CONNECT_SECRET_KEY,
        code,
        grant_type: "authorization_code",
      }),
    });
    const data = await res.json();

    if (!data.stripe_user_id) {
      return NextResponse.redirect(siteUrl + "/panel/ajustes?connect=error");
    }

    await supabaseAdmin
      .from("businesses")
      .update({
        stripe_connect_account_id: data.stripe_user_id,
        stripe_connect_status: "connected",
      })
      .eq("id", businessId);

    return NextResponse.redirect(siteUrl + "/panel/ajustes?connect=success");
  } catch (e) {
    return NextResponse.redirect(siteUrl + "/panel/ajustes?connect=error");
  }
}