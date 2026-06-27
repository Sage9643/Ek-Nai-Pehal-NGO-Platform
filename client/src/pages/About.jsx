import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const timeline = [
  { year: '2024', event: 'Ek Nai Pehal founded by a group of individuals passionate about social change.' },
  { year: '2025', event: "Outreached multiple communities and conducted multiple  speaker sessions and educational trips for student's holistic growth and development"},
  { year: '2026', event: "100+ students supported, 12+ community programs, and growing impact one step at a time." },
];

const values = [
  { title: 'Empathy', desc: 'We lead with compassion, placing the needs of communities at the heart of everything we do.', icon: '❤️' },
  { title: 'Integrity', desc: 'Transparency and accountability guide every decision we make with our donors and communities.', icon: '🛡️' },
  { title: 'Impact', desc: 'We measure success by real change — in classrooms, homes, and lives transformed.', icon: '🌱' },
  { title: 'Inclusion', desc: 'Every voice matters. We build programs that reach the most overlooked members of society.', icon: '🤝' },
];

const impactStats = [
  { value: '100+', label: 'Students Supported' },
  { value: '50+', label: 'Volunteers Registered' },
  { value: '12+', label: 'Programs Conducted' },
  { value: '15+', label: 'Partner Institutions' },
];

// Simple reveal on scroll
function RevealSection({ children, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; obs.unobserve(el); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: 0, transform: 'translateY(28px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }} className={className}>
      {children}
    </div>
  );
}

function About() {
  return (
    <>
      {/* Page header */}
      <section className="relative overflow-hidden bg-forest py-20 md:py-28">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-56 w-56 rounded-full bg-saffron/10" />
        <div className="page-container relative">
          <span className="eyebrow">Our Story</span>
          <h1 className="mt-4 font-playfair text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            About Ek Nai Pehal
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/70">
            A volunteer-driven NGO committed to education, community development, and social welfare — creating a new beginning for those who need it most.
          </p>
        </div>
      </section>

      {/* Who we are */}
      <section className="bg-white py-20">
        <div className="page-container grid gap-12 lg:grid-cols-2 lg:items-center">
          <RevealSection>
            <span className="eyebrow">Who We Are</span>
            <h2 className="mt-3 font-playfair text-3xl font-bold text-forest md:text-4xl">
              School of New Hopes
            </h2>
            <p className="mt-5 leading-relaxed text-stone-500">
              Ek Nai Pehal (meaning &ldquo;A New Beginning&rdquo;) is a NGO founded in 2024 which aims to work for unprivileged slum kids.
              Our main aim is to provide these students with free education and teaching some new skills to make their life better.
              We work with students,volunteers, colleges, and communities to create meaningful social impact through
              education and awareness programs.
            </p>
            <p className="mt-4 leading-relaxed text-stone-500">
              Our volunteers are the backbone of every initiative — from teaching children to
              organizing health camps, each effort is powered by people who believe that
              change begins with a single step.
            </p>
            <Link to="/volunteer" className="btn-primary mt-8 inline-flex">
              Join Our Team
            </Link>
          </RevealSection>
          <RevealSection>
            <div className="overflow-hidden rounded-2xl shadow-xl">
              <img
                src="/image/education.png"
                alt="Our team with children"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-ivory py-20">
        <div className="page-container">
          <div className="mb-12 text-center">
            <span className="eyebrow">Purpose & Direction</span>
            <h2 className="mt-3 font-playfair text-4xl font-bold text-forest">Mission & Vision</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <RevealSection className="rounded-2xl bg-forest p-10 text-white">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">🎯</div>
              <h3 className="font-playfair text-2xl font-bold">Our Mission</h3>
              <p className="mt-4 leading-relaxed text-white/75">
                To empower underprivileged slum kids through education, skill development,
                health awareness, and volunteer-driven social initiatives that create sustainable change.
              </p>
            </RevealSection>
            <RevealSection className="rounded-2xl bg-saffron p-10 text-white">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl">🌅</div>
              <h3 className="font-playfair text-2xl font-bold">Our Vision</h3>
              <p className="mt-4 leading-relaxed text-white/85">
                A society where every individual has access to quality education, basic healthcare,
                and opportunities for dignified livelihood — regardless of their socio-economic background.
              </p>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-white py-20">
        <div className="page-container max-w-3xl">
          <div className="mb-12 text-center">
            <span className="eyebrow">Our Journey</span>
            <h2 className="mt-3 font-playfair text-4xl font-bold text-forest">Milestones</h2>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[52px] top-0 h-full w-0.5 bg-stone-200 md:left-[60px]" />
            <div className="space-y-8">
              {timeline.map((item, i) => (
                <RevealSection key={item.year} className="flex gap-6">
                  <div className="relative flex shrink-0 flex-col items-center">
                    <div className={`z-10 flex h-[104px] w-[104px] items-center justify-center rounded-xl text-sm font-bold shadow-md md:h-24 md:w-24 ${i % 2 === 0 ? 'bg-forest text-white' : 'bg-saffron text-white'}`}>
                      {item.year}
                    </div>
                  </div>
                  <div className="flex flex-1 items-center rounded-2xl bg-ivory p-6 shadow-sm ring-1 ring-stone-100">
                    <p className="leading-relaxed text-stone-600">{item.event}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core values */}
      <section className="bg-ivory py-20">
        <div className="page-container">
          <div className="mb-12 text-center">
            <span className="eyebrow">What Drives Us</span>
            <h2 className="mt-3 font-playfair text-4xl font-bold text-forest">Core Values</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <RevealSection key={v.title} className="card p-7 text-center">
                <div className="mb-4 text-4xl">{v.icon}</div>
                <h3 className="font-playfair text-xl font-bold text-forest">{v.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-stone-500">{v.desc}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Impact numbers */}
      <section className="bg-forest py-20">
        <div className="page-container">
          <div className="mb-12 text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.15em] text-saffron">Numbers That Matter</span>
            <h2 className="mt-3 font-playfair text-4xl font-bold text-white">Our Impact</h2>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {impactStats.map((s) => (
              <RevealSection key={s.label} className="rounded-2xl bg-white/10 p-8 text-center backdrop-blur-sm ring-1 ring-white/10">
                <p className="font-playfair text-4xl font-bold text-saffron">{s.value}</p>
                <p className="mt-2 text-sm text-white/60">{s.label}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Team placeholder */}
      <section className="bg-white py-20">
        <div className="page-container text-center">
          <span className="eyebrow">The People</span>
          <h2 className="mt-3 font-playfair text-4xl font-bold text-forest">Our Team</h2>
          <p className="mx-auto mt-4 max-w-xl text-stone-500">
            Passionate students, professionals, and community leaders united by a common goal.
          </p>
          <div className="mt-12 rounded-2xl border-2 border-dashed border-stone-200 py-16">
            <p className="text-stone-400">Team profiles coming soon.</p>
            <Link to="/volunteer" className="btn-primary mt-6 inline-flex">Become Part of the Team</Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default About;
