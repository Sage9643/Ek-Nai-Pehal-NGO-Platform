import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import TableActions from '../components/TableActions';
import ViewDetailsModal from '../components/ViewDetailsModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import StatusUpdateModal from '../components/StatusUpdateModal';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatDate } from '../utils/formatDate';
import { STATUS_STYLES } from '../constants/adminConstants';
import {
  deleteDonation,
  getDonations,
  updateDonationStatus,
} from '../services/adminApi';

const PAGE_SIZE = 10;

function formatAmount(donation) {
  if (donation.donationType !== 'Financial Support' || donation.amount == null) {
    return '—';
  }

  return `₹${Number(donation.amount).toLocaleString('en-IN')}`;
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        STATUS_STYLES[status] || 'bg-stone-100 text-stone-600 ring-stone-200'
      }`}
    >
      {status}
    </span>
  );
}

export default function AdminDonations() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [donations, setDonations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebouncedValue(search);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getDonations({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
      });

      setDonations(data.data.donations);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load donations.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleStatusUpdate = async (status) => {
    if (!statusTarget) return;

    setUpdatingStatus(true);

    try {
      await updateDonationStatus(statusTarget._id, status);
      setStatusTarget(null);
      await fetchDonations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update donation status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteDonation(deleteTarget._id);

      if (donations.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await fetchDonations();
      }

      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete donation.');
    } finally {
      setDeleting(false);
    }
  };

  const buildDetailFields = (donation) => {
    const fields = [
      { label: 'Donor Name', value: donation.name },
      { label: 'Email', value: donation.email },
      { label: 'Phone', value: donation.phone || '—' },
      { label: 'Donation Type', value: donation.donationType },
    ];

    if (donation.donationType === 'Financial Support') {
      fields.push({
        label: 'Amount',
        value: donation.amount != null ? `₹${Number(donation.amount).toLocaleString('en-IN')}` : '—',
      });
    }

    fields.push(
      { label: 'Status', value: donation.status },
      { label: 'Message', value: donation.message || '—', multiline: true },
      { label: 'Submitted Date', value: formatDate(donation.createdAt) }
    );

    return fields;
  };

  const columns = [
    {
      key: 'name',
      label: 'Donor Name',
      render: (row) => <span className="font-medium text-forest">{row.name}</span>,
    },
    { key: 'donationType', label: 'Donation Type' },
    {
      key: 'phone',
      label: 'Phone',
      render: (row) => row.phone || '—',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => formatAmount(row),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
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
          onView={() => setSelectedDonation(row)}
          onUpdateStatus={() => setStatusTarget(row)}
          onDelete={() => setDeleteTarget(row)}
        />
      ),
    },
  ];

  const rows = donations.map((donation) => ({
    id: donation._id,
    ...donation,
  }));

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="eyebrow">Management</p>
          <h2 className="mt-2 font-playfair text-2xl font-bold text-forest sm:text-3xl">
            Donations
          </h2>
          <p className="mt-2 text-sm text-stone-500 sm:text-base">
            Review donation inquiries and update their status.
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
            label="Search donations"
            placeholder="Search by name, email, phone, or donation type"
          />

          <div className="mt-6">
            <DataTable
              columns={columns}
              rows={rows}
              loading={loading}
              emptyMessage="No donations found."
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
        isOpen={!!selectedDonation}
        title="Donation Details"
        onClose={() => setSelectedDonation(null)}
        fields={selectedDonation ? buildDetailFields(selectedDonation) : []}
      />

      <StatusUpdateModal
        isOpen={!!statusTarget}
        title="Update Donation Status"
        currentStatus={statusTarget?.status}
        loading={updatingStatus}
        onConfirm={handleStatusUpdate}
        onClose={() => setStatusTarget(null)}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete Donation"
        message={`Are you sure you want to delete the donation from "${deleteTarget?.name}"? This action cannot be undone.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
