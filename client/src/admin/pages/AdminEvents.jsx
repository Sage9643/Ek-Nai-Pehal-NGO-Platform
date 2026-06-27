import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import TableActions from '../components/TableActions';
import ViewDetailsModal from '../components/ViewDetailsModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import EventFormModal from '../components/EventFormModal';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatDate } from '../utils/formatDate';
import {
  createEvent,
  deleteEvent,
  getAdminEvents,
  updateEvent,
} from '../services/adminApi';

const PAGE_SIZE = 10;

export default function AdminEvents() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formMode, setFormMode] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const debouncedSearch = useDebouncedValue(search);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAdminEvents({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
      });

      setEvents(data.data.events);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteEvent(deleteTarget._id);

      if (events.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await fetchEvents();
      }

      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveEvent = async (payload) => {
    setSaving(true);
    setError('');

    try {
      if (formMode === 'edit' && editingEvent) {
        await updateEvent(editingEvent._id, payload);
      } else {
        await createEvent(payload);
      }

      setFormMode(null);
      setEditingEvent(null);
      await fetchEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save event.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'image',
      label: 'Image',
      className: 'w-24',
      render: (row) => (
        <img
          src={row.image}
          alt={row.title}
          className="h-14 w-20 rounded-lg object-cover ring-1 ring-stone-200"
        />
      ),
    },
    {
      key: 'title',
      label: 'Title',
      render: (row) => <span className="font-medium text-forest">{row.title}</span>,
    },
    { key: 'category', label: 'Category' },
    {
      key: 'date',
      label: 'Event Date',
      render: (row) => formatDate(row.date),
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'whitespace-nowrap',
      render: (row) => (
        <TableActions
          onView={() => setSelectedEvent(row)}
          onEdit={() => {
            setEditingEvent(row);
            setFormMode('edit');
          }}
          onDelete={() => setDeleteTarget(row)}
        />
      ),
    },
  ];

  const rows = events.map((event) => ({
    id: event._id,
    ...event,
  }));

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Management</p>
            <h2 className="mt-2 font-playfair text-2xl font-bold text-forest sm:text-3xl">
              Events
            </h2>
            <p className="mt-2 text-sm text-stone-500 sm:text-base">
              Manage events shown on the public website and chatbot.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingEvent(null);
              setFormMode('add');
            }}
            className="btn-primary px-5 py-2.5"
          >
            Add Event
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <section className="card overflow-hidden p-4 sm:p-6">
          <SearchBar
            value={search}
            onChange={setSearch}
            label="Search events"
            placeholder="Search by title or category"
          />

          <div className="mt-6">
            <DataTable
              columns={columns}
              rows={rows}
              loading={loading}
              emptyMessage="No events found."
            />
          </div>

          <div className="mt-6">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
            />
          </div>
        </section>
      </div>

      <ViewDetailsModal
        isOpen={!!selectedEvent}
        title="Event Details"
        onClose={() => setSelectedEvent(null)}
        fields={
          selectedEvent
            ? [
                { label: 'Title', value: selectedEvent.title },
                { label: 'Category', value: selectedEvent.category },
                { label: 'Event Date', value: formatDate(selectedEvent.date) },
                { label: 'Description', value: selectedEvent.description, multiline: true },
                { label: 'Image', value: selectedEvent.image },
                { label: 'Created Date', value: formatDate(selectedEvent.createdAt) },
              ]
            : []
        }
      />

      <EventFormModal
        isOpen={!!formMode}
        mode={formMode || 'add'}
        initialEvent={editingEvent}
        loading={saving}
        onSubmit={handleSaveEvent}
        onClose={() => {
          setFormMode(null);
          setEditingEvent(null);
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will remove it from the public site and chatbot.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
