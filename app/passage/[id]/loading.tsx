import { Skeleton } from '@/components/ui/skeleton';

export default function PassageLoading() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-24 rounded-full bg-white/10" />
          </div>
          <Skeleton className="h-6 w-32 bg-white/10" />
          <Skeleton className="h-6 w-20 bg-white/10" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="text-center">
          <Skeleton className="mx-auto h-8 w-64 bg-white/10" />
          <Skeleton className="mx-auto mt-3 h-4 w-32 bg-white/5" />
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-10">
          <div className="space-y-4">
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} className="h-4 w-full bg-white/5" />
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {[0, 1].map((key) => (
            <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <Skeleton className="h-5 w-40 bg-white/10" />
              <Skeleton className="mt-5 h-4 w-full bg-white/5" />
              <Skeleton className="mt-3 h-4 w-10/12 bg-white/5" />
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-12 flex-1 rounded-full bg-white/10" />
          ))}
        </div>
      </main>
    </div>
  );
}
