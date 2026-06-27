import { useEffect, useState } from 'react';
import EventCard from '../components/EventCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getEvents } from '../services/api';

const categoryFilters = ['All', 'Education', 'Workshop', 'Community', 'Celebration', 'Visit'];

function Events() {
  const [events, setEvents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    getEvents()
      .then((res) => { setEvents(res.data || []); setFiltered(res.data || []); })
      .catch(() => setError('Failed to load events. Please make sure the backend server is running.'))
      .finally(() => setLoading(false));
  }, []);

  const handleFilter = (cat) => {
    setActiveFilter(cat);
    setFiltered(cat === 'All' ? events : events.filter((e) => e.category === cat));
  };

  return (
    <>
      <section className="relative overflow-hidden bg-forest py-20 md:py-28">
        <div className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-white/5" />
        <div className="page-container relative">
          <span className="eyebrow">Community Events</span>
          <h1 className="mt-4 font-playfair text-4xl font-bold text-white md:text-5xl">Our Events</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/70">
            Explore our upcoming and past events — from education drives to community celebrations.
          </p>
        </div>
      </section>

      <section className="bg-ivory py-20">
        <div className="page-container">
          {/* Category filters */}
          <div className="mb-10 flex flex-wrap gap-2">
            {categoryFilters.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleFilter(cat)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  activeFilter === cat
                    ? 'bg-forest text-white shadow-md'
                    : 'bg-white text-stone-500 ring-1 ring-stone-200 hover:ring-forest hover:text-forest'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading && <div className="py-24"><LoadingSpinner /></div>}
          {error && (
            <div className="rounded-2xl bg-red-50 p-8 text-center text-red-700 ring-1 ring-red-200">{error}</div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-stone-200 py-24 text-center">
              <p className="text-stone-400">No events found in this category.</p>
            </div>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Events;
