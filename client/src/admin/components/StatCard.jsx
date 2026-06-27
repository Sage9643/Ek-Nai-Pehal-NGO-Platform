export default function StatCard({ label, value, icon, accent = 'forest' }) {
  const accents = {
    forest: 'bg-forest/10 text-forest',
    saffron: 'bg-saffron/10 text-saffron',
    sky: 'bg-sky/10 text-sky',
    stone: 'bg-stone-100 text-stone-600',
  };

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</p>
          <p className="stat-number mt-3 text-3xl font-bold sm:text-4xl">
            {value ?? '—'}
          </p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accents[accent]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
