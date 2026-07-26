import type { CSSProperties } from "react";

interface SkeletonBlockProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

interface SkeletonCardProps {
  className?: string;
}

function toSizeValue(value: number | string | undefined) {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

export function SkeletonBlock({ width = "100%", height = 16, className = "" }: SkeletonBlockProps) {
  const style: CSSProperties = {
    width: toSizeValue(width),
    height: toSizeValue(height),
  };

  return <div className={`animate-pulse rounded-md bg-[#e2e8f0] ${className}`.trim()} style={style} />;
}

export function SkeletonCard({ className = "" }: SkeletonCardProps) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 ${className}`.trim()}>
      <SkeletonBlock width="20%" height={14} className="mb-3" />
      <SkeletonBlock width="42%" height={34} className="mb-5" />
      <SkeletonBlock width="75%" height={20} className="mb-2" />
      <SkeletonBlock width="58%" height={18} className="mb-6" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonBlock height={72} className="rounded-xl" />
        <SkeletonBlock height={72} className="rounded-xl" />
        <SkeletonBlock height={72} className="rounded-xl" />
      </div>
    </section>
  );
}

export function SkeletonTable({ rows = 6, columns = 6, className = "" }: SkeletonTableProps) {
  const safeRows = Math.max(1, rows);
  const safeColumns = Math.max(1, columns);

  return (
    <section className={`rounded-xl border border-slate-200 bg-white ${className}`.trim()}>
      <div className="space-y-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))` }}>
          {Array.from({ length: safeColumns }).map((_, index) => (
            <SkeletonBlock key={`header-${index}`} height={12} width="75%" />
          ))}
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {Array.from({ length: safeRows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="grid gap-3 px-4 py-4 sm:px-6" style={{ gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))` }}>
            {Array.from({ length: safeColumns }).map((__, colIndex) => (
              <SkeletonBlock key={`row-${rowIndex}-col-${colIndex}`} height={14} width={colIndex === safeColumns - 1 ? "45%" : "85%"} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
