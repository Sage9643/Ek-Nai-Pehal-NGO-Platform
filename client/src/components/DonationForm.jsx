import { useState } from 'react';
import { createDonation } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const DONATION_TYPES = ['Books',
  'Stationery',
  'Educational Material',
  'Clothes',
  'Toys',
  'Sports Equipment',
  'Financial Support',
  'Other',];
const initialForm = { name: '', email: '', phone: '', donationType: '', amount: '', message: '' };

function DonationForm() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone.trim())) newErrors.phone = 'Enter a valid 10-digit mobile number';
    if (!form.donationType) newErrors.donationType = 'Please select a donation type';
    if (form.donationType === 'Financial Support') {
      if (!form.amount || !String(form.amount).trim()) newErrors.amount = 'Amount is required';
      else if (Number(form.amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(''); setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        donationType: form.donationType,
        message: form.message,
        ...(form.donationType === 'Financial Support' ? { amount: Number(form.amount) } : {}),
      };
      const response = await createDonation(payload);
      setSuccess(response.message || 'Donation inquiry submitted successfully!');
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {success && (
        <div className="flex items-start gap-3 rounded-xl bg-green-50 p-4 text-sm text-green-700 ring-1 ring-green-200">
          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          {error}
        </div>
      )}

      {/* Type selector as pill buttons */}
      <div>
        <label className="form-label">Donation Type <span className="text-saffron normal-case font-normal">*</span></label>
        <div className="mt-2 flex flex-wrap gap-2">
          {DONATION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => { setForm((prev) => ({ ...prev, donationType: type })); setErrors((prev) => ({ ...prev, donationType: '', amount: '' })); }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                form.donationType === type
                  ? 'bg-saffron text-white shadow-md'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        {errors.donationType && <p className="mt-1.5 text-xs text-red-500">{errors.donationType}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="form-label">Your Name <span className="text-saffron normal-case font-normal">*</span></label>
          <input id="name" name="name" value={form.name} onChange={handleChange} className="form-input" placeholder="Full name" />
          {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="email" className="form-label">Email <span className="text-saffron normal-case font-normal">*</span></label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="form-input" placeholder="you@example.com" />
          {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="form-label">Phone Number <span className="text-saffron normal-case font-normal">*</span></label>
          <input id="phone" name="phone" type="text" value={form.phone} onChange={handleChange} className="form-input" placeholder="10-digit number" />
          {errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone}</p>}
        </div>
        {form.donationType === 'Financial Support' && (
          <div>
            <label htmlFor="amount" className="form-label">Amount (₹) <span className="text-saffron normal-case font-normal">*</span></label>
            <input id="amount" name="amount" type="number" min="1" value={form.amount} onChange={handleChange} className="form-input" placeholder="Enter amount" />
            {errors.amount && <p className="mt-1.5 text-xs text-red-500">{errors.amount}</p>}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="message" className="form-label">Additional Message <span className="text-stone-400 normal-case font-normal text-[10px]">(optional)</span></label>
        <textarea id="message" name="message" rows={4} value={form.message} onChange={handleChange} className="form-input resize-none" placeholder="Tell us about your donation or any special instructions..." />
      </div>

      <button type="submit" disabled={loading} className="btn-saffron w-full disabled:opacity-60">
        {loading ? <LoadingSpinner size="sm" /> : (
          <>Submit Donation Inquiry <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>
        )}
      </button>
    </form>
  );
}

export default DonationForm;
