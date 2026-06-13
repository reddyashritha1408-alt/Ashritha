import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from '../components/Toast';

// Utility to load script dynamically
const loadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const EMPTY_ADDRESS = { fullName: '', phone: '', houseNo: '', streetAddress: '', landmark: '', city: '', pincode: '', state: '' };

// ── Available coupons ──────────────────────────────────────────────────────────
const COUPONS = {
  SAVE50: { type: 'percent', value: 50, label: '50% OFF',  description: '50% discount on your order!' },
  FLAT100: { type: 'flat',   value: 100, label: '₹100 OFF', description: '₹100 flat discount on your order!' },
  PIZZA20: { type: 'percent', value: 20, label: '20% OFF',  description: '20% discount on your order!' },
};

function applyDiscount(originalPrice, coupon) {
  if (!coupon) return originalPrice;
  if (coupon.type === 'percent') {
    return Math.max(1, Math.round(originalPrice * (1 - coupon.value / 100)));
  }
  if (coupon.type === 'flat') {
    return Math.max(1, originalPrice - coupon.value);
  }
  return originalPrice;
}

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [newAddress, setNewAddress] = useState(EMPTY_ADDRESS);
  const [useNew, setUseNew] = useState(true);
  const [saveAddr, setSaveAddr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=address, 2=payment

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, ...COUPONS[code] }
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (!cart) { navigate('/menu'); return; }
    API.get('/addresses')
      .then(({ data }) => {
        if (data.data?.length > 0) {
          setSavedAddresses(data.data);
          setSelectedAddress(data.data[0]);
          setUseNew(false);
        }
      })
      .catch(() => {});
  }, [cart, navigate]);

  if (!cart) return null;

  const address = useNew ? newAddress : selectedAddress;

  // Derived discounted price
  const finalPrice = applyDiscount(cart.totalPrice, appliedCoupon);
  const discount = cart.totalPrice - finalPrice;

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError('Please enter a coupon code.'); return; }
    if (appliedCoupon?.code === code) { setCouponError('Coupon already applied.'); return; }
    const found = COUPONS[code];
    if (!found) { setCouponError('Invalid coupon code. Try SAVE50, FLAT100, or PIZZA20.'); return; }
    setCouponLoading(true);
    setTimeout(() => {
      setAppliedCoupon({ code, ...found });
      setCouponInput('');
      setCouponLoading(false);
      toast.success(`🎉 Coupon "${code}" applied — ${found.description}`);
    }, 600); // simulate a small delay for feel
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    toast.success('Coupon removed.');
  };

  const handleAddressChange = (e) => {
    setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
  };

  const handleConfirmAddress = (e) => {
    e.preventDefault();
    const a = address;
    if (!a?.fullName || !a?.phone || !a?.houseNo || !a?.streetAddress || !a?.city || !a?.pincode || !a?.state) {
      toast.error('Please fill all required address fields');
      return;
    }
    setStep(2);
  };

  const handlePayAndOrder = async () => {
    setLoading(true);
    try {
      // 1. Create payment order using discounted price
      const { data: payData } = await API.post('/payments/create-order', { amount: finalPrice });

      if (payData.isMock) {
        toast.success('Mock payment initiated! (Razorpay keys missing)');
        await finalizeOrder(`pay_mock_${Date.now()}`, payData.order.id, true);
        return;
      }

      // 2. Load Razorpay script
      const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        setLoading(false);
        return;
      }

      // 3. Real Razorpay checkout
      const options = {
        key: payData.key,
        amount: payData.order.amount,
        currency: 'INR',
        name: 'Pizza Delivery',
        description: cart.pizzaName,
        order_id: payData.order.id,
        handler: async (response) => {
          try {
            await API.post('/payments/verify-order', { ...response });
            await finalizeOrder(response.razorpay_payment_id, payData.order.id, false);
          } catch {
            toast.error('Payment verification failed');
            setLoading(false);
          }
        },
        prefill: {
          name: address?.fullName || user?.name,
          contact: address?.phone,
          email: user?.email,
        },
        theme: { color: '#FF4D00' },
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
      setLoading(false);
    }
  };

  const finalizeOrder = async (paymentId, orderId, isMock) => {
    try {
      // Save address if requested
      if (useNew && saveAddr) {
        await API.post('/addresses', newAddress).catch(() => {});
      }

      const orderPayload = {
        type: cart.type,
        pizzaName: cart.pizzaName,
        details: cart.details,
        totalPrice: finalPrice,
        paymentId,
        paymentStatus: 'success',
        address: useNew ? newAddress : selectedAddress,
        coupon: appliedCoupon ? { code: appliedCoupon.code, discount } : null,
      };

      const { data } = await API.post('/orders', orderPayload);
      if (data.success) {
        clearCart();
        toast.success('🎉 Order placed successfully!');
        navigate(`/order-status/${data.data._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const OrderSummary = () => (
    <div className="checkout-sidebar">
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
        Order Summary
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ fontSize: '3rem' }}>🍕</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{cart.pizzaName}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            {cart.type === 'custom' ? 'Custom Build' : 'Standard Pizza'}
          </div>
        </div>
      </div>
      {cart.type === 'custom' && cart.details && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {[['Base', cart.details.base], ['Sauce', cart.details.sauce], ['Cheese', cart.details.cheese],
            ...(cart.details.veggies?.length ? [['Veggies', cart.details.veggies.join(', ')]] : []),
            ...(cart.details.meats?.length ? [['Meats', cart.details.meats.join(', ')]] : [])
          ].map(([k, v]) => (
            <div key={k} className="summary-item">
              <span className="summary-item-label">{k}</span>
              <span className="summary-item-value">{v}</span>
            </div>
          ))}
        </div>
      )}
      <div className="summary-divider"></div>

      {/* Price breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span>Subtotal</span>
          <span>₹{cart.totalPrice}</span>
        </div>
        {appliedCoupon && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#22c55e' }}>
            <span>🏷️ {appliedCoupon.code} ({appliedCoupon.label})</span>
            <span>− ₹{discount}</span>
          </div>
        )}
        <div className="summary-divider"></div>
        <div className="summary-total">
          <span>Total</span>
          <span className="summary-total-price">₹{finalPrice}</span>
        </div>
      </div>

      {/* Coupon input */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          🏷️ Coupon Code
        </div>
        {appliedCoupon ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)',
            borderRadius: 'var(--radius-sm)', padding: '10px 14px',
          }}>
            <div>
              <div style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.88rem' }}>✓ {appliedCoupon.code}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{appliedCoupon.description}</div>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: 4 }}
              title="Remove coupon"
            >✕</button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="coupon-input"
                className="form-input"
                placeholder="e.g. SAVE50"
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                style={{ flex: 1, textTransform: 'uppercase', letterSpacing: 1 }}
              />
              <button
                id="apply-coupon"
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleApplyCoupon}
                disabled={couponLoading}
                style={{ whiteSpace: 'nowrap' }}
              >
                {couponLoading ? <span className="spinner spinner-sm"></span> : 'Apply'}
              </button>
            </div>
            {couponError && (
              <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--error)' }}>{couponError}</div>
            )}
            <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Try: <strong style={{ color: 'var(--brand)' }}>SAVE50</strong>, FLAT100, PIZZA20
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <section className="section">
        <div className="container">
          <div style={{ marginBottom: 32 }}>
            <div className="section-eyebrow">Checkout</div>
            <h1 className="section-title" style={{ marginBottom: 0 }}>
              {step === 1 ? '📍 Delivery Address' : '💳 Payment'}
            </h1>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            {['Delivery Address', 'Payment'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700,
                  background: step > i ? 'var(--brand)' : step === i + 1 ? 'var(--brand)' : 'var(--bg-card)',
                  color: step >= i + 1 ? 'white' : 'var(--text-muted)',
                  border: '2px solid', borderColor: step >= i + 1 ? 'var(--brand)' : 'var(--border)',
                }}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '0.85rem', color: step === i + 1 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: step === i + 1 ? 600 : 400 }}>{s}</span>
                {i < 1 && <div style={{ width: 32, height: 2, background: step > 1 ? 'var(--brand)' : 'var(--border)', borderRadius: 2 }}></div>}
              </div>
            ))}
          </div>

          <div className="checkout-layout">
            <div>
              {step === 1 && (
                <form onSubmit={handleConfirmAddress}>
                  {/* Saved addresses */}
                  {savedAddresses.length > 0 && (
                    <div className="card" style={{ marginBottom: 20 }}>
                      <div className="card-body">
                        <div style={{ fontWeight: 700, marginBottom: 14 }}>Saved Addresses</div>
                        {savedAddresses.map((addr) => (
                          <label key={addr._id} style={{ display: 'flex', gap: 12, padding: '12px', borderRadius: 'var(--radius-sm)', border: '2px solid', borderColor: selectedAddress?._id === addr._id && !useNew ? 'var(--brand)' : 'var(--border)', marginBottom: 10, cursor: 'pointer', background: 'var(--bg-secondary)' }}>
                            <input type="radio" name="savedAddr" checked={selectedAddress?._id === addr._id && !useNew} onChange={() => { setSelectedAddress(addr); setUseNew(false); }} style={{ marginTop: 2 }} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{addr.fullName}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{addr.houseNo}, {addr.streetAddress}, {addr.city} - {addr.pincode}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{addr.state} | {addr.phone}</div>
                            </div>
                          </label>
                        ))}
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setUseNew(true)} style={{ color: useNew ? 'var(--brand)' : 'var(--text-secondary)' }}>
                          + Add new address
                        </button>
                      </div>
                    </div>
                  )}

                  {(useNew || savedAddresses.length === 0) && (
                    <div className="card">
                      <div className="card-body">
                        <div style={{ fontWeight: 700, marginBottom: 16 }}>Delivery Details</div>
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">Full Name *</label>
                            <input className="form-input" name="fullName" value={newAddress.fullName} onChange={handleAddressChange} placeholder="John Doe" required={useNew} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Phone *</label>
                            <input className="form-input" name="phone" value={newAddress.phone} onChange={handleAddressChange} placeholder="9876543210" required={useNew} />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">House/Flat No. *</label>
                            <input className="form-input" name="houseNo" value={newAddress.houseNo} onChange={handleAddressChange} placeholder="Flat 4B" required={useNew} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Landmark</label>
                            <input className="form-input" name="landmark" value={newAddress.landmark} onChange={handleAddressChange} placeholder="Near park" />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Street Address *</label>
                          <input className="form-input" name="streetAddress" value={newAddress.streetAddress} onChange={handleAddressChange} placeholder="123 Main Street" required={useNew} />
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">City *</label>
                            <input className="form-input" name="city" value={newAddress.city} onChange={handleAddressChange} placeholder="Mumbai" required={useNew} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Pincode *</label>
                            <input className="form-input" name="pincode" value={newAddress.pincode} onChange={handleAddressChange} placeholder="400001" required={useNew} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">State *</label>
                          <input className="form-input" name="state" value={newAddress.state} onChange={handleAddressChange} placeholder="Maharashtra" required={useNew} />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} />
                          Save this address for future orders
                        </label>
                      </div>
                    </div>
                  )}

                  <button id="checkout-continue" type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: 20 }}>
                    Continue to Payment →
                  </button>
                </form>
              )}

              {step === 2 && (
                <div className="card">
                  <div className="card-body">
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Delivery To</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                      {address?.fullName}, {address?.houseNo}, {address?.streetAddress},<br />
                      {address?.city} - {address?.pincode}, {address?.state}
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>← Change Address</button>

                    <div className="summary-divider" style={{ margin: '20px 0' }}></div>

                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <div style={{ fontSize: '3rem', marginBottom: 12 }}>💳</div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>Complete Your Payment</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
                        Secure payment via Razorpay · Test Mode
                      </div>

                      {/* Razorpay logo & test info box */}
                      <div style={{
                        background: 'rgba(255,77,0,0.06)',
                        border: '1px solid rgba(255,77,0,0.25)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '16px',
                        marginBottom: 24,
                        textAlign: 'left'
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--brand)', fontSize: '0.85rem' }}>
                          🧪 Razorpay Test Mode
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          Use these test card details in the Razorpay popup:<br />
                          <strong style={{ color: 'var(--text-primary)' }}>Card:</strong> 4111 1111 1111 1111<br />
                          <strong style={{ color: 'var(--text-primary)' }}>Expiry:</strong> Any future date &nbsp;
                          <strong style={{ color: 'var(--text-primary)' }}>CVV:</strong> Any 3 digits<br />
                          <strong style={{ color: 'var(--text-primary)' }}>OTP:</strong> 1234 &nbsp;·&nbsp; No real money charged.
                        </div>
                      </div>

                      <button
                        id="pay-now"
                        className="btn btn-primary btn-full btn-lg"
                        onClick={handlePayAndOrder}
                        disabled={loading}
                        style={{ fontSize: '1rem', letterSpacing: 0.5 }}
                      >
                        {loading
                          ? <><span className="spinner spinner-sm"></span> Opening Razorpay...</>
                          : `🔒 Pay ₹${cart.totalPrice} & Place Order`}
                      </button>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 12 }}>
                        Powered by Razorpay · SSL Encrypted · 100% Secure
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <OrderSummary />
          </div>
        </div>
      </section>
    </div>
  );
}
