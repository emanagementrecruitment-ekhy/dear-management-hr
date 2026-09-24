import Image from "next/image";

// iOS has no APK installer at all (different OS, different binary format) —
// this page is the real substitute: DEAR Management is already a PWA
// (see src/app/manifest.ts + the appleWebApp meta tags in layout.tsx), so
// Safari's own "Add to Home Screen" gives an iPhone user a real app icon,
// full-screen launch, and offline-friendly shell without the App Store, an
// Apple Developer account, or a Mac to build/sign anything.
const STEPS = [
  {
    title: "Buka di Safari",
    body: "Halaman ini (dan halaman login) harus dibuka lewat Safari — bukan Chrome/lainnya. Hanya Safari yang bisa “Add to Home Screen” di iPhone.",
  },
  {
    title: "Tap tombol Share",
    body: "Di bar bawah Safari, tap ikon kotak dengan panah ke atas (Share / Bagikan).",
  },
  {
    title: "Pilih “Add to Home Screen”",
    body: "Scroll daftar opsi ke bawah sampai ketemu “Add to Home Screen” (Tambah ke Layar Utama), lalu tap.",
  },
  {
    title: "Tap “Add”",
    body: "Nama sudah otomatis terisi “DEAR Management” — langsung tap Add di pojok kanan atas.",
  },
  {
    title: "Selesai — buka dari Home Screen",
    body: "Ikon DEAR Management sekarang ada di layar utama iPhone, persis seperti aplikasi biasa: full-screen, tanpa address bar Safari.",
  },
];

export default function IphoneInstallPage() {
  return (
    <div className="min-h-screen bg-ar-bg text-ar-text flex flex-col items-center px-5 py-10">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center mb-7">
          <div className="relative w-16 h-16 mb-4">
            <Image src="/ar-corp-logo.png" alt="DEAR Management" fill className="rounded-full object-contain bg-ar-surface border border-ar-goldline" />
          </div>
          <div className="font-display text-[16px] tracking-[0.38em] uppercase font-bold text-center">
            <span className="bm-shimmer-rosegold">DEAR MANAGEMENT</span>
          </div>
          <div className="text-[10px] tracking-[0.2em] text-ar-dim mt-2 uppercase text-center">
            Pasang di iPhone — tanpa App Store
          </div>
        </div>

        <div className="bm-login-card bg-ar-surface rounded-[22px] px-6 py-6 mb-5">
          <p className="text-[12px] leading-[1.7] text-ar-dim">
            iPhone tidak bisa memasang file APK (format Android) — sistemnya beda total. Tapi DEAR Management HR sudah
            berbentuk aplikasi web (PWA), jadi cukup 5 langkah di bawah untuk dapat ikon aplikasi asli di layar utama,
            tanpa App Store, tanpa akun developer, gratis.
          </p>
        </div>

        <ol className="flex flex-col gap-3.5">
          {STEPS.map((step, i) => (
            <li key={i} className="bm-login-card bg-ar-surface rounded-[16px] px-5 py-4 flex gap-4 items-start">
              <div className="shrink-0 w-7 h-7 rounded-full ar-grad flex items-center justify-center text-ar-ongold text-[12px] font-bold">
                {i + 1}
              </div>
              <div>
                <div className="text-[12.5px] font-semibold text-ar-gold mb-1">{step.title}</div>
                <div className="text-[11.5px] leading-[1.6] text-ar-dim">{step.body}</div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-7 flex flex-col items-center gap-2">
          <a
            href="/login"
            className="w-full text-center py-[14px] ar-grad rounded-[11px] text-ar-ongold text-xs font-bold tracking-[0.18em] uppercase"
          >
            Buka Halaman Login
          </a>
          <div className="text-[9.5px] text-ar-faint opacity-70 text-center mt-1">
            Butuh Android atau Windows? <a href="/login" className="underline">Buka halaman login</a> untuk tombol unduh APK/Desktop.
          </div>
        </div>

        <div className="mt-6 text-center text-[9px] tracking-[0.15em] text-ar-faint opacity-50">
          Project By : DEAR Management
        </div>
      </div>
    </div>
  );
}
