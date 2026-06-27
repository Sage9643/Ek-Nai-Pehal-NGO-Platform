import DonationForm from '../components/DonationForm';

const donationCategories = [
  { icon: '📚', title: 'Books & Stationery', desc: 'Supply textbooks, notebooks, and pens to children in need.', impact: 'Equips 1 child for a full academic year' },
  { icon: '👕', title: 'Clothes & Essentials', desc: 'Warm clothes and daily essentials for underprivileged families.', impact: 'Supports a family through the season' },
  { icon: '💻', title: 'Educational Material', desc: 'Digital devices and learning kits for our digital literacy program.', impact: 'Enables 5 students to access online learning' },
  { icon: '💰', title: 'Financial Support', desc: 'Fund program operations, events, and community outreach activities.', impact: 'Powers our programs all year round' },
];

function Donate() {
  return (
    <>
      <section className="relative overflow-hidden bg-saffron py-20 md:py-28">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-white/5" />
        <div className="page-container relative">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.15em] text-white/70">Give Back</span>
          <h1 className="mt-4 font-playfair text-4xl font-bold text-white md:text-5xl">Make a Donation</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            Your contribution — whether books, clothes, or financial support — helps us reach
            more children and communities in need.
          </p>
        </div>
      </section>

      {/* Impact categories */}
      <section className="bg-ivory py-20">
        <div className="page-container">
          <div className="mb-12 text-center">
            <span className="eyebrow">Your Impact</span>
            <h2 className="mt-3 font-playfair text-4xl font-bold text-forest">What You Can Give</h2>
            <p className="mx-auto mt-4 max-w-xl text-stone-500">
              Every donation, big or small, directly impacts the lives of children and families we serve.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {donationCategories.map((cat) => (
              <div key={cat.title} className="card flex flex-col p-7 text-center">
                <div className="mb-4 text-4xl">{cat.icon}</div>
                <h3 className="font-playfair text-lg font-bold text-forest">{cat.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-500">{cat.desc}</p>
                <div className="mt-4 rounded-xl bg-saffron/8 px-3 py-2">
                  <p className="text-xs font-semibold text-saffron-dark">✓ {cat.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Donation form */}
      <section className="bg-white py-20">
        <div className="page-container">
          <div className="mx-auto max-w-2xl">
            <div className="mb-10 text-center">
              <span className="eyebrow">Contribute Today</span>
              <h2 className="mt-3 font-playfair text-4xl font-bold text-forest">Submit Your Donation</h2>
              <p className="mt-3 text-stone-500">
                Tell us what you&apos;d like to donate and our team will coordinate pickup or transfer.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-stone-100 md:p-10">
              <DonationForm />
            </div>
            <p className="mt-6 text-center text-xs text-stone-400">
              Ek Nai Pehal. All donations are acknowledged.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default Donate;
