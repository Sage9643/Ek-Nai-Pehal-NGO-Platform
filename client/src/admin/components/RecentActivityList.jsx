const typeLabels = {
  volunteer: 'Volunteer',
  contact: 'Contact',
  event: 'Event',
};

const typeStyles = {
  volunteer: 'bg-forest/10 text-forest',
  contact: 'bg-saffron/10 text-saffron',
  event: 'bg-sky/10 text-sky',
};

function formatDate(value) {
  if (!value) return '';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function RecentActivityList({ items = [] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-6 py-10 text-center">
        <p className="text-sm font-medium text-stone-600">No recent activity yet</p>
        <p className="mt-1 text-sm text-stone-400">
          New volunteers, contact requests, and events will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-stone-100">
      {items.map((item) => (
        <div key={`${item.type}-${item.id}`} className="flex items-start gap-4 px-1 py-4 first:pt-0 last:pb-0">
          <span
            className={`mt-0.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${typeStyles[item.type]}`}
          >
            {typeLabels[item.type]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-forest">{item.title}</p>
            <p className="truncate text-sm text-stone-500">{item.subtitle}</p>
          </div>
          <time className="shrink-0 text-xs text-stone-400">{formatDate(item.createdAt)}</time>
        </div>
      ))}
    </div>
  );
}
