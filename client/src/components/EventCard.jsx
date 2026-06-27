const categoryConfig = {
  Education:   { bg: 'bg-forest/10', text: 'text-forest',      dot: 'bg-forest' },
  Workshop:    { bg: 'bg-blue-50',   text: 'text-blue-700',    dot: 'bg-blue-500' },
  Community:   { bg: 'bg-amber-50',  text: 'text-amber-700',   dot: 'bg-amber-500' },
  Celebration: { bg: 'bg-pink-50',   text: 'text-pink-700',    dot: 'bg-pink-500' },
  Visit:       { bg: 'bg-purple-50', text: 'text-purple-700',  dot: 'bg-purple-500' },
};

function EventCard({ event }) {
  const date = new Date(event.date);
  const day = date.toLocaleDateString('en-IN', { day: 'numeric' });
  const month = date.toLocaleDateString('en-IN', { month: 'short' });
  const year = date.toLocaleDateString('en-IN', { year: 'numeric' });

  const config = categoryConfig[event.category] || {
    bg: 'bg-stone-100', text: 'text-stone-600', dot: 'bg-stone-400'
  };

  return (
    <article className="card group overflow-hidden">
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Date badge */}
        <div className="absolute top-3 left-3 flex flex-col items-center justify-center rounded-xl bg-white/95 px-3 py-2 text-center shadow-md backdrop-blur-sm">
          <span className="font-playfair text-2xl font-bold leading-none text-forest">{day}</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-saffron">{month}</span>
          <span className="text-[10px] text-stone-400">{year}</span>
        </div>
        {/* Category badge */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${config.bg} ${config.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
            {event.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-playfair text-lg font-bold text-forest line-clamp-2 group-hover:text-saffron-dark transition-colors">
          {event.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-500">
          {event.description}
        </p>
        {event.location && (
          <div className="mt-4 flex items-center gap-1.5 text-xs text-stone-400">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {event.location}
          </div>
        )}
      </div>
    </article>
  );
}

export default EventCard;
