import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logo from "../assets/images/ek nai pehal logo.png";

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/programs', label: 'Programs' },
  { to: '/events', label: 'Events' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/volunteer', label: 'Volunteer' },
  { to: '/contact', label: 'Contact' },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const linkClass = ({ isActive }) =>
    `relative text-sm font-medium transition-colors duration-150 pb-0.5 ${
      isActive
        ? 'text-saffron'
        : 'text-white/80 hover:text-white'
    }`;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-forest shadow-lg shadow-forest/20'
          : 'bg-forest/95 backdrop-blur-sm'
      }`}
    >
      <nav className="page-container flex items-center justify-between py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setIsOpen(false)}>
          <img
            src={logo}
            alt="Ek Nai Pehal"
            className="h-12 w-12 rounded-full object-contain shadow-sm transition-transform duration-300 group-hover:scale-105"
          />
          <div>
            <div className="font-playfair text-lg font-bold leading-none text-white">Ek Nai Pehal</div>
            <div className="text-[10px] font-medium tracking-widest text-white/50 uppercase">School of New Hopes</div>
          </div>
        </Link>

        {/* Desktop Links */}
        <ul className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} end={link.to === '/'} className={linkClass}>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* CTA + Hamburger */}
        <div className="flex items-center gap-3">
          <Link
            to="/donate"
            className="hidden rounded-full bg-saffron px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-saffron-dark hover:shadow-md lg:inline-flex"
          >
            Donate
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 lg:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden transition-all duration-300 lg:hidden ${
          isOpen ? 'max-h-screen border-t border-white/10' : 'max-h-0'
        }`}
      >
        <div className="page-container py-4 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/10 text-saffron' : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          <Link
            to="/donate"
            className="mt-2 block rounded-full bg-saffron px-5 py-2.5 text-center text-sm font-semibold text-white"
            onClick={() => setIsOpen(false)}
          >
            Donate Now
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
