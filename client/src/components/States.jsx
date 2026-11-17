// Loading, error and empty states used across pages

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <span role="status" className={`inline-block animate-spin rounded-full border-2 border-white/20 border-t-accent ${className}`}>
      <span className="sr-only">Loading</span>
    </span>
  );
}

export function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-muted">
      <Spinner className="h-8 w-8" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div role="alert" className="card mx-auto my-10 max-w-lg text-center">
      <p className="text-lg font-semibold">We could not load this content.</p>
      <p className="mt-2 text-sm text-muted">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost mt-5 btn-sm">Try again</button>
      )}
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="card border-dashed py-14 text-center">
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SkeletonCards({ count = 3 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card space-y-4">
          <div className="skeleton aspect-video rounded-xl" />
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="skeleton h-5 w-3/4 rounded" />
        </div>
      ))}
    </div>
  );
}
