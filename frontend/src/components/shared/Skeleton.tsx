interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-xl ${className}`} style={{ background: 'rgba(255,255,255,0.04)', ...style }} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex gap-6 items-start animate-fade-in">
      {/* Sidebar skeleton (desktop) */}
      <div className="hidden lg:flex flex-col gap-4 w-56 flex-shrink-0">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
        <Skeleton className="h-36 rounded-2xl" />
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Mobile header */}
        <div className="flex items-center justify-between lg:hidden">
          <div>
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-3 w-40 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </div>
        {/* Mobile KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        {/* Chart */}
        <Skeleton className="h-72 rounded-xl" />
        {/* 2-col row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        {/* Line chart */}
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card p-0 overflow-hidden animate-fade-in">
      <div className="px-5 py-3 border-b border-dark-600 flex gap-6">
        {[80, 160, 100, 60, 80].map((w, i) => (
          <Skeleton key={i} className="h-4" style={{ width: w }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-5 py-4 border-b border-dark-700 last:border-0 flex gap-6 items-center">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24 hidden md:block" />
          <Skeleton className="h-5 w-16 rounded-full hidden sm:block" />
          <Skeleton className="h-4 w-24 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex justify-between mb-4">
            <div>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-20 mt-2" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <Skeleton className="w-24 h-24 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 w-full rounded-xl mt-4" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
