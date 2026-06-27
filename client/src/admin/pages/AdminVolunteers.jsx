import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import TableActions from '../components/TableActions';
import ViewDetailsModal from '../components/ViewDetailsModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatDate } from '../utils/formatDate';
import { deleteVolunteer, getVolunteers } from '../services/adminApi';

const PAGE_SIZE = 10;

export default function AdminVolunteers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [volunteers, setVolunteers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebouncedValue(search);

  const fetchVolunteers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getVolunteers({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
      });

      setVolunteers(data.data.volunteers);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load volunteers.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteVolunteer(deleteTarget._id);

      if (volunteers.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await fetchVolunteers();
      }

      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete volunteer.');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (row) => <span className="font-medium text-forest">{row.name}</span>,
    },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'occupation',
      label: 'Occupation',
      render: (row) => row.college || '—',
    },
    {
      key: 'availability',
      label: 'Availability',
      render: () => '—',
    },
    {
      key: 'createdAt',
      label: 'Submitted Date',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'whitespace-nowrap',
      render: (row) => (
        <TableActions
          onView={() => setSelectedVolunteer(row)}
          onDelete={() => setDeleteTarget(row)}
        />
      ),
    },
  ];

  const rows = volunteers.map((volunteer) => ({
    id: volunteer._id,
    ...volunteer,
  }));

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="eyebrow">Management</p>
          <h2 className="mt-2 font-playfair text-2xl font-bold text-forest sm:text-3xl">
            Volunteers
          </h2>
          <p className="mt-2 text-sm text-stone-500 sm:text-base">
            Review and manage volunteer applications.
          </p>
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
            label="Search volunteers"
            placeholder="Search by name, email, or phone"
          />

          <div className="mt-6">
            <DataTable
              columns={columns}
              rows={rows}
              loading={loading}
              emptyMessage="No volunteers found."
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
        isOpen={!!selectedVolunteer}
        title="Volunteer Details"
        onClose={() => setSelectedVolunteer(null)}
        fields={
          selectedVolunteer
            ? [
                { label: 'Name', value: selectedVolunteer.name },
                { label: 'Email', value: selectedVolunteer.email },
                { label: 'Phone', value: selectedVolunteer.phone },
                { label: 'College / Organization', value: selectedVolunteer.college },
                { label: 'Motivation', value: selectedVolunteer.motivation, multiline: true },
                { label: 'Submitted Date', value: formatDate(selectedVolunteer.createdAt) },
              ]
            : []
        }
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete Volunteer"
        message={`Are you sure you want to delete the application from "${deleteTarget?.name}"? This action cannot be undone.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
