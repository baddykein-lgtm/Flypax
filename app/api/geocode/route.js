import { NextResponse } from "next/server";

export async function POST(request) {
  const { city } = await request.json();
  if (!city || !city.trim()) {
    return NextResponse.json({ error: "Falta la ciudad" }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Flypax/1.0 (contacto@flypax.online)" },
    });
    const data = await res.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Ciudad no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}