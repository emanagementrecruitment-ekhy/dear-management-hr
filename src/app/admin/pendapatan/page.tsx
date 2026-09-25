"use client";

import { useEffect, useRef, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { EMPLOYEE_LEVELS, FIELD_CITIES, VOUCHER_AMOUNT, VOUCHER_LABEL, usesVcr, type EmployeeLevel } from "@/lib/constants";
import { fmtRp } from "@/lib/format";

interface EmployeeOption {
  id: string;
  name: string;
  code: string;
  place: string;
  role: string;
}

interface Entry {
  id: string;
  employeeName: string;
  employeeCode: string;
  count: number;
  amount: string;
  occurredAt: string;
}

interface EntryDetail {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  category: EmployeeLevel;
  client: string;
  amount: number;
  qty: number;
  occurredAt: string;
  mixed: boolean;
  total: number;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

interface ImportSummary {
  sheetsProcessed: number;
  employeesCreated: number;
  employeesSkippedLimit: number;
  vouchersInserted: number;
  totalAmount: number;
  skippedSheets: string[];
}

export default function PendapatanPage() {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [category, setCategory] = useState<EmployeeLevel>("SILVER");
  const [location, setLocation] = useState("");
  const [occurredAt, setOccurredAt] = useState(today());
  const [amount, setAmount] = useState(String(VOUCHER_AMOUNT.SILVER));
  const [amountTouched, setAmountTouched] = useState(false);
  const [qty, setQty] = useState("1");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [editKey, setEditKey] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editDetail, setEditDetail] = useState<EntryDetail | null>(null);
  const [editCategory, setEditCategory] = useState<EmployeeLevel>("SILVER");
  const [editClient, setEditClient] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editQty, setEditQty] = useState("1");
  const [editOccurredAt, setEditOccurredAt] = useState(today());
  const [editBusy, setEditBusy] = useState(false);
  const [editMsg, setEditMsg] = useState("");
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/employees?pageSize=500")
      .then((r) => r.json())
      .then((d) =>
        setEmployees(
          (d.employees ?? [])
            .filter((e: EmployeeOption) => usesVcr(e.role))
            .map((e: EmployeeOption) => ({ id: e.id, name: e.name, code: e.code, place: e.place, role: e.role }))
        )
      );
    fetch("/api/admin/vouchers")
      .then((r) => r.json())
      .then((d) => setEntries(d.vouchers ?? []));
  }

  useEffect(load, []);

  function onCategoryChange(next: EmployeeLevel) {
    setCategory(next);
    if (!amountTouched) setAmount(String(VOUCHER_AMOUNT[next]));
  }

  function onEmployeeChange(id: string) {
    setEmployeeId(id);
    const emp = employees.find((e) => e.id === id);
    if (emp) setLocation(emp.place);
  }

  const total = (Number(amount) || 0) * (Number(qty) || 0);

  async function submit() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, category, client: location, occurredAt, amount: Number(amount), qty: Number(qty) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Gagal menyimpan.");
        return;
      }
      setSuccess("✓ Pendapatan berhasil dicatat.");
      setAmountTouched(false);
      setAmount(String(VOUCHER_AMOUNT[category]));
      setQty("1");
      load();
      setTimeout(() => setSuccess(""), 2500);
    } finally {
      setBusy(false);
    }
  }

  async function uploadImport() {
    if (!importFile) return;
    setImportBusy(true);
    setImportMsg("");
    setImportSummary(null);
    try {
      const body = new FormData();
      body.append("file", importFile);
      const res = await fetch("/api/admin/vouchers/import", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setImportMsg(data.error ?? "Gagal mengimpor file.");
        return;
      }
      setImportSummary(data);
      setImportFile(null);
      if (importInputRef.current) importInputRef.current.value = "";
      load();
    } finally {
      setImportBusy(false);
    }
  }

  async function openEdit(entry: Entry) {
    setEditKey(entry.id);
    setEditLoading(true);
    setEditMsg("");
    setEditDetail(null);
    try {
      const res = await fetch(`/api/admin/vouchers/${encodeURIComponent(entry.id)}`);
      const data = await res.json();
      if (!res.ok) {
        setEditMsg(data.error ?? "Gagal memuat entri.");
        return;
      }
      setEditDetail(data);
      setEditCategory(data.category);
      setEditClient(data.client);
      setEditAmount(String(data.amount));
      setEditQty(String(data.qty));
      setEditOccurredAt(data.occurredAt);
    } finally {
      setEditLoading(false);
    }
  }

  function closeEdit() {
    setEditKey(null);
    setEditDetail(null);
    setEditMsg("");
    setConfirmDeleteKey(null);
  }

  async function saveEdit() {
    if (!editKey) return;
    setEditBusy(true);
    setEditMsg("");
    try {
      const res = await fetch(`/api/admin/vouchers/${encodeURIComponent(editKey)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: editCategory,
          client: editClient,
          amount: Number(editAmount),
          qty: Number(editQty),
          occurredAt: editOccurredAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditMsg(data.error ?? "Gagal menyimpan perubahan.");
        return;
      }
      closeEdit();
      load();
    } finally {
      setEditBusy(false);
    }
  }

  async function deleteEntry() {
    if (!editKey) return;
    setEditBusy(true);
    setEditMsg("");
    try {
      const res = await fetch(`/api/admin/vouchers/${encodeURIComponent(editKey)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setEditMsg(data.error ?? "Gagal menghapus entri.");
        return;
      }
      closeEdit();
      load();
    } finally {
      setEditBusy(false);
    }
  }

  const editTotal = (Number(editAmount) || 0) * (Number(editQty) || 0);

  return (
    <div>
      <AdminPageHeader
        title="Input Pendapatan"
        subtitle="Catat pendapatan/voucher harian karyawan berdasarkan laporan dari lapangan — khusus Peran Tera"
        actions={
          <button
            onClick={() => setUploadOpen((v) => !v)}
            title="Upload DATA (Excel/CSV/Text)"
            className="py-2.5 px-4 bg-ar-surface2 border border-ar-goldline rounded-[10px] text-ar-gold text-[11px] font-bold tracking-[0.1em] uppercase cursor-pointer whitespace-nowrap"
          >
            📁 Upload DATA
          </button>
        }
      />

      {uploadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 p-5"
          onClick={(e) => e.target === e.currentTarget && setUploadOpen(false)}
        >
          <div className="w-full max-w-[380px] mt-[70px] p-5 bg-ar-surface border border-ar-goldline rounded-2xl">
            <div className="flex justify-between items-center mb-1.5">
              <div className="font-display text-[19px] text-ar-gold2">Upload DATA (Excel/CSV/Text)</div>
              <button onClick={() => setUploadOpen(false)} className="text-ar-dim text-[11px] cursor-pointer">
                Tutup
              </button>
            </div>
            <div className="text-[11px] text-ar-dim mb-3.5 leading-[1.6]">
              <strong>Excel (.xlsx/.xls):</strong> format sama seperti rekap outlet bulanan (kolom NAMA, OUTLET,
              JUMLAH VCR, TOTAL PENDAPATAN — satu sheet per bulan, misal &quot;Juni 2026&quot;).
              <br />
              <strong>CSV/Text (.csv/.txt):</strong> satu tabel datar dengan kolom Nama, Outlet, Jumlah VCR, Total,
              dan Bulan (isi per baris, misal &quot;Juni 2026&quot;) — karena file teks tidak punya sheet.
              <br />
              Karyawan baru otomatis dibuat dengan email/HP placeholder — update lewat Data Karyawan setelah
              upload.
            </div>
            <label
              htmlFor="vcr-import-file"
              className="flex flex-col items-center justify-center gap-1.5 w-full py-6 px-4 mb-3 bg-ar-input border-2 border-dashed border-ar-goldline rounded-[14px] text-center cursor-pointer hover:bg-ar-surface2 transition"
            >
              <span className="text-[13px] text-ar-gold2 font-semibold">
                {importFile ? "📄 " + importFile.name : "📁 Ketuk untuk pilih file"}
              </span>
              <span className="text-[10.5px] text-ar-dim">
                {importFile ? "Ketuk lagi untuk ganti file" : "Dari galeri/file di HP, atau folder di komputer · .xlsx / .xls / .csv / .txt"}
              </span>
            </label>
            <input
              ref={importInputRef}
              id="vcr-import-file"
              type="file"
              accept=".xlsx,.xls,.csv,.txt"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              disabled={importBusy || !importFile}
              onClick={uploadImport}
              className="w-full py-3 px-4 ar-grad rounded-[10px] text-ar-ongold text-[11px] font-bold tracking-[0.14em] uppercase cursor-pointer disabled:opacity-60"
            >
              {importBusy ? "Memproses…" : "Upload & Impor"}
            </button>
            {importMsg && <div className="mt-3 text-[11.5px] text-ar-red">{importMsg}</div>}
            {importSummary && (
              <div className="mt-3.5 p-3.5 bg-[rgba(127,209,168,.1)] border border-[rgba(127,209,168,.3)] rounded-xl text-[11.5px] text-ar-green leading-[1.7]">
                ✓ {importSummary.sheetsProcessed} sheet diproses · {importSummary.employeesCreated} karyawan baru
                dibuat · {importSummary.vouchersInserted} voucher dicatat · total Rp{" "}
                {importSummary.totalAmount.toLocaleString("id-ID")}
                {importSummary.skippedSheets.length > 0 && (
                  <div className="text-ar-faint mt-1">Bagian dilewati (bulan tidak dikenali): {importSummary.skippedSheets.join(", ")}</div>
                )}
                {importSummary.employeesSkippedLimit > 0 && (
                  <div className="text-ar-red mt-1">
                    {importSummary.employeesSkippedLimit} karyawan baru dilewati — batas paket sudah tercapai. Hubungi vendor untuk upgrade paket.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:[grid-template-columns:1fr_1.2fr] gap-4 pt-5.5">
        <div className="flex flex-col gap-4">
          <div className="p-5 bg-ar-surface border border-ar-line rounded-2xl h-fit">
            <div className="font-display text-[19px] text-ar-gold2 mb-3.5">Tambah Entri</div>

          <div className="grid gap-3.5">
            <div>
              <label className="text-[10px] tracking-[0.14em] uppercase text-ar-dim mb-1.5 block">Karyawan</label>
              <select
                value={employeeId}
                onChange={(e) => onEmployeeChange(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-ar-input border border-ar-goldline rounded-[10px] text-ar-text text-[12.5px]"
              >
                <option value="">Pilih karyawan…</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] tracking-[0.14em] uppercase text-ar-dim mb-1.5 block">Tanggal</label>
              <input
                type="date"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-ar-input border border-ar-goldline rounded-[10px] text-ar-text text-[12.5px]"
              />
            </div>
            <div>
              <label className="text-[10px] tracking-[0.14em] uppercase text-ar-dim mb-1.5 block">Pendapatan / VCR</label>
              <select
                value={category}
                onChange={(e) => onCategoryChange(e.target.value as EmployeeLevel)}
                className="w-full py-2.5 px-3.5 bg-ar-input border border-ar-goldline rounded-[10px] text-ar-text text-[12.5px]"
              >
                {EMPLOYEE_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {VOUCHER_LABEL[lvl]} (default Rp {VOUCHER_AMOUNT[lvl].toLocaleString("id-ID")})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] tracking-[0.14em] uppercase text-ar-dim mb-1.5 block">Lokasi Kerja</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-ar-input border border-ar-goldline rounded-[10px] text-ar-text text-[12.5px]"
              >
                <option value="">Pilih lokasi…</option>
                {location && !FIELD_CITIES.some((c) => c.place === location) && (
                  <option value={location}>{location} (lama)</option>
                )}
                {FIELD_CITIES.map((c) => (
                  <option key={c.place} value={c.place}>
                    {c.place}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-[10px] tracking-[0.14em] uppercase text-ar-dim mb-1.5 block">
                  Rate /VCR (bisa diubah)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setAmountTouched(true);
                  }}
                  className="w-full py-2.5 px-3.5 bg-ar-input border border-ar-goldline rounded-[10px] text-ar-text text-[12.5px]"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.14em] uppercase text-ar-dim mb-1.5 block">Jumlah VCR</label>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-ar-input border border-ar-goldline rounded-[10px] text-ar-text text-[12.5px]"
                />
              </div>
            </div>
            <div className="py-2.5 px-3.5 bg-ar-goldfill border border-ar-goldline rounded-[10px] text-[12.5px] text-ar-gold2">
              {fmtRp(Number(amount) || 0)} × {Number(qty) || 0} = <strong>{fmtRp(total)}</strong>
            </div>
          </div>

          {success && <div className="mt-3.5 text-[12px] text-ar-green">{success}</div>}
          {msg && <div className="mt-3.5 text-[11.5px] text-ar-red">{msg}</div>}

          <button
            disabled={busy || !employeeId || !location || !qty || Number(qty) <= 0}
            onClick={submit}
            className="mt-3.5 py-2.5 px-5 ar-grad rounded-[10px] text-ar-ongold text-[11px] font-bold tracking-[0.14em] uppercase cursor-pointer disabled:opacity-60"
          >
            Simpan Pendapatan
          </button>
          </div>
        </div>

        <div className="p-5 bg-ar-surface border border-ar-line rounded-2xl h-fit">
          <div className="font-display text-[19px] text-ar-gold2 mb-3.5">Entri Terbaru (per tanggal)</div>
          <div className="flex flex-col gap-2">
            {entries.length === 0 && <div className="text-[12.5px] text-ar-faint">Belum ada entri.</div>}
            {entries.map((e) => (
              <div key={e.id} className="p-3 bg-ar-surface2 border border-ar-line rounded-[11px] text-[12px]">
                <div className="flex justify-between gap-2 items-start">
                  <span>
                    {e.employeeName} <span className="text-ar-dim">({e.employeeCode})</span>
                  </span>
                  <span className="text-ar-gold2 font-display text-[15px] whitespace-nowrap">{e.amount}</span>
                </div>
                <div className="flex justify-between items-center gap-2 mt-1">
                  <span className="text-[10.5px] text-ar-dim">
                    {e.count} voucher · {e.occurredAt}
                  </span>
                  <button
                    onClick={() => openEdit(e)}
                    className="text-[10.5px] text-ar-gold cursor-pointer whitespace-nowrap"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editKey && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-5 overflow-y-auto"
          onClick={(ev) => ev.target === ev.currentTarget && closeEdit()}
        >
          <div className="w-full max-w-[420px] mt-[70px] p-5 bg-ar-surface border border-ar-goldline rounded-2xl">
            <div className="flex justify-between items-center mb-3.5">
              <div className="font-display text-[19px] text-ar-gold2">Edit Pendapatan</div>
              <button onClick={closeEdit} className="text-ar-dim text-[11px] cursor-pointer">
                Tutup
              </button>
            </div>

            {editLoading && <div className="text-[12.5px] text-ar-faint">Memuat…</div>}

            {!editLoading && editDetail && (
              <>
                <div className="mb-3.5 text-[12.5px] text-ar-text">
                  {editDetail.employeeName} <span className="text-ar-dim">({editDetail.employeeCode})</span>
                </div>
                {editDetail.mixed && (
                  <div className="mb-3.5 py-2 px-3 bg-[rgba(240,180,80,.12)] border border-[rgba(240,180,80,.35)] rounded-lg text-[11px] text-ar-gold">
                    ⚠ Entri hari ini punya kategori/rate/lokasi yang berbeda-beda per voucher — menyimpan di sini akan
                    menyeragamkan semuanya jadi satu nilai.
                  </div>
                )}

                <div className="grid gap-3.5">
                  <div>
                    <label className="text-[10px] tracking-[0.14em] uppercase text-ar-dim mb-1.5 block">Tanggal</label>
                    <input
                      type="date"
                      value={editOccurredAt}
                      onChange={(ev) => setEditOccurredAt(ev.target.value)}
                      className="w-full py-2.5 px-3.5 bg-ar-input border border-ar-goldline rounded-[10px] text-ar-text text-[12.5px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] tracking-[0.14em] uppercase text-ar-dim mb-1.5 block">Pendapatan / VCR</label>
                    <select
                      value={editCategory}
                      onChange={(ev) => setEditCategory(ev.target.value as EmployeeLevel)}
                      className="w-full py-2.5 px-3.5 bg-ar-input border border-ar-goldline rounded-[10px] text-ar-text text-[12.5px]"
                    >
                      {EMPLOYEE_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {VOUCHER_LABEL[lvl]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] tracking-[0.14em] uppercase text-ar-dim mb-1.5 block">Lokasi Kerja</label>
                    <select
                      value={editClient}
                      onChange={(ev) => setEditClient(ev.target.value)}
                      className="w-full py-2.5 px-3.5 bg-ar-input border border-ar-goldline rounded-[10px] text-ar-text text-[12.5px]"
                    >
                      {editClient && !FIELD_CITIES.some((c) => c.place === editClient) && (
                        <option value={editClient}>{editClient} (lama)</option>
                      )}
                      {FIELD_CITIES.map((c) => (
                        <option key={c.place} value={c.place}>
                          {c.place}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] tracking-[0.14em] uppercase text-ar-dim mb-1.5 block">Rate /VCR</label>
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(ev) => setEditAmount(ev.target.value)}
                        className="w-full py-2.5 px-3.5 bg-ar-input border border-ar-goldline rounded-[10px] text-ar-text text-[12.5px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.14em] uppercase text-ar-dim mb-1.5 block">Jumlah VCR</label>
                      <input
                        type="number"
                        min={1}
                        value={editQty}
                        onChange={(ev) => setEditQty(ev.target.value)}
                        className="w-full py-2.5 px-3.5 bg-ar-input border border-ar-goldline rounded-[10px] text-ar-text text-[12.5px]"
                      />
                    </div>
                  </div>
                  <div className="py-2.5 px-3.5 bg-ar-goldfill border border-ar-goldline rounded-[10px] text-[12.5px] text-ar-gold2">
                    {fmtRp(Number(editAmount) || 0)} × {Number(editQty) || 0} = <strong>{fmtRp(editTotal)}</strong>
                  </div>
                </div>

                {editMsg && <div className="mt-3.5 text-[11.5px] text-ar-red">{editMsg}</div>}

                <div className="flex gap-2.5 mt-3.5">
                  <button
                    disabled={editBusy || !editClient || !editQty || Number(editQty) <= 0}
                    onClick={saveEdit}
                    className="flex-1 py-2.5 ar-grad rounded-[10px] text-ar-ongold text-[11px] font-bold tracking-[0.14em] uppercase cursor-pointer disabled:opacity-60"
                  >
                    {editBusy ? "Menyimpan…" : "Simpan Perubahan"}
                  </button>
                </div>

                <div className="mt-3.5 pt-3.5 border-t border-ar-line">
                  {confirmDeleteKey === editKey ? (
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-ar-red flex-1">Hapus seluruh entri hari ini? Tidak bisa dibatalkan.</span>
                      <button
                        disabled={editBusy}
                        onClick={deleteEntry}
                        className="text-[11px] text-ar-red font-semibold cursor-pointer whitespace-nowrap"
                      >
                        Ya, Hapus
                      </button>
                      <button onClick={() => setConfirmDeleteKey(null)} className="text-[11px] text-ar-dim cursor-pointer">
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteKey(editKey)}
                      className="text-[11px] text-ar-red cursor-pointer"
                    >
                      Hapus Entri Ini
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
