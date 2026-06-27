import { useEffect, useState } from 'react';
import { EVENT_CATEGORIES, EVENT_IMAGE_OPTIONS } from '../constants/adminConstants';

const emptyForm = {
  title: '',
  description: '',
  category: 'Education',
  date: '',
  image: EVENT_IMAGE_OPTIONS[0],
};

function toDateTimeLocal(value) {
  if (!value) return '';

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);

  return local.toISOString().slice(0, 16);
}

export default function EventFormModal({
  isOpen,
  mode = 'add',
  initialEvent = null,
  loading = false,
  onSubmit,
  onClose,
}) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (initialEvent) {
      setForm({
        title: initialEvent.title || '',
        description: initialEvent.description || '',
        category: initialEvent.category || 'Education',
        date: toDateTimeLocal(initialEvent.date),
        image: initialEvent.image || EVENT_IMAGE_OPTIONS[0],
      });
    } else {
      setForm(emptyForm);
    }

    setError('');
  }, [isOpen, initialEvent]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!form.title.trim() || !form.description.trim() || !form.date || !form.image.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      date: new Date(form.date).toISOString(),
      image: form.image.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-forest/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ring-1 ring-stone-100"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-playfair text-xl font-bold text-forest">
              {mode === 'edit' ? 'Edit Event' : 'Add Event'}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Events appear on the public site and chatbot automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <div>
            <label htmlFor="event-title" className="form-label">
              Title
            </label>
            <input
              id="event-title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div>
            <label htmlFor="event-description" className="form-label">
              Description
            </label>
            <textarea
              id="event-description"
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              className="form-input resize-none"
              required
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="event-category" className="form-label">
                Category
              </label>
              <select
                id="event-category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="form-input"
              >
                {EVENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="event-date" className="form-label">
                Event Date
              </label>
              <input
                id="event-date"
                name="date"
                type="datetime-local"
                value={form.date}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="event-image" className="form-label">
              Image Path
            </label>
            <select
              id="event-image-select"
              name="image"
              value={EVENT_IMAGE_OPTIONS.includes(form.image) ? form.image : 'custom'}
              onChange={(event) => {
                if (event.target.value === 'custom') return;
                setForm((current) => ({ ...current, image: event.target.value }));
              }}
              className="form-input mb-3"
            >
              {EVENT_IMAGE_OPTIONS.map((imagePath) => (
                <option key={imagePath} value={imagePath}>
                  {imagePath}
                </option>
              ))}
              <option value="custom">Custom path or URL</option>
            </select>
            <input
              id="event-image"
              name="image"
              type="text"
              value={form.image}
              onChange={handleChange}
              className="form-input"
              placeholder="/image/example.png or https://..."
              required
            />
            {form.image && (
              <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-stone-200">
                <img src={form.image} alt="Preview" className="h-40 w-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-full border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary px-5 py-2.5 disabled:opacity-50">
              {loading ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
