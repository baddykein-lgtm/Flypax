import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(request) {
  const { token, businessId } = await request.json();
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
  const email = userData.user.email?.toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const [{ data: business }, { data: products }, { data: reservations }, { data: orders }, { data: invoices }] =
    await Promise.all([
      supabaseAdmin.from("businesses").select("*").eq("id", businessId).single(),
      supabaseAdmin.from("products").select("*").eq("business_id", businessId).order("created_at"),
      supabaseAdmin
        .from("reservations")
        .select("*")
        .eq("business_id", businessId)
        .order("date", { ascending: false }),
      supabaseAdmin.from("orders").select("*").eq("business_id", businessId).order("created_at", { ascending: false }),
      supabaseAdmin.from("invoices").select("*").eq("business_id", businessId).order("date", { ascending: false }),
    ]);

  return NextResponse.json({ business, products, reservations, orders, invoices });
}