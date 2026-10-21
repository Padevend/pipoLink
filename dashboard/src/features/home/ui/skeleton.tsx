export function HomeSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      {/* HEADER SKELETON */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-3">
          <div className="h-8 w-64 bg-zinc-200 rounded-full" />
          <div className="h-4 w-96 bg-zinc-100 rounded-full" />
        </div>
        <div className="h-12 w-32 bg-zinc-200 rounded-full" />
      </div>

      {/* STATS CARDS SKELETON (2 rows of 4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-zinc-50 rounded-[2rem] p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-zinc-200 rounded-full" />
              <div className="h-12 w-12 bg-zinc-200 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-20 bg-zinc-200 rounded-full" />
              <div className="h-3 w-16 bg-zinc-100 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* TABLE SKELETON */}
      <div className="bg-zinc-50 rounded-[2rem] p-6 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-zinc-200">
          <div className="h-6 w-48 bg-zinc-200 rounded-full" />
          <div className="h-6 w-24 bg-zinc-200 rounded-full" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-zinc-200 rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-zinc-200 rounded-full" />
                  <div className="h-3 w-24 bg-zinc-100 rounded-full" />
                </div>
              </div>
              <div className="h-6 w-20 bg-zinc-200 rounded-full" />
              <div className="h-4 w-32 bg-zinc-100 rounded-full hidden md:block" />
              <div className="h-4 w-24 bg-zinc-100 rounded-full hidden lg:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}