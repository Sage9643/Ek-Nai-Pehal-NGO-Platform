// ProgramCard — matches reference design:
// Image fills top portion, icon badge sits at bottom-left of image,
// title + description appear below on white background.

const programIconPaths = {
  education: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  environment: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 22V12M12 12C12 7 7 3 2 3c0 5 3.5 9 10 9zM12 12c0-5 5-9 10-9-1 5-4.5 9-10 9z"/>
    </svg>
  ),
  skills: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/><path d="M19 8a7 7 0 0 1-7 7"/>
    </svg>
  ),
  community: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  digital: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
  ),
  women: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="8" r="4"/><path d="M12 14v8M9 19h6"/>
    </svg>
  ),
  // emoji fallback mapped to SVG
  '📚': null,
  '💻': null,
  '👩‍🤝‍👩': null,
  '🌍': null,
  '🌟': null,
};

// Icon bg colors cycling
const iconBgs = [
  'bg-forest',
  'bg-saffron',
  'bg-forest',
  'bg-saffron',
  'bg-forest',
];

// Map emoji icons to SVG keys
const emojiToKey = {
  '📚': 'education',
  '💻': 'digital',
  '👩‍🤝‍👩': 'women',
  '🌍': 'environment',
  '🌟': 'skills',
};

function ProgramCard({ title, description, icon, image, index = 0 }) {
  const bgClass = iconBgs[index % iconBgs.length];

  // resolve icon
  const iconKey = emojiToKey[icon] || icon;
  const svgIcon = programIconPaths[iconKey] || (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
    </svg>
  );

  // fallback image per card type
  const fallbackImages = {
    education: 'https://images.unsplash.com/photo-1503676260728-1c00da280a25?w=600&q=80',
    digital:   'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80',
    women:     'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=600&q=80',
    environment: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&q=80',
    skills:    'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=600&q=80',
    community: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600&q=80',
  };

  const cardImage = image || fallbackImages[iconKey] || fallbackImages.education;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-stone-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={cardImage}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Gradient scrim at bottom of image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Icon badge — sits at bottom-left overlapping edge */}
        <div className={`absolute bottom-3 left-4 flex h-10 w-10 items-center justify-center rounded-xl ${bgClass} text-white shadow-lg`}>
          {svgIcon}
        </div>
      </div>

      {/* Text content */}
      <div className="p-5">
        <h3 className="font-playfair text-base font-bold text-forest leading-snug">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-500 line-clamp-2">{description}</p>
      </div>
    </div>
  );
}

export default ProgramCard;
