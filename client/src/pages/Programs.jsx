import ProgramCard from '../components/ProgramCard';
import { Link } from 'react-router-dom';
import { programs } from '../data/programs';

function Programs() {
  return (
    <>
      <section className="relative overflow-hidden bg-forest py-20 md:py-28">
        <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-white/5" />
        <div className="page-container relative">
          <span className="eyebrow">What We Do</span>
          <h1 className="mt-4 font-playfair text-4xl font-bold text-white md:text-5xl">Our Programs</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/70">
            Initiatives driving education, empowerment, and 
            community development for the students.
          </p>
        </div>
      </section>

      <section className="bg-ivory py-20 md:py-24">
        <div className="page-container">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((program, i) => (
              <ProgramCard key={program.title} {...program} index={i} />
            ))}
          </div>
      
          <div className="mt-16 rounded-2xl bg-forest p-10 text-center md:p-16">
            <h3 className="font-playfair text-3xl font-bold text-white">Want to Contribute?</h3>
            <p className="mx-auto mt-4 max-w-lg text-white/70">
              Our programs run on the dedication of volunteers like you. Join us and help us expand our reach.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/volunteer" className="inline-flex items-center gap-2 rounded-full bg-saffron px-8 py-3.5 text-sm font-semibold text-white hover:bg-saffron-dark transition-all hover:-translate-y-0.5">
                Volunteer With Us
              </Link>
              <Link to="/donate" className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-all">
                Support a Program
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Programs;
