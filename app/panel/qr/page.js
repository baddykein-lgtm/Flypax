"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useBusiness } from "@/lib/BusinessContext";

export default function QrPage() {
  const { business, cfg } = useBusiness();
  const canvasRef = useRef(null);
  const [publicUrl, setPublicUrl] = useState("");
  const [tableImgs, setTableImgs] = useState([]);

  useEffect(() => {
    const url = `${window.location.origin}/${business.slug}`;
    setPublicUrl(url);

    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 200,
        margin: 1,
        color: { dark: "#16231D", light: "#ffffff" },
      });
    }

    if (cfg.hasTableOrders) {
      const count = Math.min(Number(business.profile?.tables) || 6, 12);
      QRCode.toDataURL(url, { width: 90, margin: 1, color: { dark: "#16231D", light: "#ffffff" } }).then((dataUrl) => {
        setTableImgs(Array.from({ length: count }, (_, i) => ({ n: i + 1, src: dataUrl })));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.slug]);

  function downloadQr() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `qr-${business.slug}.png`;
    a.click();
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl">Código QR</h1>
        <p className="text-sm text-[#5b6b60] mt-1">
          Es un único código para todo tu negocio — lleva directo a tu página pública.
        </p>
      </div>

      <div className="bg-white border border-black/10 rounded-xl p-6 flex flex-wrap gap-8 mb-6">
        <div className="bg-white p-4 rounded-xl border border-black/10 flex-shrink-0">
          <canvas ref={canvasRef} />
        </div>
        <div className="flex-1 min-w-[220px]">
          <div className="bg-[#F0ECE1] rounded-lg px-3 py-2.5 text-sm mb-4 inline-block">{publicUrl}</div>
          <p className="text-sm text-[#5b6b60] mb-5 max-w-sm">
            {cfg.hasTableOrders
              ? "Es el mismo código para todo el negocio: imprímelo tantas veces como mesas tengas y pon el número de mesa debajo de cada copia."
              : 'Cada persona que escanea este QR ve tu carta o servicios y puede reservar — al final verá un aviso de "reservado con Flypax".'}
          </p>
          <button
            onClick={downloadQr}
            className="bg-mustard text-ink font-semibold px-5 py-2.5 rounded-full text-sm"
          >
            Descargar QR
          </button>
        </div>
      </div>

      {cfg.hasTableOrders && (
        <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-black/10 font-semibold text-sm">Así se ve en cada mesa</div>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3 p-5">
            {tableImgs.map((t) => (
              <div key={t.n} className="border border-black/10 rounded-lg p-2 text-center">
                {t.src && <img src={t.src} alt={`QR mesa ${t.n}`} className="w-full rounded" />}
                <div className="font-display font-bold text-sm mt-1">Mesa {t.n}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}