import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Minus, Trash2, ShoppingBag, Leaf, Truck, Shield, RefreshCw } from 'lucide-react';
import './Cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  // Load cart items from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('plantCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(Array.isArray(parsedCart) ? parsedCart : []);
      } catch (error) {
        console.error('Error parsing cart data:', error);
        setCartItems([]);
      }
    }
  }, []);

  // Save cart items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('plantCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(id);
      return;
    }
    
    setCartItems(cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shipping = subtotal > 75 ? 0 : subtotal > 0 ? 5.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  // Function to continue shopping
  const continueShopping = () => {
    navigate('/shop');
  };

  return (
    <div className="cart-page">
      <div className="cart-container">
        {/* Header */}
        <div className="cart-header">
          <button onClick={continueShopping} className="back-button">
            <ChevronLeft size={20} />
            Continue Shopping
          </button>
          <h1>Your Cart</h1>
          <div className="cart-stats">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <ShoppingBag size={64} />
            </div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any plants to your cart yet.</p>
            <button onClick={continueShopping} className="browse-plants-btn">
              <Leaf size={18} />
              Browse Plants
            </button>
          </div>
        ) : (
          <div className="cart-content">
            {/* Cart Items */}
            <div className="cart-items-section">
              <div className="section-header">
                <h2>Cart Items</h2>
              </div>
              <div className="cart-items">
                {cartItems.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="item-image">
                      <img src={item.image} alt={item.name} />
                      {item.inStock === 0 && <div className="out-of-stock-label">Out of Stock</div>}
                    </div>
                    
                    <div className="item-details">
                      <h3 className="item-name">{item.name}</h3>
                      <p className="item-category">{item.category} • {item.difficulty} Care</p>
                      <div className="item-price">₹{item.price.toFixed(2)}</div>
                      
                      <div className="item-actions">
                        <div className="quantity-selector">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="quantity-btn"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="quantity">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="quantity-btn"
                            aria-label="Increase quantity"
                            disabled={item.quantity >= item.inStock}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="remove-btn"
                          aria-label="Remove item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="item-total">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="order-summary-section">
              <div className="order-summary">
                <h2>Order Summary</h2>
                
                <div className="summary-line">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                
                <div className="summary-line">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</span>
                </div>
                
                <div className="summary-line">
                  <span>Tax</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                
                <div className="summary-divider"></div>
                
                <div className="summary-total">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                
                <div className="shipping-progress">
                  {subtotal < 75 ? (
                    <div className="progress-message">
                      <span>Add ₹{(75 - subtotal).toFixed(2)} more for free shipping!</span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{width: `${Math.min((subtotal / 75) * 100, 100)}%`}}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="free-shipping-message">
                      <Truck size={16} />
                      <span>You've qualified for free shipping!</span>
                    </div>
                  )}
                </div>
                
                <button className="checkout-btn">
                  Proceed to Checkout
                </button>
                
                <div className="security-assurance">
                  <div className="security-item">
                    <Shield size={16} />
                    <span>Secure checkout</span>
                  </div>
                  <div className="security-item">
                    <RefreshCw size={16} />
                    <span>Easy returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;