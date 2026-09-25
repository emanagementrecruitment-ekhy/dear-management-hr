"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface PickableEmployee {
  id: string;
  name: string;
  code: string;
  place?: string;
}

/**
 * Replaces a plain <select> for "pick one employee out of a long list" —
 * a native <select>'s open dropdown is rendered by the OS/browser itself
 * (plain system font, light background) and can't be restyled to match the
 * app's own dark/gold theme in any browser. This renders its own dropdown
 * instead, grouped by outlet/lokasi kerja (same "📍 OUTLET" heading as Data
 * Tera/Data Karyawan/Rekap Pendapatan) with a search box to filter by name
 * or code.
 */
export default function EmployeePicker({
  employees,
  value,
  onChange,
  placeholder = "Pilih karyawan…",
}: {
  employees: PickableEmployee[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () =>
      [...employees].sort((a, b) => {
        const p = (a.place ?? "").localeCompare(b.place ?? "");
        return p !== 0 ? p : a.name.localeCompare(b.name);
      }),
    [employees]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (e) => e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q) || (e.place ?? "").toLowerCase().includes(q)
    );
  }, [sorted, query]);

  const selected = employees.find((e) => e.id === value);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setQuery("");
        }}
        className="w-full py-2.5 px-3.5 bg-ar-input border border-ar-goldline rounded-[10px] text-ar-text text-[12.5px] text-left flex items-center justify-between gap-2 cursor-pointer"
      >
        <span className={selected ? "" : "text-ar-faint"}>
          {selected ? (
            <>
              {selected.name} <span className="text-ar-dim">({selected.code}{selected.place ? ` · ${selected.place}` : ""})</span>
            </>
          ) : (
            placeholder
          )}
        </span>
        <span className="text-ar-dim text-[10px]">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full bg-ar-surface border border-ar-goldline rounded-[12px] shadow-[0_12px_32px_rgba(0,0,0,.5)] overflow-hidden">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama, kode, atau outlet…"
            className="w-full py-2.5 px-3.5 bg-ar-input border-b border-ar-line text-ar-text text-[12.5px] outline-none"
          />
          <div className="max-h-[320px] overflow-y-auto">
            {filtered.length === 0 && (
              <div className="py-4 px-3.5 text-center text-[11.5px] text-ar-faint">Tidak ada yang cocok.</div>
            )}
            {filtered.map((e, i) => {
              const showHeading = i === 0 || (e.place ?? "") !== (filtered[i - 1].place ?? "");
              return (
                <div key={e.id}>
                  {showHeading && (
                    <div className="pt-2.5 pb-1 px-3.5 text-[9.5px] tracking-[0.16em] uppercase text-ar-gold bg-ar-surface2 sticky top-0">
                      📍 {e.place || "Tanpa Outlet"}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onChange(e.id);
                      setOpen(false);
                    }}
                    className={`w-full text-left py-2.5 px-3.5 text-[12.5px] cursor-pointer hover:bg-ar-goldfill ${
                      e.id === value ? "bg-ar-goldfill text-ar-gold2" : "text-ar-text"
                    }`}
                  >
                    {e.name} <span className="text-ar-dim text-[11px]">({e.code})</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
