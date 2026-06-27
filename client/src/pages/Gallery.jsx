import { useEffect, useState } from 'react';
import { getGallery } from '../services/api';

function Gallery() {
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const data = await getGallery();
        setGalleryImages(data.data);
      } catch (err) {
        setError('Failed to load gallery images.');
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, []);

  return (
    <>
      <section className="relative overflow-hidden bg-forest py-20 md:py-28">
        <div className="pointer-events-none absolute -left-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-white/5" />
        <div className="page-container relative">
          <span className="eyebrow">Our Moments</span>
          <h1 className="mt-4 font-playfair text-4xl font-bold text-white md:text-5xl">Gallery</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/70">
            Moments from our events, programs, and community initiatives captured over the years.
          </p>
        </div>
      </section>

      <section className="bg-ivory py-20">
        <div className="page-container">
          {loading && (
            <p className="text-center text-stone-400">Loading gallery…</p>
          )}

          {error && (
            <p className="text-center text-red-500">{error}</p>
          )}

          {!loading && !error && galleryImages.length === 0 && (
            <p className="text-center text-stone-400">No gallery images yet.</p>
          )}

          {!loading && !error && galleryImages.length > 0 && (
            <div className="masonry-grid">
              {galleryImages.map((image, i) => (
                <div
                  key={image._id}
                  className="masonry-item group cursor-zoom-in overflow-hidden rounded-2xl shadow-md ring-1 ring-stone-100"
                  onClick={() => setLightbox(image)}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={image.image}
                      alt={image.title}
                      className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      style={{ aspectRatio: i % 3 === 0 ? '4/3' : i % 3 === 1 ? '1/1' : '3/4' }}
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-forest/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="p-4">
                        <p className="text-sm font-medium text-white">{image.title}</p>
                        {image.featured && (
                          <span className="mt-1 inline-block rounded-full bg-saffron px-2.5 py-0.5 text-xs font-semibold text-white">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Zoom icon */}
                    <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="lightbox-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.image} alt={lightbox.title} className="max-h-[85vh] w-auto object-contain" />
            <div className="bg-forest/90 px-6 py-3">
              <p className="text-sm font-medium text-white">{lightbox.title}</p>
              {lightbox.description && (
                <p className="mt-0.5 text-xs text-white/70">{lightbox.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Gallery;
