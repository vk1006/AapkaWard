export default function LocaleLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-56 rounded-lg bg-orange-100 dark:bg-stone-800" />
      <div className="h-4 w-full max-w-md rounded bg-orange-50 dark:bg-stone-900" />
      <div className="mt-6 space-y-3">
        <div className="h-28 rounded-xl bg-white ring-1 ring-orange-100 dark:bg-stone-900 dark:ring-stone-700" />
        <div className="h-28 rounded-xl bg-white ring-1 ring-orange-100 dark:bg-stone-900 dark:ring-stone-700" />
        <div className="h-28 rounded-xl bg-white ring-1 ring-orange-100 dark:bg-stone-900 dark:ring-stone-700" />
      </div>
    </div>
  );
}
