import { NextResponse } from "next/server";

export async function POST(request) {
  const { city, address } = await request.json();
  const query = (address && address.trim()) || city;
  if (!query || !query.trim()) {
    return NextResponse.json({ error: "Falta la ciudad o direccion" }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Flypax/1.0 (contacto@flypax.online)" },
    });
    const data = await res.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Ubicacion no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}