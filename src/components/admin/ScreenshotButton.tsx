"use client";

import { useRef, useState } from "react";

/**
 * Lets the admin pick any rectangular area on screen (drag to resize/move it)
 * before capturing just that region as a PNG — "ukuran semau kita" per the
 * admin's own request, rather than a fixed full-page screenshot.
 */
export default function ScreenshotButton() {
  const [selecting, setSelecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  function startSelecting() {
    setRect(null);
    setSelecting(true);
  }

  function onMouseDown(e: React.MouseEvent) {
    dragStart.current = { x: e.clientX, y: e.clientY };
    setRect({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragStart.current) return;
    const start = dragStart.current;
    setRect({
      x: Math.min(start.x, e.clientX),
      y: Math.min(start.y, e.clientY),
      w: Math.abs(e.clientX - start.x),
      h: Math.abs(e.clientY - start.y),
    });
  }

  async function onMouseUp() {
    dragStart.current = null;
    if (!rect || rect.w < 10 || rect.h < 10) {
      setRect(null);
      return;
    }
    setSelecting(false);
    setBusy(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(document.body, {
        x: rect.x + window.scrollX,
        y: rect.y + window.scrollY,
        width: rect.w,
        height: rect.h,
        backgroundColor: "#0b0b0c",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `screenshot-dear-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("Gagal mengambil screenshot. Coba lagi.");
    } finally {
      setBusy(false);
      setRect(null);
    }
  }

  function cancelSelecting() {
    dragStart.current = null;
    setSelecting(false);
    setRect(null);
  }

  return (
    <>
      <button
        onClick={startSelecting}
        disabled={busy}
        title="Screenshot area layar"
        aria-label="Screenshot area layar"
        className="w-9 h-9 shrink-0 grid place-items-center bg-ar-surface2 border border-ar-goldline rounded-[8px] text-ar-gold cursor-pointer disabled:opacity-60"
      >
        {busy ? (
          <span className="text-[9px]">…</span>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 4h6l1.5 2H20a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3.5L9 4z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
        )}
      </button>

      {selecting && (
        <div
          className="fixed inset-0 z-[100] cursor-crosshair"
          style={{ background: "rgba(0,0,0,0.35)" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2 py-2 px-4 bg-ar-surface border border-ar-goldline rounded-full text-[11.5px] text-ar-gold2 flex items-center gap-3">
            <span>Geser untuk pilih area, lepas untuk screenshot</span>
            <button
              onClick={cancelSelecting}
              className="text-ar-dim underline cursor-pointer"
            >
              Batal
            </button>
          </div>
          {rect && (
            <div
              className="absolute border-2 border-ar-gold bg-ar-gold/10 pointer-events-none"
              style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
            />
          )}
        </div>
      )}
    </>
  );
}
