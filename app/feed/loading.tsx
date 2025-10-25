import { Skeleton } from '@/components/ui/skeleton';

export default function FeedLoading() {
  return (
    <div className="min-h-screen bg-midnight px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-2xl bg-white/10" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 bg-white/10" />
              <Skeleton className="h-3 w-24 bg-white/10" />
            </div>
          </div>
          <Skeleton className="h-10 w-40 self-start rounded-full bg-white/10 sm:self-auto" />
        </header>

        <main className="mt-8 grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            {[0, 1, 2].map((key) => (
              <div key={key} className="rounded-3xl border border-white/10 bg-black/40 p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-white/10" />
                    <Skeleton className="h-3 w-20 bg-white/5" />
                  </div>
                  <Skeleton className="h-9 w-20 rounded-full bg-white/10" />
                </div>
                <div className="mt-6 space-y-3">
                  <Skeleton className="h-4 w-full bg-white/5" />
                  <Skeleton className="h-4 w-11/12 bg-white/5" />
                  <Skeleton className="h-4 w-10/12 bg-white/5" />
                </div>
                <div className="mt-6 flex gap-3">
                  <Skeleton className="h-10 w-24 rounded-full bg-white/10" />
                  <Skeleton className="h-10 w-24 rounded-full bg-white/10" />
                </div>
              </div>
            ))}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-black/50 p-6">
              <Skeleton className="h-4 w-32 bg-white/10" />
              <div className="mt-4 space-y-3">
                <Skeleton className="h-3 w-full bg-white/5" />
                <Skeleton className="h-3 w-10/12 bg-white/5" />
                <Skeleton className="h-3 w-9/12 bg-white/5" />
              </div>
              <Skeleton className="mt-6 h-10 w-full rounded-full bg-white/10" />
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/40 p-6 space-y-4">
              <Skeleton className="h-4 w-24 bg-white/10" />
              <Skeleton className="h-3 w-full bg-white/5" />
              <Skeleton className="h-3 w-4/6 bg-white/5" />
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
