import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import TableActions from '../components/TableActions';
import ViewDetailsModal from '../components/ViewDetailsModal';
import StatCard from '../components/StatCard';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatDate } from '../utils/formatDate';
import { TRANSACTION_STATUSES, TRANSACTION_STATUS_STYLES } from '../constants/adminConstants';
import { getTransactions, getTransactionStats, API_BASE_URL } from '../services/adminApi';

const PAGE_SIZE = 10;

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest First' },
  { value: 'createdAt:asc', label: 'Oldest First' },
  { value: 'amount:desc', label: 'Amount: High to Low' },
  { value: 'amount:asc', label: 'Amount: Low to High' },
];

function formatCurrency(amount, currency = 'INR') {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${
        TRANSACTION_STATUS_STYLES[status] || 'bg-stone-100 text-stone-600 ring-stone-200'
      }`}
    >
      {status}
    </span>
  );
}

export default function AdminTransactions() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const debouncedSearch = useDebouncedValue(search);
  const [sortBy, sortOrder] = sort.split(':');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getTransactions({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        status,
        sortBy,
        sortOrder,
      });

      setTransactions(data.data.transactions);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, sortBy, sortOrder]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getTransactionStats();
      setStats(data.data);
    } catch {
      // Stat cards are supplementary — a failure here shouldn't block the
      // table itself, so this is silently non-fatal (the cards just show
      // their loading placeholder indefinitely rather than an error banner).
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, sortBy, sortOrder]);

  const buildDetailFields = (transaction) => [
    { label: 'Donor Name', value: transaction.donorName },
    { label: 'Donor Email', value: transaction.donorEmail },
    { label: 'Amount', value: formatCurrency(transaction.amount, transaction.currency) },
    { label: 'Status', value: transaction.status },
    { label: 'Receipt Number', value: transaction.receiptNumber || '—' },
    { label: 'Razorpay Payment ID', value: transaction.razorpayPaymentId || '—' },
    { label: 'Razorpay Order ID', value: transaction.razorpayOrderId || '—' },
    { label: 'Failure Reason', value: transaction.failureReason || '—' },
    { label: 'Message', value: transaction.message || '—', multiline: true },
    { label: 'Created', value: formatDate(transaction.createdAt) },
    { label: 'Last Updated', value: formatDate(transaction.updatedAt) },
  ];

  const columns = [
    {
      key: 'donorName',
      label: 'Donor',
      render: (row) => (
        <div>
          <span className="font-medium text-forest">{row.donorName}</span>
          <p className="text-xs text-stone-400">{row.donorEmail}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => formatCurrency(row.amount, row.currency),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'receiptNumber',
      label: 'Receipt No.',
      render: (row) => row.receiptNumber || '—',
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
          onView={() => setSelectedTransaction(row)}
          onDownloadReceipt={
            row.status === 'paid'
              ? () => window.open(`${API_BASE_URL}/payments/${row._id}/receipt.pdf`, '_blank', 'noopener,noreferrer')
              : undefined
          }
          onDownloadCertificate={
            row.status === 'paid'
              ? () => window.open(`${API_BASE_URL}/payments/${row._id}/certificate.pdf`, '_blank', 'noopener,noreferrer')
              : undefined
          }
        />
      ),
    },
  ];

  const rows = transactions.map((transaction) => ({
    id: transaction._id,
    ...transaction,
  }));

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="eyebrow">Management</p>
          <h2 className="mt-2 font-playfair text-2xl font-bold text-forest sm:text-3xl">
            Transactions
          </h2>
          <p className="mt-2 text-sm text-stone-500 sm:text-base">
            View, search, and analyze verified online donations processed through Razorpay.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Donations"
            value={stats ? formatCurrency(stats.totalAmount) : undefined}
            accent="forest"
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Successful"
            value={stats?.successfulCount}
            accent="sky"
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Pending"
            value={stats?.pendingCount}
            accent="saffron"
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Failed"
            value={stats?.failedCount}
            accent="stone"
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <section className="card overflow-hidden p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <SearchBar
              value={search}
              onChange={setSearch}
              label="Search transactions"
              placeholder="Search by donor name, email, payment ID, or receipt number"
            />

            <div className="flex flex-wrap gap-4">
              <div>
                <label htmlFor="status-filter" className="form-label">
                  Status
                </label>
                <select
                  id="status-filter"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-input"
                >
                  <option value="">All Statuses</option>
                  {TRANSACTION_STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sort-select" className="form-label">
                  Sort By
                </label>
                <select
                  id="sort-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="form-input"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <DataTable
              columns={columns}
              rows={rows}
              loading={loading}
              emptyMessage="No transactions found."
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
        isOpen={!!selectedTransaction}
        title="Transaction Details"
        onClose={() => setSelectedTransaction(null)}
        fields={selectedTransaction ? buildDetailFields(selectedTransaction) : []}
      />
    </AdminLayout>
  );
}