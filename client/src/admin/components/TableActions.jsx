export default function TableActions({ onView, onEdit, onDelete, onUpdateStatus }) {
  return (
    <div className="flex flex-wrap gap-2">
      {onView && (
        <button
          type="button"
          onClick={onView}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-forest ring-1 ring-forest/20 transition hover:bg-forest/5"
        >
          View
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-sky ring-1 ring-sky/20 transition hover:bg-sky/5"
        >
          Edit
        </button>
      )}
      {onUpdateStatus && (
        <button
          type="button"
          onClick={onUpdateStatus}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-saffron ring-1 ring-saffron/20 transition hover:bg-saffron/5"
        >
          Update Status
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 transition hover:bg-red-50"
        >
          Delete
        </button>
      )}
    </div>
  );
}
