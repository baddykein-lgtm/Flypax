import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function monthsElapsed(createdAt) {
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.floor(days / 30);
}

function commissionForMonth(monthsIn) {
  if (monthsIn < 4) return 10;
  if (monthsIn < 8) return 5;
  return 0;
}

export async function POST(request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Token invalido" }, { status: 401 });
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  if (!adminEmails.includes((userData.user.email || "").toLowerCase())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { data: affiliates } = await supabaseAdmin
    .from("affiliates")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: businesses } = await supabaseAdmin
    .from("businesses")
    .select("id, name, slug, referred_by, created_at")
    .not("referred_by", "is", null);

  const result = (affiliates || []).map((a) => {
    const referred = (businesses || []).filter((b) => b.referred_by === a.code);
    const details = referred.map((b) => {
      const monthsIn = monthsElapsed(b.created_at);
      return {
        name: b.name,
        slug: b.slug,
        monthsIn,
        commission: commissionForMonth(monthsIn),
      };
    });
    const totalDue = details.reduce((sum, d) => sum + d.commission, 0);
    return {
      ...a,
      referredCount: referred.length,
      totalDue,
      details,
    };
  });

  return NextResponse.json({ affiliates: result });
}