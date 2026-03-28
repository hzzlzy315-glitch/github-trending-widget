function SkeletonRow({ index }: { index: number }) {
  return (
    <div
      className="flex items-center gap-3 mx-2 px-2.5 py-2.5 animate-fade-in-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="w-4 h-3 rounded-md bg-black/[0.04] dark:bg-white/[0.06] animate-pulse" />
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div
          className="h-3.5 rounded-md bg-black/[0.05] dark:bg-white/[0.07] animate-pulse"
          style={{ width: `${55 + ((index * 17) % 35)}%` }}
        />
        <div className="h-2.5 w-16 rounded-md bg-black/[0.03] dark:bg-white/[0.04] animate-pulse" />
      </div>
      <div className="w-8 h-3 rounded-md bg-black/[0.03] dark:bg-white/[0.04] animate-pulse" />
    </div>
  );
}

export function Skeleton() {
  return (
    <div className="flex flex-col py-1" role="status" aria-label="Loading">
      {Array.from({ length: 10 }, (_, i) => (
        <SkeletonRow key={i} index={i} />
      ))}
    </div>
  );
}
