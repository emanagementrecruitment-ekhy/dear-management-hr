import Image from "next/image";

export default function AppHeader({
  name,
  code,
  announcementText,
}: {
  name: string;
  code: string;
  announcementText?: string | null;
}) {
  return (
    <div className="max-w-[720px] w-full mx-auto px-4 sm:px-5 pt-6 pb-5 border-b border-ar-line">
      <div className="flex items-center gap-3">
        <Image
          src="/api/brand-logo"
          alt="DEAR Management"
          width={64}
          height={64}
          unoptimized
          className="rounded-full object-contain bg-ar-bg border border-ar-goldline"
        />
        <div>
          <div className="font-display text-[13px] tracking-[0.34em] text-ar-gold uppercase">DEAR Management</div>
          <div className="text-[10px] tracking-[0.16em] text-ar-dim mt-1 uppercase">
            Aplikasi Karyawan · {name} ({code})
          </div>
        </div>
      </div>
      {announcementText && (
        <div className="ar-marquee-track mt-3 py-1.5 px-3 bg-ar-goldfill border border-ar-goldline/50 rounded-[9px]">
          <span className="text-[11px] text-ar-gold2">📢 {announcementText}</span>
        </div>
      )}
    </div>
  );
}
