export function PaymentsSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      {/* HEADER SKELETON */}
      <div className="space-y-3">
        <div className="h-8 w-64 bg-zinc-200 rounded-full" />
        <div className="h-4 w-96 bg-zinc-100 rounded-full" />
      </div>

      {/* ANALYTICS SKELETON */}
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="bg-zinc-50 rounded-[2rem] h-[350px] p-8 flex flex-col gap-4">
          <div className="h-6 w-48 bg-zinc-200 rounded-full" />
          <div className="flex-1 bg-zinc-100 rounded-[1rem]" />
        </div>
        <div className="bg-zinc-50 rounded-[2rem] h-[350px] p-8 flex flex-col gap-4">
          <div className="h-6 w-48 bg-zinc-200 rounded-full" />
          <div className="flex-1 bg-zinc-100 rounded-full mx-8" />
        </div>
      </div>

      {/* REVENUE CARDS SKELETON */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-zinc-50 rounded-[2rem] p-6 flex items-center gap-4">
            <div className="h-12 w-12 bg-zinc-200 rounded-full shrink-0" />
            <div className="space-y-2 w-full">
              <div className="h-3 w-24 bg-zinc-200 rounded-full" />
              <div className="h-6 w-32 bg-zinc-100 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* TABLE SKELETON */}
      <div className="bg-zinc-50 rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-zinc-200">
          <div className="h-4 w-full bg-zinc-200 rounded-full opacity-50" />
        </div>
        <div className="p-6 space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="flex items-center gap-4 w-1/3">
                <div className="h-10 w-10 bg-zinc-200 rounded-full shrink-0" />
                <div className="space-y-2 w-full">
                  <div className="h-4 w-3/4 bg-zinc-200 rounded-full" />
                  <div className="h-3 w-1/2 bg-zinc-100 rounded-full" />
                </div>
              </div>
              <div className="h-6 w-24 bg-zinc-200 rounded-full" />
              <div className="h-6 w-32 bg-zinc-200 rounded-full hidden md:block" />
              <div className="h-6 w-20 bg-zinc-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}