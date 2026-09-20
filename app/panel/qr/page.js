"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useBusiness } from "@/lib/BusinessContext";

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function buildQrCanvas(url, size) {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, url, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "H",
    color: { dark: "#16231D", light: "#ffffff" },
  });

  const ctx = canvas.getContext("2d");

  try {
    const logo = await loadImage("/logo.png");

    const boxSize = size * 0.24;
    const boxX = (size - boxSize) / 2;
    const boxY = (size - boxSize) / 2;

    ctx.fillStyle = "#E3A542";
    const r = boxSize * 0.22;
    ctx.beginPath();
    ctx.moveTo(boxX + r, boxY);
    ctx.arcTo(boxX + boxSize, boxY, boxX + boxSize, boxY + boxSize, r);
    ctx.arcTo(boxX + boxSize, boxY + boxSize, boxX, boxY + boxSize, r);
    ctx.arcTo(boxX, boxY + boxSize, boxX, boxY, r);
    ctx.arcTo(boxX, boxY, boxX + boxSize, boxY, r);
    ctx.closePath();
    ctx.fill();

    const logoRatio = logo.height / logo.width;
    const logoW = boxSize * 0.72;
    const logoH = logoW * logoRatio;
    ctx.drawImage(logo, boxX + (boxSize - logoW) / 2, boxY + (boxSize - logoH) / 2, logoW, logoH);
  } catch (e) {
    console.error("No se pudo dibujar el logo en el QR:", e);
  }

  return canvas;
}

function buildTableCard(qrCanvas, tableNumber) {
  const pad = 24;
  const labelHeight = 50;
  const canvas = document.createElement("canvas");
  canvas.width = qrCanvas.width + pad * 2;
  canvas.height = qrCanvas.height + pad * 2 + labelHeight;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(qrCanvas, pad, pad);

  ctx.fillStyle = "#16231D";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Mesa " + tableNumber, canvas.width / 2, canvas.height - labelHeight / 2 + 10);

  return canvas;
}

export default function QrPage() {
  const { business, cfg } = useBusiness();
  const canvasHolderRef = useRef(null);
  const [publicUrl, setPublicUrl] = useState("");
  const [mainQrDataUrl, setMainQrDataUrl] = useState("");
  const [tableCards, setTableCards] = useState([]);
  const [building, setBuilding] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function build() {
      const url = window.location.origin + "/" + business.slug;
      setPublicUrl(url);

      const mainCanvas = await buildQrCanvas(url, 260);
      if (cancelled) return;
      setMainQrDataUrl(mainCanvas.toDataURL("image/png"));
      if (canvasHolderRef.current) {
        canvasHolderRef.current.innerHTML = "";
        canvasHolderRef.current.appendChild(mainCanvas);
      }

      if (cfg.hasTableOrders) {
        const count = Math.min(Number(business.profile?.tables) || 6, 20);
        const smallQr = await buildQrCanvas(url, 200);
        const cards = [];
        for (let n = 1; n <= count; n++) {
          const card = buildTableCard(smallQr, n);
          cards.push({ n, dataUrl: card.toDataURL("image/png") });
        }
        if (!cancelled) setTableCards(cards);
      }

      setBuilding(false);
    }

    build();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.slug]);

  function downloadDataUrl(dataUrl, filename) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }

  function downloadMainQr() {
    if (mainQrDataUrl) downloadDataUrl(mainQrDataUrl, "qr-" + business.slug + ".png");
  }

  function downloadAllTables() {
    tableCards.forEach((t, i) => {
      setTimeout(() => downloadDataUrl(t.dataUrl, "mesa-" + t.n + "-" + business.slug + ".png"), i * 200);
    });
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl">Codigo QR</h1>
        <p className="text-sm text-[#5b6b60] mt-1">
          Es un unico codigo para todo tu negocio - lleva directo a tu pagina publica.
        </p>
      </div>

      <div className="bg-white border border-black/10 rounded-xl p-6 flex flex-wrap gap-8 mb-6">
        <div className="bg-white p-4 rounded-xl border border-black/10 flex-shrink-0" ref={canvasHolderRef} />
        <div className="flex-1 min-w-[220px]">
          <div className="bg-[#F0ECE1] rounded-lg px-3 py-2.5 text-sm mb-4 inline-block">{publicUrl}</div>
          <p className="text-sm text-[#5b6b60] mb-5 max-w-sm">
            {cfg.hasTableOrders
              ? "Es el mismo codigo para todo el negocio: imprimelo tantas veces como mesas tengas, o descarga las tarjetas individuales de abajo, ya con el numero de mesa incluido."
              : 'Cada persona que escanea este QR ve tu carta o servicios y puede reservar.'}
          </p>
          <button
            onClick={downloadMainQr}
            disabled={building}
            className="bg-mustard text-ink font-semibold px-5 py-2.5 rounded-full text-sm disabled:opacity-50"
          >
            Descargar QR
          </button>
        </div>
      </div>

      {cfg.hasTableOrders && (
        <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-black/10 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Tarjetas por mesa ({tableCards.length})</h3>
            <button
              onClick={downloadAllTables}
              disabled={building || tableCards.length === 0}
              className="text-xs font-semibold border border-black/15 rounded-full px-3.5 py-1.5 disabled:opacity-50"
            >
              Descargar todas
            </button>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 p-5">
            {tableCards.map((t) => (
              <div key={t.n} className="border border-black/10 rounded-lg p-2 text-center">
                <img src={t.dataUrl} alt={"QR mesa " + t.n} className="w-full rounded mb-2" />
                <button
                  onClick={() => downloadDataUrl(t.dataUrl, "mesa-" + t.n + "-" + business.slug + ".png")}
                  className="text-xs font-semibold text-[#5b6b60] underline"
                >
                  Descargar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}