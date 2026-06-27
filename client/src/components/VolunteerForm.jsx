import { useState } from 'react';
import { createVolunteer } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const initialForm = { name: '', email: '', phone: '', college: '', motivation: '' };

function VolunteerForm() {
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
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email address';
    if (!form.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone)) newErrors.phone = 'Enter a valid 10-digit mobile number';
    if (!form.college.trim()) newErrors.college = 'College / organization is required';
    if (!form.motivation.trim()) newErrors.motivation = 'Please share your motivation';
    else if (form.motivation.trim().length < 10) newErrors.motivation = 'Minimum 10 characters required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await createVolunteer(form);
      setSuccess(response.message || 'Application submitted! We\'ll be in touch soon.');
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="form-label">Full Name <span className="text-saffron normal-case font-normal">*</span></label>
          <input id="name" name="name" type="text" value={form.name} onChange={handleChange} className="form-input" placeholder="Your full name" />
          {errors.name && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="form-label">Email Address <span className="text-saffron normal-case font-normal">*</span></label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="form-input" placeholder="you@example.com" />
          {errors.email && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="form-label">Mobile Number <span className="text-saffron normal-case font-normal">*</span></label>
          <input id="phone" name="phone" type="text" value={form.phone} onChange={handleChange} className="form-input" placeholder="10-digit number" />
          {errors.phone && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="college" className="form-label">College / Organization <span className="text-saffron normal-case font-normal">*</span></label>
          <input id="college" name="college" type="text" value={form.college} onChange={handleChange} className="form-input" placeholder="Where do you study/work?" />
          {errors.college && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {errors.college}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="motivation" className="form-label">Why do you want to volunteer? <span className="text-saffron normal-case font-normal">*</span></label>
        <textarea id="motivation" name="motivation" rows={4} value={form.motivation} onChange={handleChange} className="form-input resize-none" placeholder="Tell us what drives you to make a difference..." />
        {errors.motivation && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {errors.motivation}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full disabled:opacity-60"
      >
        {loading ? <LoadingSpinner size="sm" /> : (
          <>
            Submit Application
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </>
        )}
      </button>
    </form>
  );
}

export default VolunteerForm;
