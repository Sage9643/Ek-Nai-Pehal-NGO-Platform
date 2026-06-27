import { Link } from 'react-router-dom';
import logo from "../assets/images/ek nai pehal logo.png";

const footerLinks = [
  {
    title: 'Organization',
    links: [
      { to: '/about', label: 'About Us' },
      { to: '/programs', label: 'Our Programs' },
      { to: '/events', label: 'Events' },
      { to: '/gallery', label: 'Gallery' },
    ],
  },
  {
    title: 'Get Involved',
    links: [
      { to: '/volunteer', label: 'Become a Volunteer' },
      { to: '/donate', label: 'Donate' },
      { to: '/contact', label: 'Partner With Us' },
    ],
  },
];

function Footer() {
  return (
    <footer className="bg-forest text-white">
      <div className="page-container py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <img
                src={logo}
                alt="Ek Nai Pehal"
                className="h-12 w-12 rounded-full object-contain shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
              <div>
                <div className="font-playfair text-xl font-bold">Ek Nai Pehal</div>
                <div className="text-[10px] tracking-widest text-white/40 uppercase">School of New hopes</div>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
              A volunteer-driven NGO based in Noida committed to education, community development, and social welfare of underpriviledged children since 2024.
            </p>
            {/* Social icons */}
            <div className="mt-6 flex gap-3">
              {[
                { label: 'Instagram', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
                { label: 'Facebook', icon: 'M24 12C24 5.373 18.627 0 12 0S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.234 2.686.234v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.47h-2.796v8.384C19.612 22.954 24 17.99 24 12z' },
              ].map((social) => (
                <a
                  key={social.label}
                  href={
                    social.label === "Instagram"? 
                    "https://www.instagram.com/ek_nai_pehal_/?hl=en" : "https://www.facebook.com/61568699619407/"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/60 transition hover:bg-saffron hover:text-white"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d={social.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40">{group.title}</h4>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-white/60 transition-colors hover:text-saffron"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/30 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Ek Nai Pehal. All rights reserved.</p>
          <p>Made with ♥ by volunteers, for the community.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
