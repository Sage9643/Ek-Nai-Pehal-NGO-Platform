import VolunteerForm from '../components/VolunteerForm';

const benefits = [
  { icon: '🎓', title: 'Skill Building', desc: 'Develop leadership, communication, and project management skills through real-world experience.' },
  { icon: '🤝', title: 'Community Impact', desc: 'Directly improve lives in your community and see the tangible results of your efforts.' },
  { icon: '📜', title: 'Certificate', desc: 'Receive an official volunteer certificate recognized by partner institutions.' },
  { icon: '🌐', title: 'Network', desc: 'Connect with like-minded individuals, mentors, and changemakers across India.' },
  { icon: '🏛️', title: 'Educational Visits', desc: 'Selected volunteers get opportunities for exclusive visits to educational institutions.' },
  { icon: '🌱', title: 'Personal Growth', desc: 'Expand your perspective and develop empathy through meaningful community interactions.' },
];

function Volunteer() {
  return (
    <>
      <section className="relative overflow-hidden bg-forest py-20 md:py-28">
        <div className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-saffron/10" />
        <div className="page-container relative">
          <span className="eyebrow">Make a Difference</span>
          <h1 className="mt-4 font-playfair text-4xl font-bold text-white md:text-5xl">Become a Volunteer</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/70">
            Join our family of changemakers. Your time and passion can transform lives.
          </p>
        </div>
      </section>

      {/* Benefits section */}
      <section className="bg-ivory py-20">
        <div className="page-container">
          <div className="mb-12 text-center">
            <span className="eyebrow">Why Volunteer?</span>
            <h2 className="mt-3 font-playfair text-4xl font-bold text-forest">Benefits of Volunteering</h2>
            <p className="mx-auto mt-4 max-w-xl text-stone-500">
              When you give your time to Ek Nai Pehal, you grow as much as the communities you serve.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title} className="card flex gap-5 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest/8 text-2xl">
                  {b.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-forest">{b.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone-500">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form section */}
      <section className="bg-white py-20">
        <div className="page-container">
          <div className="mx-auto max-w-2xl">
            <div className="mb-10 text-center">
              <span className="eyebrow">Apply Now</span>
              <h2 className="mt-3 font-playfair text-4xl font-bold text-forest">Register as Volunteer</h2>
              <p className="mt-3 text-stone-500">
                Fill out the form below and our team will get back to you within 2–3 business days.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-stone-100 md:p-10">
              <VolunteerForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Volunteer;
