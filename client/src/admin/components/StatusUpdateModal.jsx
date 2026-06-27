import { useEffect, useState } from 'react';
import { DONATION_STATUSES } from '../constants/adminConstants';

export default function StatusUpdateModal({
  isOpen,
  title,
  currentStatus,
  loading = false,
  onConfirm,
  onClose,
}) {
  const [status, setStatus] = useState(currentStatus || 'Pending');

  useEffect(() => {
    if (isOpen) {
      setStatus(currentStatus || 'Pending');
    }
  }, [isOpen, currentStatus]);

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
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-stone-100"
      >
        <h2 className="font-playfair text-xl font-bold text-forest">{title}</h2>
        <p className="mt-2 text-sm text-stone-500">Choose the updated status for this donation.</p>

        <div className="mt-5">
          <label htmlFor="donation-status" className="form-label">
            Status
          </label>
          <select
            id="donation-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="form-input"
          >
            {DONATION_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(status)}
            disabled={loading}
            className="btn-primary px-5 py-2.5 disabled:opacity-50"
          >
            {loading ? 'Updating…' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}
