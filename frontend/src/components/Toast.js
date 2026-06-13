import React, { useState, useEffect, useCallback } from 'react';

let toastId = 0;
let addToastFn = null;

// Inject styles once
const TOAST_STYLES = `
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}
.toast-item {
  pointer-events: all;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: 12px;
  background: #1A1A26;
  border: 1px solid rgba(255,255,255,0.08);
  color: #F0F0FF;
  font-size: 0.88rem;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  min-width: 240px;
  max-width: 360px;
  animation: toastIn 0.3s cubic-bezier(0.4,0,0.2,1) forwards;
}
.toast-item.leaving {
  animation: toastOut 0.25s ease forwards;
}
.toast-icon { font-size: 1.1rem; flex-shrink: 0; }
@keyframes toastIn {
  from { opacity: 0; transform: translateX(60px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes toastOut {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(60px); }
}
`;

function injectStyles() {
  if (document.getElementById('pizza-toast-styles')) return;
  const el = document.createElement('style');
  el.id = 'pizza-toast-styles';
  el.textContent = TOAST_STYLES;
  document.head.appendChild(el);
}

export function ToastProvider() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => { injectStyles(); }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 280);
  }, []);

  addToastFn = useCallback((message, type = 'success') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, leaving: false }]);
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  const iconMap = { success: '✅', error: '❌', info: 'ℹ️', loading: '⏳' };

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-item ${t.leaving ? 'leaving' : ''}`}
          onClick={() => removeToast(t.id)}
          style={{ cursor: 'pointer' }}
        >
          <span className="toast-icon">{iconMap[t.type] || '✅'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// Drop-in API matching react-hot-toast
const toast = (message) => addToastFn?.(message, 'success');
toast.success = (message) => addToastFn?.(message, 'success');
toast.error = (message) => addToastFn?.(message, 'error');
toast.info = (message) => addToastFn?.(message, 'info');
toast.loading = (message) => addToastFn?.(message, 'loading');

export default toast;
