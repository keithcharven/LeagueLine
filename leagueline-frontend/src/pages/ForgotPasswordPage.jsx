import { useState } from 'react';
import { Link } from 'react-router-dom';
import { profileService } from '../services/profileService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSubmitting(true);

    try {
      const data = await profileService.forgotPassword(email.trim());
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to process password reset request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
          <p className="text-sm text-slate-400 mt-1">
            Enter your registered email to receive a single-use password reset link (valid for 15 minutes).
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm space-y-3">
            <p>{result.message}</p>
            {result.resetUrl && (
              <div className="pt-2 border-t border-emerald-500/20">
                <p className="text-xs text-slate-300 mb-2">
                  Local recovery link (also logged in backend console):
                </p>
                <a
                  href={result.resetUrl}
                  className="inline-block px-3 py-1.5 rounded-md bg-cyan-500 text-slate-950 font-semibold text-xs hover:bg-cyan-400"
                >
                  Open Reset Password Page
                </a>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold text-sm transition"
          >
            {submitting ? 'Generating Reset Link...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Remembered your password?{' '}
          <Link to="/login" className="text-cyan-400 hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}