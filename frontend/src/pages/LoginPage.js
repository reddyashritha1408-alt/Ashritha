import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import toast from '../components/Toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', form);
      if (data.success) {
        login(data.user, data.token);
        toast.success(`Welcome back, ${data.user.name}! 🍕`);
        navigate(data.user.role === 'admin' ? '/admin' : '/menu');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'user') setForm({ email: 'user@pizza.com', password: 'user123' });
    else setForm({ email: 'admin@pizza.com', password: 'admin123' });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🍕</div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your PizzaRush account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
            <div style={{ textAlign: 'right', marginTop: '6px' }}>
              <Link to="/forgot-password" style={{ color: 'var(--brand)', fontSize: '0.8rem', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>
          </div>
          <button id="login-submit" type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <><span className="spinner spinner-sm"></span> Signing in...</> : 'Sign In 🍕'}
          </button>
        </form>

        <div className="auth-divider">
          <div className="auth-divider-line"></div>
          <div className="auth-divider-text">Quick Demo</div>
          <div className="auth-divider-line"></div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => fillDemo('user')}>
            👤 User Demo
          </button>
          <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => fillDemo('admin')}>
            ⚙️ Admin Demo
          </button>
        </div>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
