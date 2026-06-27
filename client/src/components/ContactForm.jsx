import { useState } from 'react';
import { createContact } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const initialForm = { name: '', email: '', subject: '', message: '' };

function ContactForm() {
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
    if (!form.subject.trim()) newErrors.subject = 'Subject is required';
    if (!form.message.trim()) newErrors.message = 'Message is required';
    else if (form.message.trim().length < 10) newErrors.message = 'Minimum 10 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(''); setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await createContact(form);
      setSuccess(response.message || 'Message sent! We\'ll get back to you within 2–3 business days.');
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
          <label htmlFor="name" className="form-label">Your Name <span className="text-saffron normal-case font-normal">*</span></label>
          <input id="name" name="name" type="text" value={form.name} onChange={handleChange} className="form-input" placeholder="Full name" />
          {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="form-label">Email Address <span className="text-saffron normal-case font-normal">*</span></label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="form-input" placeholder="you@example.com" />
          {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="form-label">Subject <span className="text-saffron normal-case font-normal">*</span></label>
        <input id="subject" name="subject" type="text" value={form.subject} onChange={handleChange} className="form-input" placeholder="What is this regarding?" />
        {errors.subject && <p className="mt-1.5 text-xs text-red-500">{errors.subject}</p>}
      </div>

      <div>
        <label htmlFor="message" className="form-label">Message <span className="text-saffron normal-case font-normal">*</span></label>
        <textarea id="message" name="message" rows={5} value={form.message} onChange={handleChange} className="form-input resize-none" placeholder="Write your message here..." />
        {errors.message && <p className="mt-1.5 text-xs text-red-500">{errors.message}</p>}
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
        {loading ? <LoadingSpinner size="sm" /> : (
          <>Send Message <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg></>
        )}
      </button>
    </form>
  );
}

export default ContactForm;
