import ContactForm from '../components/ContactForm';

const contactDetails = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    label: 'Email',
    value: 'EkNaipehal1711@gmail.com',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
      </svg>
    ),
    label: 'Phone',
    value: '+91-9953910510',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    label: 'Location',
    value: 'Noida Sec-121, Uttar Pradesh',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Response Time',
    value: 'Within 2–3 business days',
  },
];

function Contact() {
  return (
    <>
      <section className="relative overflow-hidden bg-forest py-20 md:py-28">
        <div className="pointer-events-none absolute -right-16 top-0 h-60 w-60 rounded-full bg-white/5" />
        <div className="page-container relative">
          <span className="eyebrow">Get In Touch</span>
          <h1 className="mt-4 font-playfair text-4xl font-bold text-white md:text-5xl">Contact Us</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/70">
            Have a question or want to partner with us? We would love to hear from you.
          </p>
        </div>
      </section>

      <section className="bg-ivory py-20">
        <div className="page-container grid gap-12 lg:grid-cols-[1fr_1.5fr]">
          {/* Left — contact info */}
          <div>
            <span className="eyebrow">Reach Us</span>
            <h2 className="mt-3 font-playfair text-3xl font-bold text-forest">We&apos;re Here to Help</h2>
            <p className="mt-4 leading-relaxed text-stone-500">
              Reach out for volunteering, donations, partnerships, or general inquiries.
              Our dedicated team is always ready to assist you.
            </p>

            <div className="mt-8 space-y-4">
              {contactDetails.map((item) => (
                <div key={item.label} className="flex items-start gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest/8 text-forest">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{item.label}</p>
                    <p className="mt-0.5 text-sm font-medium text-forest">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Embedded map */}
            <div className="mt-8 overflow-hidden rounded-2xl shadow-md">
              
              <iframe
                title="Ek Nai Pehal Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d643.5377900201455!2d77.39017626392167!3d28.599463276776845!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cef9ca01f4399%3A0x3463e61b986f447c!2sH9XR%2BRGJ%2C%20Rani%20Avantibai%20Rd%2C%20Sector%20121%2C%20Noida%2C%20Basi%20Bahuddin%20Nagar%2C%20Uttar%20Pradesh%20201316!5e1!3m2!1sen!2sin!4v1782477583350!5m2!1sen!2sin"
                width="100%"
                height="220"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Right — form */}
          <div>
            <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-stone-100 md:p-10">
              <h3 className="font-playfair text-2xl font-bold text-forest">Send a Message</h3>
              <p className="mt-2 text-sm text-stone-500">
                Fill out the form and we&apos;ll get back to you as soon as possible.
              </p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Contact;
