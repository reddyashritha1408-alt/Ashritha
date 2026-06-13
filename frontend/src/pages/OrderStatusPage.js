import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import API from '../api';
import toast from '../components/Toast';
import OrderTimeline from '../components/OrderTimeline';


export default function OrderStatusPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.data))
      .catch(() => toast.error('Could not load order'))
      .finally(() => setLoading(false));

    const socket = io('http://localhost:5001');
    socket.emit('joinOrderRoom', id);
    socket.on('orderStatusUpdated', (newStatus) => {
      setOrder((prev) => prev ? { ...prev, orderStatus: newStatus } : prev);
      toast.success(`Order update: ${newStatus} 🍕`);
    });

    return () => {
      socket.emit('leaveOrderRoom', id);
      socket.disconnect();
    };
  }, [id]);

  if (loading) return <div className="page-loader"><div className="spinner"></div><div className="page-loader-text">Loading order status...</div></div>;
  if (!order) return (
    <div className="page-loader">
      <div className="empty-state-icon">❌</div>
      <div className="empty-state-title">Order not found</div>
      <Link to="/my-orders" className="btn btn-secondary" style={{ marginTop: 16 }}>My Orders</Link>
    </div>
  );



  return (
    <div className="page-wrapper">
      <section className="section">
        <div className="container" style={{ maxWidth: 700 }}>
          <div style={{ marginBottom: 32 }}>
            <div className="section-eyebrow">Live Tracking</div>
            <h1 className="section-title" style={{ marginBottom: 4 }}>Order Status</h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Order ID:</span>
              <code style={{ fontSize: '0.8rem', color: 'var(--brand)', wordBreak: 'break-all' }}>{order._id}</code>
            </div>
          </div>

          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: 'var(--success)',
              animation: 'pulseDot 1.5s ease-in-out infinite'
            }}></div>
            <span style={{ fontSize: '0.82rem', color: 'var(--success)', fontWeight: 600 }}>Live Updates Active</span>
          </div>

          {/* Status Timeline */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
              <OrderTimeline currentStatus={order.orderStatus} />
            </div>
          </div>

          {/* Order Details */}
          <div className="card">
            <div className="card-body">
              <div style={{ fontWeight: 700, marginBottom: 16 }}>Order Details</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: '2.5rem' }}>🍕</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{order.pizzaName}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {order.type === 'custom' ? 'Custom Build' : 'Standard Pizza'}
                  </div>
                </div>
              </div>
              <div className="summary-divider"></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Paid</span>
                <span style={{ fontWeight: 800, color: 'var(--brand)' }}>₹{order.totalPrice}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Payment Status</span>
                <span className={`badge badge-${order.paymentStatus === 'success' ? 'success' : 'warning'}`}>
                  {order.paymentStatus}
                </span>
              </div>
              {order.address && (
                <div style={{ marginTop: 16, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>📍 Delivering to:</strong><br />
                  {order.address.fullName}, {order.address.houseNo}, {order.address.streetAddress},<br />
                  {order.address.city} - {order.address.pincode}, {order.address.state}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <Link to="/my-orders" className="btn btn-secondary" style={{ flex: 1 }}>📦 All My Orders</Link>
            <Link to="/menu" className="btn btn-primary" style={{ flex: 1 }}>🍕 Order Again</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
