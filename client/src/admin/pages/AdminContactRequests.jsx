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
import { deleteContactRequest, getContactRequests } from '../services/adminApi';

const PAGE_SIZE = 10;

export default function AdminContactRequests() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [contacts, setContacts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebouncedValue(search);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getContactRequests({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
      });

      setContacts(data.data.contacts);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load contact requests.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteContactRequest(deleteTarget._id);

      if (contacts.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await fetchContacts();
      }

      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete contact request.');
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
    {
      key: 'subject',
      label: 'Subject',
      render: (row) => <span className="line-clamp-2 max-w-xs">{row.subject}</span>,
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'whitespace-nowrap',
      render: (row) => (
        <TableActions
          onView={() => setSelectedContact(row)}
          onDelete={() => setDeleteTarget(row)}
        />
      ),
    },
  ];

  const rows = contacts.map((contact) => ({
    id: contact._id,
    ...contact,
  }));

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="eyebrow">Management</p>
          <h2 className="mt-2 font-playfair text-2xl font-bold text-forest sm:text-3xl">
            Contact Requests
          </h2>
          <p className="mt-2 text-sm text-stone-500 sm:text-base">
            Review messages submitted through the contact form.
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
            label="Search contact requests"
            placeholder="Search by name, email, or subject"
          />

          <div className="mt-6">
            <DataTable
              columns={columns}
              rows={rows}
              loading={loading}
              emptyMessage="No contact requests found."
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
        isOpen={!!selectedContact}
        title="Contact Request Details"
        onClose={() => setSelectedContact(null)}
        fields={
          selectedContact
            ? [
                { label: 'Name', value: selectedContact.name },
                { label: 'Email', value: selectedContact.email },
                { label: 'Subject', value: selectedContact.subject },
                { label: 'Message', value: selectedContact.message, multiline: true },
                { label: 'Submitted Date', value: formatDate(selectedContact.createdAt) },
              ]
            : []
        }
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete Contact Request"
        message={`Are you sure you want to delete the request from "${deleteTarget?.name}"? This action cannot be undone.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
