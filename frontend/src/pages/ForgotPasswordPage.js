import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg(''); setError('');
    try {
      const { data } = await API.post('/auth/forgot-password', { email });
      if (data.success) setMsg(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🔑</div>
        <h1 className="auth-title">Forgot Password?</h1>
        <p className="auth-subtitle">Enter your email and we'll send you a reset link</p>

        {error && <div className="alert alert-error">{error}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}

        {!msg && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                id="forgot-email"
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required autoFocus
              />
            </div>
            <button id="forgot-submit" type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <><span className="spinner spinner-sm"></span> Sending...</> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="auth-footer"><Link to="/login">← Back to Login</Link></p>
      </div>
    </div>
  );
}
