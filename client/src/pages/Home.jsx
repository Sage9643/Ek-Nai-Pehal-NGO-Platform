import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProgramCard from '../components/ProgramCard';
import EventCard from '../components/EventCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getEvents } from '../services/api';
import * as images from '../assets/images/index.js';

// ─── DATA ──────────────────────────────────────────────────────────────────────

const stats = [
  {
    value: 100,
    suffix: '+',
    label: 'Children Educated',
    accent: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
      </svg>
    ),
  },
  {
    value: 20,
    suffix: '+',
    label: 'Active Volunteers',
    accent: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>
    ),
  },
  {
    value: 12,
    suffix: '+',
    label: 'Programs Running',
    accent: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
      </svg>
    ),
  },
  {
    value: 25,
    suffix: '+',
    label: 'Communities Impacted',
    accent: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    ),
  },
];

import { programs } from '../data/programs';

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Volunteer, Delhi University',
    text: 'Volunteering with Ek Nai Pehal transformed my perspective. Seeing children light up when they learn is an experience I will cherish forever.',
    avatar: 'PS',
  },
  {
    name: 'Rahul Verma',
    role: 'Program Coordinator',
    text: 'The impact we create in communities is immeasurable. Every program brings us closer to a more equitable society for all.',
    avatar: 'RV',
  },
  {
    name: 'Anita Joshi',
    role: 'Community Member',
    text: 'My daughter can now read and write confidently. The Shiksha Setu program changed her life and our family\'s future.',
    avatar: 'AJ',
  },
];

// ─── COUNT-UP HOOK ──────────────────────────────────────────────────────────────
function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setCount(Math.floor(ease * target));
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, target, duration]);

  return { ref, count };
}

// ─── STAT ITEM ──────────────────────────────────────────────────────────────────
function StatItem({ value, suffix, label, accent, icon }) {
  const { ref, count } = useCountUp(value);

  return (
    <div ref={ref} className="flex items-center gap-4 px-6 py-5 first:pl-0 last:pr-0">
      {/* Icon circle */}
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${accent ? 'bg-saffron/10 text-saffron' : 'bg-forest text-white'}`}>
        {icon}
      </div>
      {/* Number + label */}
      <div>
        <p className={`font-playfair text-3xl font-bold leading-none ${accent ? 'text-saffron' : 'text-forest'}`}>
          {count.toLocaleString('en-IN')}{suffix}
        </p>
        <p className="mt-1 text-sm text-stone-500">{label}</p>
      </div>
    </div>
  );
}

// ─── HOME ────────────────────────────────────────────────────────────────────────
function Home() {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    getEvents()
      .then((res) => setEvents(res.data?.slice(0, 3) || []))
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  }, []);

  return (
    <>
      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative min-h-[88vh] overflow-hidden bg-forest">
        {/* Right side image — covers roughly 55% of width */}
        <div className="absolute inset-y-0 right-0 w-full md:w-[58%]">
          <img
            src={images.hero}
            alt="Children learning"
            className="h-full w-full object-cover object-center"
          />
          {/* Gradient: dark on left (blends with text panel), subtle vignette right */}
          <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/60 to-forest/5 md:from-forest md:via-forest/50 md:to-transparent" />
          {/* Subtle top/bottom vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-forest/30 via-transparent to-forest/20" />
        </div>

        {/* Left content */}
        <div className="relative z-10 page-container flex min-h-[88vh] items-center py-20">
          <div className="max-w-xl">
            {/* Eyebrow pill */}
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-white/90 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-saffron" />
              A New Beginning for Every Child
            </span>

            {/* Headline — split colour on "Social" to match reference */}
            <h1 className="mt-6 font-playfair text-4xl font-bold leading-[1.15] text-white md:text-5xl lg:text-[3.25rem]">
              Empowering Communities
              <br />
              Through Education &amp;
              <br />
              <span className="text-saffron">Social</span> Change
            </h1>

            <p className="mt-5 text-base leading-relaxed text-white/75 md:text-lg">
              Ek Nai Pehal is dedicated to creating opportunities for underprivileged
              children and communities through education, awareness, and
              volunteer-driven initiatives.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/volunteer"
                className="inline-flex items-center gap-2 rounded-full bg-saffron px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-saffron/25 transition-all hover:bg-saffron-dark hover:-translate-y-0.5 hover:shadow-xl"
              >
                Become a Volunteer
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                to="/programs"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/60 hover:bg-white/20"
              >
                Explore Programs
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative leaf/circle accents */}
        <div className="pointer-events-none absolute bottom-10 left-8 h-24 w-24 rounded-full border border-white/5" />
        <div className="pointer-events-none absolute bottom-20 left-16 h-40 w-40 rounded-full border border-white/5" />
      </section>

      {/* ═══════════════════════ STATS BAR ═══════════════════════ */}
      <section className="bg-white shadow-sm">
        <div className="page-container">
          {/* Horizontal row with dividers */}
          <div className="flex flex-wrap items-stretch divide-y divide-stone-100 md:divide-x md:divide-y-0">
            {stats.map((stat, i) => (
              <div key={stat.label} className="w-1/2 md:w-1/4">
                <StatItem {...stat} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ PROGRAMS ═══════════════════════ */}
      <section className="bg-ivory py-20 md:py-24">
        <div className="page-container">
          {/* Section header */}
          <div className="mb-10 text-center">
            <span className="eyebrow">What We Do</span>
            <h2 className="mt-3 font-playfair text-4xl font-bold text-forest md:text-[2.6rem]">
              Our Programs
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-stone-500">
              We focus on holistic development through education, skill-building,
              and community empowerment programs.
            </p>
          </div>

          {/* 4-column program grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {programs.slice(0,4).map((program, i) => (
              <ProgramCard key={program.title} {...program} index={i} />
            ))}
          </div>

          {/* CTA */}
          <div className="mt-10 text-center">
            <Link
              to="/programs"
              className="inline-flex items-center gap-2 rounded-full bg-forest px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-forest-dark hover:-translate-y-0.5 hover:shadow-lg"
            >
              View All Programs
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ EVENTS ═══════════════════════ */}
      <section className="bg-white py-20 md:py-24">
        <div className="page-container">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="eyebrow">What's Happening</span>
              <h2 className="mt-3 font-playfair text-4xl font-bold text-forest">Recent Events</h2>
              <p className="mt-2 text-base text-stone-500">
                A glimpse into the initiatives, celebrations, and learning experiences that shape our journey.
              </p>
            </div>
            <Link
              to="/events"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest underline-offset-4 hover:text-saffron hover:underline"
            >
              View All Events
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {loadingEvents ? (
            <div className="mt-10 py-16"><LoadingSpinner /></div>
          ) : events.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border-2 border-dashed border-stone-200 py-16 text-center">
              <p className="text-stone-400">No upcoming events at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════ TESTIMONIALS ═══════════════════════ */}
      <section className="bg-forest py-20 md:py-24">
        <div className="page-container">
          <div className="mb-12 text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.15em] text-saffron">
              Voices of Change
            </span>
            <h2 className="mt-3 font-playfair text-4xl font-bold text-white">
              What People Say
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl bg-white/10 p-7 backdrop-blur-sm ring-1 ring-white/10">
                {/* Quote mark */}
                <svg className="mb-4 h-8 w-8 text-saffron/60" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                </svg>
                <p className="text-sm leading-relaxed text-white/80">{t.text}</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron text-sm font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/50">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ VOLUNTEER CTA ═══════════════════════ */}
      <section className="relative overflow-hidden bg-ivory py-20 md:py-24">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-saffron/8" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-forest/6" />

        <div className="page-container relative text-center">
          <span className="eyebrow">Join the Movement</span>
          <h2 className="mx-auto mt-3 max-w-2xl font-playfair text-4xl font-bold text-forest md:text-[2.6rem]">
            Ready to Make a Difference?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-stone-500">
            Whether you give your time, talent, or resources — every contribution helps us
            build a brighter future for underprivileged communities across India.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/volunteer"
              className="inline-flex items-center gap-2 rounded-full bg-forest px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-forest/20 transition-all hover:bg-forest-dark hover:-translate-y-0.5 hover:shadow-xl"
            >
              Become a Volunteer
            </Link>
            <Link
              to="/donate"
              className="inline-flex items-center gap-2 rounded-full border-2 border-forest px-8 py-3.5 text-sm font-semibold text-forest transition-all hover:bg-forest hover:text-white"
            >
              Donate Today
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
