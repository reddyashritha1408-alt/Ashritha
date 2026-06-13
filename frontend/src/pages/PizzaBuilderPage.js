import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useCart } from '../context/CartContext';
import toast from '../components/Toast';
import { 
  SvgCrust, SvgSauce, SvgCheese, 
  SvgOnion, SvgCapsicum, SvgTomato, SvgMushroom, SvgOlive, SvgJalapeno, 
  SvgCorn, SvgPaneer, SvgPepperoni, SvgChicken, SvgSausage, SvgBacon, SvgDefault
} from '../components/PizzaAssets';

const CATEGORY_ICONS = { base: '🫓', sauce: '🥫', cheese: '🧀', veggie: '🥬', meat: '🥩' };
const CATEGORY_LABELS = { base: 'Pizza Base', sauce: 'Sauce', cheese: 'Cheese', veggie: 'Veggies', meat: 'Meats' };
const CATEGORIES = ['base', 'sauce', 'cheese', 'veggie', 'meat'];

export default function PizzaBuilderPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState('Medium');
  const [selected, setSelected] = useState({ base: null, sauce: null, cheese: null, veggies: [], meats: [] });
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/inventory')
      .then(({ data }) => setInventory(data.data || []))
      .catch(() => toast.error('Failed to load ingredients'))
      .finally(() => setLoading(false));
  }, []);

  const byCategory = useMemo(() => {
    const result = {};
    CATEGORIES.forEach((cat) => {
      result[cat] = inventory.filter((i) => i.category === cat);
    });
    return result;
  }, [inventory]);

  const totalPrice = useMemo(() => {
    let total = 0;
    const get = (name) => inventory.find((i) => i.name === name)?.price || 0;
    if (selected.base) total += get(selected.base);
    if (selected.sauce) total += get(selected.sauce);
    if (selected.cheese) total += get(selected.cheese);
    selected.veggies.forEach((v) => total += get(v));
    selected.meats.forEach((m) => total += get(m));
    return total;
  }, [selected, inventory]);

  const toggleSingle = (cat, name) => {
    setSelected((prev) => ({ ...prev, [cat]: prev[cat] === name ? null : name }));
  };

  const toggleMulti = (key, name) => {
    setSelected((prev) => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(name) ? arr.filter((x) => x !== name) : [...arr, name] };
    });
  };

  const canOrder = selected.base && selected.sauce && selected.cheese;

  const handleAddToCart = () => {
    if (!canOrder) { toast.error('Please select a base, sauce, and cheese!'); return; }
    const pizzaName = `Custom: ${selected.base} + ${selected.sauce} + ${selected.cheese}`;
    addToCart({
      type: 'custom',
      pizzaName,
      details: {
        base: selected.base,
        sauce: selected.sauce,
        cheese: selected.cheese,
        veggies: selected.veggies,
        meats: selected.meats,
      },
      totalPrice,
    });
    navigate('/checkout');
  };

  const renderIngredients = (cat, items, multi = false) => (
    <div className="ingredient-grid">
      {items.map((item) => {
        const isSelected = multi
          ? (cat === 'veggie' ? selected.veggies : selected.meats).includes(item.name)
          : selected[cat] === item.name;
        const outOfStock = item.stock <= 0;
        return (
          <button
            key={item._id}
            className={`ingredient-btn ${isSelected ? 'selected' : ''} ${outOfStock ? 'out-of-stock' : ''}`}
            onClick={() => {
              if (outOfStock) { toast.error(`${item.name} is out of stock!`); return; }
              multi ? toggleMulti(cat === 'veggie' ? 'veggies' : 'meats', item.name) : toggleSingle(cat, item.name);
            }}
          >
            <div className="ingredient-name">{item.name}</div>
            <div className="ingredient-price">+₹{item.price}</div>
            {outOfStock && <div style={{ fontSize: '0.7rem', color: 'var(--error)', marginTop: 2 }}>Out of stock</div>}
          </button>
        );
      })}
    </div>
  );

  if (loading) {
    return <div className="page-loader"><div className="spinner"></div><div className="page-loader-text">Loading ingredients...</div></div>;
  }

  return (
    <div className="page-wrapper">
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ marginBottom: 32 }}>
            <div className="section-eyebrow">Custom Order</div>
            <h1 className="section-title">Build Your Perfect Pizza 🛠️</h1>
            <p className="section-desc">Select your ingredients step by step</p>
          </div>

          <div className="builder-layout">
            <div className="builder-steps">
              {CATEGORIES.map((cat, idx) => {
                const isMulti = cat === 'veggie' || cat === 'meat';
                const items = byCategory[cat] || [];
                return (
                  <div className="builder-step" key={cat}>
                    <div className="builder-step-header">
                      <div className="step-num">{idx + 1}</div>
                      <div>
                        <div className="step-title">
                          {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                          {(cat === 'base' || cat === 'sauce' || cat === 'cheese') && (
                            <span style={{ color: 'var(--error)', fontSize: '0.75rem', marginLeft: 6 }}>*Required</span>
                          )}
                        </div>
                        <div className="step-subtitle">
                          {isMulti ? 'Select multiple' : 'Select one'}
                        </div>
                      </div>
                    </div>
                    {renderIngredients(cat, items, isMulti)}
                  </div>
                );
              })}
            </div>

            {/* Summary Sidebar */}
            <div className="pizza-summary">
              
              {/* Size Selector */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="size-selector">
                  {['Small', 'Medium', 'Large'].map((s) => (
                    <button
                      key={s}
                      className={`size-btn ${size === s ? 'active' : ''}`}
                      onClick={() => setSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pizza Preview */}
              <div className="pizza-preview-container">
                <div
                  className="pizza-preview-circle"
                  data-size={size}
                >
                  {/* SVG Crust Layer */}
                  {selected.base && <SvgCrust type={selected.base} />}
                  
                  {/* SVG Sauce Layer */}
                  {selected.sauce && <SvgSauce type={selected.sauce} />}
                  
                  {/* SVG Cheese Layer */}
                  {selected.cheese && <SvgCheese type={selected.cheese} />}
                  
                  <div className="pizza-layer-toppings">
                    {(() => {
                      const allToppings = [...selected.veggies, ...selected.meats];
                      if (allToppings.length === 0) return null;
                      
                      const pieces = [];
                      // Calculate number of pieces per topping. 
                      // Max ~40 pieces total so it doesn't look cluttered.
                      const targetTotalPieces = 40;
                      let piecesPerTopping = Math.floor(targetTotalPieces / allToppings.length);
                      // Bound between 4 and 15 pieces per topping
                      if (piecesPerTopping > 15) piecesPerTopping = 15;
                      if (piecesPerTopping < 4) piecesPerTopping = 4;
                      
                      allToppings.forEach((topping) => {
                        let Comp = SvgDefault;
                        if (topping.includes('Onion')) Comp = SvgOnion;
                        else if (topping.includes('Tomato')) Comp = SvgTomato;
                        else if (topping.includes('Capsicum') || topping.includes('Jalapeno') || topping.includes('Jalapeño')) Comp = topping.includes('Jalapeno') || topping.includes('Jalapeño') ? SvgJalapeno : SvgCapsicum;
                        else if (topping.includes('Olive')) Comp = SvgOlive;
                        else if (topping.includes('Corn')) Comp = SvgCorn;
                        else if (topping.includes('Paneer') || topping.includes('Cheese')) Comp = SvgPaneer;
                        else if (topping.includes('Mushroom')) Comp = SvgMushroom;
                        else if (topping.includes('Pepperoni')) Comp = SvgPepperoni;
                        else if (topping.includes('Chicken')) Comp = SvgChicken;
                        else if (topping.includes('Sausage')) Comp = SvgSausage;
                        else if (topping.includes('Bacon')) Comp = SvgBacon;
                        else if (topping.includes('Meat')) Comp = SvgSausage;
                        
                        for (let i = 0; i < piecesPerTopping; i++) {
                          pieces.push({ id: `${topping}-${i}`, Comp });
                        }
                      });
                      
                      const interleaved = [];
                      for (let i = 0; i < piecesPerTopping; i++) {
                        allToppings.forEach((topping) => {
                          const piece = pieces.find(p => p.id === `${topping}-${i}`);
                          if (piece) interleaved.push(piece);
                        });
                      }

                      return interleaved.map((piece, index) => {
                        const n = index + 1;
                        const angle = n * 137.5; // Golden angle for even spiral
                        const maxRadius = 38; // Keep within cheese
                        const rSpread = Math.sqrt(n) / Math.sqrt(interleaved.length);
                        const radius = rSpread * maxRadius;
                        
                        const top = `calc(50% + ${radius * Math.sin((angle * Math.PI) / 180)}%)`;
                        const left = `calc(50% + ${radius * Math.cos((angle * Math.PI) / 180)}%)`;
                        const rotation = (n * 73) % 360;
                        
                        return (
                          <div
                            key={piece.id}
                            className="topping-item-svg"
                            style={{ 
                              position: 'absolute',
                              top, left, 
                              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                              filter: 'drop-shadow(1px 2px 2px rgba(0,0,0,0.5))'
                            }}
                          >
                            <piece.Comp />
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Live Specifications Pills */}
                <div className="live-specs-container">
                  <div className="live-spec-pill"><span className="label">Size</span> {size}</div>
                  <div className="live-spec-pill"><span className="label">Base</span> {selected.base || 'None'}</div>
                  <div className="live-spec-pill"><span className="label">Sauce</span> {selected.sauce || 'None'}</div>
                  <div className="live-spec-pill"><span className="label">Cheese</span> {selected.cheese || 'None'}</div>
                  {[...selected.veggies, ...selected.meats].length > 0 && (
                    <div className="live-spec-pill">
                      <span className="label">Toppings</span> {[...selected.veggies, ...selected.meats].length}
                    </div>
                  )}
                </div>
              </div>

              <div className="summary-title">Order Summary</div>
              <div className="summary-items">
                {[
                  { label: 'Size', value: size },
                  { label: 'Base', value: selected.base },
                  { label: 'Sauce', value: selected.sauce },
                  { label: 'Cheese', value: selected.cheese },
                  ...(selected.veggies.length > 0 ? [{ label: 'Veggies', value: selected.veggies.join(', ') }] : []),
                  ...(selected.meats.length > 0 ? [{ label: 'Meats', value: selected.meats.join(', ') }] : []),
                ].map((item) => (
                  <div className="summary-item" key={item.label}>
                    <span className="summary-item-label">{item.label}</span>
                    <span className="summary-item-value" style={{ color: item.value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {item.value || '—'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="summary-divider"></div>
              <div className="summary-total">
                <span>Total</span>
                <span className="summary-total-price">₹{totalPrice}</span>
              </div>
              <div style={{ marginTop: 20 }}>
                <button
                  id="builder-checkout"
                  className="btn btn-primary btn-full btn-lg"
                  onClick={handleAddToCart}
                  disabled={!canOrder}
                >
                  {canOrder ? 'Proceed to Checkout →' : 'Select Base, Sauce & Cheese'}
                </button>
                {!canOrder && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                    Base, sauce & cheese are required
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
