export default function ViewDetailsModal({ isOpen, title, fields = [], onClose }) {
  if (!isOpen) return null;

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
        aria-labelledby="view-details-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ring-1 ring-stone-100"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="view-details-title" className="font-playfair text-xl font-bold text-forest">
            {title}
          </h2>
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

        <dl className="space-y-4">
          {fields.map((field) => (
            <div key={field.label}>
              <dt className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                {field.label}
              </dt>
              <dd
                className={`mt-1 text-sm text-forest ${
                  field.multiline ? 'whitespace-pre-wrap leading-relaxed' : 'break-words'
                }`}
              >
                {field.value || '—'}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
