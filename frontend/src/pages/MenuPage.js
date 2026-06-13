import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { useCart } from '../context/CartContext';
import toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export default function MenuPage() {
  const [pizzas, setPizzas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/pizzas')
      .then(({ data }) => setPizzas(data.data || []))
      .catch(() => toast.error('Failed to load menu'))
      .finally(() => setLoading(false));
  }, []);

  const handleOrder = (pizza) => {
    if (!user) {
      toast.error('Please login to order 🍕');
      navigate('/login');
      return;
    }
    addToCart({
      type: 'standard',
      pizzaName: pizza.name,
      details: { pizzaId: pizza._id },
      totalPrice: pizza.price,
      image: pizza.image,
    });
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner"></div>
        <div className="page-loader-text">Loading our delicious menu...</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Our Menu</div>
            <h1 className="section-title">Chef's Signature Pizzas</h1>
            <p className="section-desc">
              Handcrafted with the finest ingredients. Or{' '}
              <Link to="/build" style={{ color: 'var(--brand)' }}>build your own</Link>!
            </p>
          </div>

          {pizzas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🍕</div>
              <div className="empty-state-title">Menu coming soon!</div>
              <div>Our chefs are preparing something delicious.</div>
            </div>
          ) : (
            <div className="pizza-grid">
              {pizzas.map((pizza) => (
                <div className="pizza-card" key={pizza._id}>
                  <div style={{ overflow: 'hidden' }}>
                    <img
                      className="pizza-img"
                      src={pizza.name === 'Veggie Supreme' ? 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80' : (pizza.image || 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=600&q=80')}
                      alt={pizza.name}
                    />
                  </div>
                  <div className="pizza-card-body">
                    <div className="pizza-name">{pizza.name}</div>
                    <div className="pizza-desc">{pizza.description}</div>
                    <div className="pizza-tags">
                      {pizza.base && <span className="pizza-tag">🫓 {pizza.base}</span>}
                      {pizza.sauce && <span className="pizza-tag">🥫 {pizza.sauce}</span>}
                      {pizza.cheese && <span className="pizza-tag">🧀 {pizza.cheese}</span>}
                      {pizza.veggies?.map((v) => <span className="pizza-tag" key={v}>🥬 {v}</span>)}
                      {pizza.meats?.map((m) => <span className="pizza-tag" key={m}>🥩 {m}</span>)}
                    </div>
                    <div className="pizza-footer">
                      <div className="pizza-price">
                        ₹{pizza.price} <span>/ pizza</span>
                      </div>
                      <button
                        id={`order-${pizza._id}`}
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOrder(pizza)}
                      >
                        Order Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Want something unique?
            </p>
            <Link to="/build" className="btn btn-secondary">
              🛠️ Build Your Own Pizza
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
