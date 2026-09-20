"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapView({ businesses }) {
  const center = businesses.length
    ? [businesses[0].latitude, businesses[0].longitude]
    : [40.482, -3.363];

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={true}
      style={{ height: "420px", width: "100%", borderRadius: "16px" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {businesses.map((b) => (
        <Marker
          key={b.id}
          position={[b.latitude, b.longitude]}
          eventHandlers={{
            click: () => {
              window.location.href = "/" + b.slug;
            },
          }}
        >
          <Popup>
            <b>{b.name}</b>
            <br />
            {b.city}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}