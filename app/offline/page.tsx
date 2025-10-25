export const metadata = {
  title: "You're offline - GO'EL",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-white">
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-semibold">Offline for a moment</h1>
        <p className="text-white/70">
          GO&apos;EL works offline for passages you&apos;ve recently opened. Once you reconnect, we&apos;ll sync the
          latest feed and prayer updates.
        </p>
        <p className="text-sm text-white/50">
          Tip: add GO&apos;EL to your home screen for quick access and deeper offline caching.
        </p>
      </div>
    </main>
  );
}
