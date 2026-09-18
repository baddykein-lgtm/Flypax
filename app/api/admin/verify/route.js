import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(request) {
  const { token } = await request.json();
  if (!token) return NextResponse.json({ isAdmin: false });

  const { data: userData } = await supabaseAdmin.auth.getUser(token);
  const email = userData?.user?.email?.toLowerCase();

  return NextResponse.json({ isAdmin: ADMIN_EMAILS.includes(email) });
}