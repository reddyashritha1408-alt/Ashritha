import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import API from '../api';
import toast from '../components/Toast';

const STAGES = ['Order Received', 'In Kitchen', 'Sent for Delivery', 'Delivered'];
const STAGE_ICONS = ['📋', '👨‍🍳', '🛵', '✅'];

const STATUS_ALIAS = {
  'order received': 0,
  'order confirmed': 0,
  'in kitchen': 1,
  'in the kitchen': 1,
  'baking': 1,
  'packaging': 2,
  'out for delivery': 2,
  'sent for delivery': 2,
  'delivered': 3,
};

function getStageIndex(status) {
  if (!status) return 0;
  return STATUS_ALIAS[status.toLowerCase().trim()] ?? 0;
}

const STATUS_COLORS = {
  0: 'info',
  1: 'warning',
  2: 'brand',
  3: 'success',
};

function MiniTimeline({ orderStatus }) {
  const current = getStageIndex(orderStatus);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 16 }}>
      {STAGES.map((stage, idx) => {
        const isCompleted = idx < current;
        const isActive = idx === current;
        const isFuture = idx > current;
        const isLast = idx === STAGES.length - 1;

        return (
          <React.Fragment key={stage}>
            {/* Step dot */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isCompleted ? '0.75rem' : '1rem',
                  fontWeight: 700,
                  background: isCompleted
                    ? 'var(--brand)'
                    : isActive
                    ? 'var(--brand)'
                    : 'var(--bg-secondary)',
                  border: `2px solid ${isCompleted || isActive ? 'var(--brand)' : 'var(--border)'}`,
                  color: isCompleted || isActive ? 'white' : 'var(--text-muted)',
                  opacity: isFuture ? 0.4 : 1,
                  boxShadow: isActive ? '0 0 0 4px rgba(255,77,0,0.2)' : 'none',
                  animation: isActive ? 'pulseTimeline 2s ease-in-out infinite' : 'none',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                }}
              >
                {isCompleted ? '✓' : STAGE_ICONS[idx]}
              </div>
              <div
                style={{
                  fontSize: '0.6rem',
                  color: isActive ? 'var(--brand)' : isCompleted ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: isActive ? 700 : 400,
                  opacity: isFuture ? 0.4 : 1,
                  textAlign: 'center',
                  maxWidth: 60,
                  lineHeight: 1.2,
                }}
              >
                {stage}
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                style={{
                  flex: 1,
                  height: 3,
                  background: isCompleted ? 'var(--brand)' : 'var(--border)',
                  borderRadius: 2,
                  marginBottom: 22,
                  opacity: isFuture ? 0.3 : 1,
                  transition: 'background 0.4s ease',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/orders/my-orders')
      .then(({ data }) => setOrders(data.data || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));

    // Listen for live status updates across all orders
    const socket = io('http://localhost:5001');
    socket.on('orderListUpdated', (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? { ...o, orderStatus: updatedOrder.orderStatus } : o))
      );
    });

    return () => socket.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner"></div>
        <div className="page-loader-text">Loading your orders...</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'left', marginBottom: 32 }}>
            <div className="section-eyebrow">Account</div>
            <h1 className="section-title" style={{ marginBottom: 0 }}>My Orders 📦</h1>
          </div>

          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🍕</div>
              <div className="empty-state-title">No orders yet!</div>
              <div style={{ marginBottom: 24 }}>Time to treat yourself to something delicious.</div>
              <Link to="/menu" className="btn btn-primary">Browse Menu</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {orders.map((order) => {
                const stageIdx = getStageIndex(order.orderStatus);
                const statusLabel = STAGES[stageIdx];
                const badgeColor = STATUS_COLORS[stageIdx];

                return (
                  <div className="card" key={order._id}>
                    <div className="card-body">
                      {/* Header row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                          <div style={{ fontSize: '2.5rem' }}>🍕</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 3 }}>{order.pizzaName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Order ID: <code style={{ color: 'var(--brand)', fontSize: '0.75rem' }}>{order._id.slice(-8).toUpperCase()}</code>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Status</div>
                            <span className={`badge badge-${badgeColor}`}>
                              {STAGE_ICONS[stageIdx]} {statusLabel}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Total</div>
                            <div style={{ fontWeight: 800, color: 'var(--brand)', fontSize: '1.1rem' }}>₹{order.totalPrice}</div>
                          </div>
                          <Link
                            to={`/order-status/${order._id}`}
                            className="btn btn-secondary btn-sm"
                            id={`track-${order._id}`}
                          >
                            📡 Track Order
                          </Link>
                        </div>
                      </div>

                      {/* Inline mini timeline */}
                      <MiniTimeline orderStatus={order.orderStatus} />

                      {/* Ingredients strip */}
                      {order.type === 'custom' && order.details && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {[
                            order.details.base && `🫓 ${order.details.base}`,
                            order.details.sauce && `🥫 ${order.details.sauce}`,
                            order.details.cheese && `🧀 ${order.details.cheese}`,
                            ...(order.details.veggies?.map((v) => `🥬 ${v}`) || []),
                            ...(order.details.meats?.map((m) => `🥩 ${m}`) || []),
                          ].filter(Boolean).map((tag) => (
                            <span className="pizza-tag" key={tag}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/menu" className="btn btn-primary">🍕 Order Again</Link>
            <Link to="/build" className="btn btn-secondary">🛠️ Build Custom Pizza</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
