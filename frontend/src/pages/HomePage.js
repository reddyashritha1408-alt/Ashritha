import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="page-wrapper">
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-eyebrow">
              🔥 Fresh, Hot & Delivered Fast
            </div>
            <h1 className="hero-title">
              Build Your Perfect<br />
              <span className="highlight">Pizza Experience</span>
            </h1>
            <p className="hero-desc">
              Choose from our chef-crafted menu or build your own masterpiece with fresh ingredients. Real-time tracking, seamless payment — delivered to your door.
            </p>
            <div className="hero-actions">
              {user ? (
                <>
                  <Link to="/menu" className="btn btn-primary btn-lg">
                    🍕 Browse Menu
                  </Link>
                  <Link to="/build" className="btn btn-secondary btn-lg">
                    🛠️ Build Your Own
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Get Started — It's Free
                  </Link>
                  <Link to="/menu" className="btn btn-secondary btn-lg">
                    View Menu
                  </Link>
                </>
              )}
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-num">5+</div>
                <div className="hero-stat-label">Signature Pizzas</div>
              </div>
              <div>
                <div className="hero-stat-num">20+</div>
                <div className="hero-stat-label">Fresh Ingredients</div>
              </div>
              <div>
                <div className="hero-stat-num">30min</div>
                <div className="hero-stat-label">Avg Delivery</div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-pizza-visual">🍕</div>
      </section>

      {/* Features */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Why PizzaRush?</div>
            <h2 className="section-title">The Pizza Experience Reimagined</h2>
            <p className="section-desc">Everything you love about great pizza, with the tech to match.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {[
              { icon: '🛠️', title: 'Build Your Own', desc: 'Choose every ingredient — base, sauce, cheese, veggies, and meats. Your pizza, your rules.' },
              { icon: '📡', title: 'Live Order Tracking', desc: 'Watch your order move from kitchen to your door in real time with Socket.io updates.' },
              { icon: '🔒', title: 'Secure Payments', desc: 'Razorpay test mode integration. Pay safely with UPI, cards, or netbanking.' },
              { icon: '📦', title: 'Smart Inventory', desc: 'Admin dashboard with live stock levels, low-stock alerts, and email notifications.' },
            ].map((f) => (
              <div className="card" key={f.title}>
                <div className="card-body">
                  <div style={{ fontSize: '2.2rem', marginBottom: '16px' }}>{f.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>{f.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="section">
          <div className="container" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🍕</div>
            <h2 className="section-title">Ready to Order?</h2>
            <p className="section-desc" style={{ marginBottom: '32px' }}>
              Join PizzaRush today and enjoy your first custom pizza experience.
            </p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Free Account
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', padding: '32px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <div style={{ marginBottom: '8px' }}>🍕 <strong style={{ color: 'var(--text-primary)' }}>PizzaRush</strong> — Built with ❤️</div>
        <div>Test accounts: <code style={{ color: 'var(--brand)' }}>user@pizza.com / user123</code> &nbsp;|&nbsp; Admin: <code style={{ color: 'var(--brand)' }}>admin@pizza.com / admin123</code></div>
      </footer>
    </div>
  );
}
