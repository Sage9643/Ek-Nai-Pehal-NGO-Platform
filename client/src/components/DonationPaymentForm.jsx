import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPaymentOrder, verifyPayment } from '../services/api';
import loadRazorpayScript from '../utils/loadRazorpayScript';
import LoadingSpinner from './LoadingSpinner';

const initialForm = { donorName: '', donorEmail: '', donorPhone: '', amount: '', message: '' };

// Razorpay Checkout expects amounts in the smallest currency unit (paise
// for INR) — the backend's create-order response returns the donation
// amount in plain rupees (consistent with how it's stored and displayed
// everywhere else), so this is the one place the frontend converts it,
// mirroring the equivalent single-conversion-point in razorpayService.js
// on the backend.
const RUPEES_TO_PAISE = 100;

function DonationPaymentForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.donorName.trim()) newErrors.donorName = 'Name is required';
    if (!form.donorEmail.trim()) newErrors.donorEmail = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.donorEmail)) newErrors.donorEmail = 'Invalid email';
    if (form.donorPhone.trim() && !/^[6-9]\d{9}$/.test(form.donorPhone.trim())) {
      newErrors.donorPhone = 'Enter a valid 10-digit mobile number';
    }
    if (!form.amount || !String(form.amount).trim()) newErrors.amount = 'Amount is required';
    else if (Number(form.amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const isScriptReady = await loadRazorpayScript();
      if (!isScriptReady) {
        setError('Payment gateway is currently unavailable. Please try again in a moment.');
        setLoading(false);
        return;
      }

      const orderPayload = {
        donorName: form.donorName,
        donorEmail: form.donorEmail,
        donorPhone: form.donorPhone,
        amount: Number(form.amount),
        message: form.message,
      };
      const orderResponse = await createPaymentOrder(orderPayload);
      const { orderId, transactionId, amount, currency, keyId } = orderResponse.data;

      const razorpay = new window.Razorpay({
        key: keyId,
        amount: Math.round(amount * RUPEES_TO_PAISE),
        currency,
        order_id: orderId,
        name: 'Ek Nai Pehal',
        description: 'Donation towards Ek Nai Pehal',
        prefill: {
          name: form.donorName,
          email: form.donorEmail,
          contact: form.donorPhone || undefined,
        },
        theme: { color: '#0F4C2A' },
        // Razorpay's own report of success is never trusted as final —
        // this handler only forwards what Razorpay returned to our
        // backend, which independently recomputes the signature before
        // treating the donation as real (see paymentController.verifyPayment).
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            // Explicitly reset here rather than relying on this component
            // unmounting once navigate() resolves — navigation is not
            // guaranteed to be synchronous or immediate, and leaving
            // `loading` to be cleaned up "by unmounting" would permanently
            // disable the Donate button if that assumption ever breaks
            // (a slower transition, an extra awaited step added later, etc).
            setLoading(false);
            navigate(`/donate/receipt/${transactionId}`);
          } catch (verifyErr) {
            setError(
              verifyErr.response?.data?.message ||
                'We could not verify your payment. If money was deducted, please contact us with your donation details.'
            );
            setLoading(false);
          }
        },
        modal: {
          // User closed the Checkout modal without completing payment —
          // not an error, just let them try again.
          ondismiss: () => setLoading(false),
        },
      });

      // Surface Razorpay-reported failures (e.g. card declined) the same
      // way a verification failure is surfaced, rather than leaving the
      // donor on a silently stuck form.
      razorpay.on('payment.failed', (response) => {
        setError(
          response.error?.description || 'Payment failed. Please try again or use a different payment method.'
        );
        setLoading(false);
      });

      razorpay.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="donorName" className="form-label">Your Name <span className="text-saffron normal-case font-normal">*</span></label>
          <input id="donorName" name="donorName" value={form.donorName} onChange={handleChange} className="form-input" placeholder="Full name" />
          {errors.donorName && <p className="mt-1.5 text-xs text-red-500">{errors.donorName}</p>}
        </div>
        <div>
          <label htmlFor="donorEmail" className="form-label">Email <span className="text-saffron normal-case font-normal">*</span></label>
          <input id="donorEmail" name="donorEmail" type="email" value={form.donorEmail} onChange={handleChange} className="form-input" placeholder="you@example.com" />
          {errors.donorEmail && <p className="mt-1.5 text-xs text-red-500">{errors.donorEmail}</p>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="donorPhone" className="form-label">Phone Number <span className="text-stone-400 normal-case font-normal text-[10px]">(optional)</span></label>
          <input id="donorPhone" name="donorPhone" type="text" value={form.donorPhone} onChange={handleChange} className="form-input" placeholder="10-digit number" />
          {errors.donorPhone && <p className="mt-1.5 text-xs text-red-500">{errors.donorPhone}</p>}
        </div>
        <div>
          <label htmlFor="amount" className="form-label">Amount (₹) <span className="text-saffron normal-case font-normal">*</span></label>
          <input id="amount" name="amount" type="number" min="1" value={form.amount} onChange={handleChange} className="form-input" placeholder="Enter amount" />
          {errors.amount && <p className="mt-1.5 text-xs text-red-500">{errors.amount}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="message" className="form-label">Additional Message <span className="text-stone-400 normal-case font-normal text-[10px]">(optional)</span></label>
        <textarea id="message" name="message" rows={3} value={form.message} onChange={handleChange} className="form-input resize-none" placeholder="Add a note with your donation..." />
      </div>

      <button type="submit" disabled={loading} className="btn-saffron w-full disabled:opacity-60">
        {loading ? <LoadingSpinner size="sm" /> : (
          <>Donate Now <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>
        )}
      </button>
    </form>
  );
}

export default DonationPaymentForm;