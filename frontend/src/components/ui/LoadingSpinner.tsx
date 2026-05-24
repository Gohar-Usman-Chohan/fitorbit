'use client';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        <p className="text-sm font-medium text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

export function FullPageLoadingSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}

export function SkeletonLoader() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200/70" />
      ))}
    </div>
  );
}
