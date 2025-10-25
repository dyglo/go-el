import { Skeleton } from '@/components/ui/skeleton';

export default function ShareLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-2xl">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <Skeleton className="h-10 w-28 rounded-full bg-white/10" />
          <Skeleton className="h-6 w-24 bg-white/10" />
          <Skeleton className="h-6 w-32 bg-white/10" />
        </header>

        <section className="mt-8 space-y-6">
          <div className="space-y-3 text-center">
            <Skeleton className="mx-auto h-8 w-64 bg-white/10" />
            <Skeleton className="mx-auto h-4 w-48 bg-white/5" />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <Skeleton className="h-4 w-48 bg-white/10" />
            <Skeleton className="mt-4 h-3 w-full bg-white/5" />
            <Skeleton className="mt-3 h-3 w-11/12 bg-white/5" />
            <Skeleton className="mt-5 h-10 w-full rounded-full bg-white/10" />
          </div>

          <div className="space-y-3">
            {[0, 1, 2].map((key) => (
              <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <Skeleton className="h-4 w-48 bg-white/10" />
                <Skeleton className="mt-3 h-3 w-full bg-white/5" />
                <Skeleton className="mt-2 h-3 w-10/12 bg-white/5" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
