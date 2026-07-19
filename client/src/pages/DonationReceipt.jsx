import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTransaction, API_BASE_URL } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const formatAmount = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);

const formatDateTime = (date) =>
  new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

function DonationReceipt() {
  const { transactionId } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError('');

    // The transactionId comes from the URL, not from any state passed
    // during navigation or a query parameter we trust at face value — the
    // donation details shown below are always re-fetched fresh from the
    // backend, which is the only source of truth for whether a payment
    // actually succeeded (see paymentController.verifyPayment). This page
    // never renders anything based on frontend-only assumptions about the
    // outcome of a payment.
    getTransaction(transactionId)
      .then((res) => {
        if (!isMounted) return;
        setTransaction(res.data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(
          err.response?.status === 404
            ? 'We could not find a donation with this reference. The link may be incorrect or expired.'
            : err.response?.data?.message || 'Something went wrong while loading your donation details.'
        );
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [transactionId]);

  if (loading) {
    return (
      <section className="bg-ivory py-32">
        <div className="page-container flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-ivory py-20">
        <div className="page-container">
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-200">
              <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="font-playfair text-3xl font-bold text-forest">Donation Not Found</h1>
            <p className="mt-3 text-stone-500">{error}</p>
            <Link to="/donate" className="btn-saffron mt-8 inline-flex">
              Return to Donate Page
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const isPaid = transaction.status === 'paid';
  const isFailed = transaction.status === 'failed';

  return (
    <section className="bg-ivory py-20">
      <div className="page-container">
        <div className="mx-auto max-w-2xl">
          <div className="mb-10 text-center">
            {isPaid && (
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 ring-1 ring-green-200">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            )}
            <h1 className="font-playfair text-4xl font-bold text-forest">
              {isPaid ? 'Thank You for Your Donation!' : isFailed ? 'Donation Not Completed' : 'Donation Pending'}
            </h1>
            <p className="mt-3 text-stone-500">
              {isPaid
                ? 'Your contribution has been received and verified. A summary is below.'
                : isFailed
                ? 'This payment attempt was not successful. No amount was charged for this transaction.'
                : 'This payment is still being processed. Please check back shortly, or contact us if this persists.'}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-stone-100 md:p-10">
            <dl className="divide-y divide-stone-100">
              <ReceiptRow label="Donor Name" value={transaction.donorName} />
              <ReceiptRow label="Amount" value={formatAmount(transaction.amount, transaction.currency)} />
              <ReceiptRow label="Payment Status" value={<StatusBadge status={transaction.status} />} />
              {transaction.receiptNumber && <ReceiptRow label="Receipt Number" value={transaction.receiptNumber} />}
              {transaction.razorpayPaymentId && (
                <ReceiptRow label="Transaction ID" value={transaction.razorpayPaymentId} mono />
              )}
              <ReceiptRow label="Date &amp; Time" value={formatDateTime(transaction.updatedAt || transaction.createdAt)} />
            </dl>

            {isPaid && (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={`${API_BASE_URL}/payments/${transactionId}/receipt.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-saffron flex-1 justify-center"
                >
                  Download Receipt (PDF)
                </a>
                <a
                  href={`${API_BASE_URL}/payments/${transactionId}/certificate.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline-forest flex-1 justify-center"
                >
                  Download Certificate (PDF)
                </a>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <Link to="/donate" className="text-sm font-semibold text-forest hover:text-saffron">
              {isPaid ? 'Make another donation' : 'Return to Donate page'} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReceiptRow({ label, value, mono }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-stone-500">{label}</dt>
      <dd className={`text-sm font-semibold text-forest ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    paid: 'bg-green-50 text-green-700 ring-green-200',
    failed: 'bg-red-50 text-red-700 ring-red-200',
    created: 'bg-amber-50 text-amber-700 ring-amber-200',
    processing: 'bg-amber-50 text-amber-700 ring-amber-200',
    refunded: 'bg-stone-100 text-stone-600 ring-stone-200',
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${styles[status] || styles.created}`}>
      {status}
    </span>
  );
}

export default DonationReceipt;