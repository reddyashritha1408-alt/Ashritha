import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import API from '../api';
import toast from '../components/Toast';

const ORDER_STATUSES = ['Order Received', 'In Kitchen', 'Sent for Delivery', 'Delivered'];
const STATUS_ICONS = { 'Order Received': '📋', 'In Kitchen': '👨‍🍳', 'Sent for Delivery': '🛵', 'Delivered': '✅' };
const STATUS_COLORS = { 'Order Received': 'info', 'In Kitchen': 'warning', 'Sent for Delivery': 'brand', 'Delivered': 'success' };

// Normalize any legacy status strings to canonical values
const STATUS_ALIAS = {
  'order received': 'Order Received',
  'order confirmed': 'Order Received',
  'in kitchen': 'In Kitchen',
  'in the kitchen': 'In Kitchen',
  'baking': 'In Kitchen',
  'packaging': 'Sent for Delivery',
  'out for delivery': 'Sent for Delivery',
  'sent for delivery': 'Sent for Delivery',
  'delivered': 'Delivered',
};
const normalizeStatus = (s) => STATUS_ALIAS[(s || '').toLowerCase().trim()] || 'Order Received';

const CATEGORY_ICONS = { base: '🫓', sauce: '🥫', cheese: '🧀', veggie: '🥬', meat: '🥩' };

// ─── Orders Sub-view ─────────────────────────────────────────────────────────
function AdminOrders({ socket }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchOrders = useCallback(() => {
    API.get('/orders/all-orders')
      .then(({ data }) => setOrders(data.data || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOrders();
    if (socket) {
      socket.on('newOrderReceived', (order) => {
        toast.success(`New order received! 🍕`);
        setOrders((prev) => [order, ...prev]);
      });
      socket.on('orderListUpdated', (updatedOrder) => {
        setOrders((prev) => prev.map((o) => o._id === updatedOrder._id ? updatedOrder : o));
      });
    }
    return () => {
      if (socket) { socket.off('newOrderReceived'); socket.off('orderListUpdated'); }
    };
  }, [fetchOrders, socket]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await API.put(`/orders/${orderId}/status`, { orderStatus: newStatus });
      toast.success(`Status updated: ${newStatus}`);
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
    } catch {
      toast.error('Failed to update status');
    } finally { setUpdating(null); }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Orders', value: orders.length, icon: '📦' },
          { label: 'Active', value: orders.filter((o) => o.orderStatus !== 'Delivered').length, icon: '🔄' },
          { label: 'Delivered', value: orders.filter((o) => o.orderStatus === 'Delivered').length, icon: '✅' },
          { label: 'Revenue', value: `₹${orders.reduce((acc, o) => acc + o.totalPrice, 0)}`, icon: '💰' },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Pizza</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No orders yet</td></tr>
            )}
            {orders.map((order) => (
              <tr key={order._id}>
                <td>
                  <code style={{ fontSize: '0.78rem', color: 'var(--brand)' }}>{order._id.slice(-8).toUpperCase()}</code>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{order.user?.name || 'Unknown'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.user?.email}</div>
                </td>
                <td>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{order.pizzaName}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{order.type}</div>
                </td>
                <td style={{ fontWeight: 700, color: 'var(--brand)' }}>₹{order.totalPrice}</td>
                <td><span className={`badge badge-${STATUS_COLORS[normalizeStatus(order.orderStatus)] || 'info'}`}>{STATUS_ICONS[normalizeStatus(order.orderStatus)]} {normalizeStatus(order.orderStatus)}</span></td>
                <td>
                  <select
                    className="form-select"
                    style={{ padding: '6px 10px', fontSize: '0.82rem', width: 'auto', minWidth: 160 }}
                    value={normalizeStatus(order.orderStatus)}
                    disabled={updating === order._id}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    id={`status-select-${order._id}`}
                  >
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_ICONS[s]} {s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Inventory Sub-view ───────────────────────────────────────────────────────
function AdminInventory({ socket }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(null);

  const fetchInventory = useCallback(() => {
    API.get('/inventory')
      .then(({ data }) => setItems(data.data || []))
      .catch(() => toast.error('Failed to load inventory'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchInventory();
    if (socket) {
      socket.on('inventoryUpdated', (updated) => {
        setItems((prev) => prev.map((item) => item._id === updated._id ? updated : item));
      });
    }
    return () => { if (socket) socket.off('inventoryUpdated'); };
  }, [fetchInventory, socket]);

  const handleEdit = (id, field, value) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSave = async (item) => {
    setSaving(item._id);
    const payload = edits[item._id] || {};
    try {
      await API.put(`/inventory/${item._id}`, {
        stock: payload.stock !== undefined ? Number(payload.stock) : item.stock,
        price: payload.price !== undefined ? Number(payload.price) : item.price,
        threshold: payload.threshold !== undefined ? Number(payload.threshold) : item.threshold,
      });
      toast.success(`${item.name} updated!`);
      setEdits((prev) => { const n = { ...prev }; delete n[item._id]; return n; });
      fetchInventory();
    } catch { toast.error('Update failed'); }
    finally { setSaving(null); }
  };

  const grouped = {};
  items.forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div>
      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{CATEGORY_ICONS[cat]}</span>
            <span style={{ textTransform: 'capitalize' }}>{cat}s</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>({catItems.length} items)</span>
          </div>
          <div className="inventory-grid">
            {catItems.map((item) => {
              const pct = Math.min(100, (item.stock / 50) * 100);
              const barClass = item.stock <= item.threshold ? 'low' : item.stock <= item.threshold * 2 ? 'medium' : 'high';
              const edited = edits[item._id] || {};
              return (
                <div className="inventory-card" key={item._id}>
                  <div className="inventory-header">
                    <div>
                      <div className="inventory-name">{item.name}</div>
                      <div className="inventory-category">{item.category}</div>
                    </div>
                    {item.stock <= item.threshold && (
                      <span className="badge badge-error" style={{ fontSize: '0.68rem' }}>⚠ Low</span>
                    )}
                  </div>
                  <div className="stock-bar-bg">
                    <div className={`stock-bar ${barClass}`} style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="inventory-footer">
                    <span>{item.stock} units</span>
                    <span>₹{item.price}/unit</span>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: 50 }}>Stock</label>
                      <input
                        id={`stock-${item._id}`}
                        type="number"
                        className="stock-input"
                        style={{ flex: 1 }}
                        value={edited.stock !== undefined ? edited.stock : item.stock}
                        min="0"
                        onChange={(e) => handleEdit(item._id, 'stock', e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: 50 }}>Price</label>
                      <input
                        id={`price-${item._id}`}
                        type="number"
                        className="stock-input"
                        style={{ flex: 1 }}
                        value={edited.price !== undefined ? edited.price : item.price}
                        min="0"
                        onChange={(e) => handleEdit(item._id, 'price', e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: 50 }}>Alert</label>
                      <input
                        type="number"
                        className="stock-input"
                        style={{ flex: 1 }}
                        value={edited.threshold !== undefined ? edited.threshold : item.threshold}
                        min="0"
                        onChange={(e) => handleEdit(item._id, 'threshold', e.target.value)}
                      />
                    </div>
                    {edits[item._id] && (
                      <button
                        className="btn btn-primary btn-sm btn-full"
                        onClick={() => handleSave(item)}
                        disabled={saving === item._id}
                      >
                        {saving === item._id ? <><span className="spinner spinner-sm"></span></> : 'Save Changes'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('orders');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io('http://localhost:5001');
    setSocket(s);
    return () => s.disconnect();
  }, []);

  const tabs = [
    { id: 'orders', label: '📦 Orders' },
    { id: 'inventory', label: '📊 Inventory' },
  ];

  return (
    <div className="page-wrapper">
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-title" style={{ marginTop: 8 }}>Admin Panel</div>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`admin-nav-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              id={`admin-tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
          <div style={{ marginTop: 'auto', paddingTop: 32, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }}></div>
                Live socket connected
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="admin-main">
          <div className="admin-page-title">
            {activeTab === 'orders' ? '📦 All Orders' : '📊 Inventory Management'}
          </div>
          {activeTab === 'orders' && <AdminOrders socket={socket} />}
          {activeTab === 'inventory' && <AdminInventory socket={socket} />}
        </main>
      </div>
    </div>
  );
}
