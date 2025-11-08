import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Heart,
  Grid,
  List,
  X,
  Plus,
  Minus,
  Leaf,
  Image as ImageIcon,
  Star,
  Droplets,
  Sun,
  Thermometer,
  Eye
} from "lucide-react";
import "./Shop.css";

const Shop = () => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid");
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Generate SVG placeholder
  const generatePlaceholder = (width = 150, height = 150, text = "No Image") => {
    const svgString = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
            fill="#999" text-anchor="middle" dy=".3em">${text}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svgString)}`;
  };

  // Process plant images
  const processPlantImage = (plant) => {
    if (plant.images && plant.images.length > 0 && plant.images[0]) {
      const imageUrl = plant.images[0];
      if (imageUrl.startsWith('/')) return `http://localhost:5000${imageUrl}`;
      if (imageUrl.startsWith('http')) return imageUrl;
      if (imageUrl.startsWith('data:')) return imageUrl;
      return imageUrl;
    }
    
    const placeholderText = plant.name ? plant.name.substring(0, 10) + (plant.name.length > 10 ? '...' : '') : 'Plant';
    return generatePlaceholder(150, 150, placeholderText);
  };

  // Parse care information from database
  const parseCareInfo = (careData) => {
    if (!careData) {
      return {
        water: 'Moderate watering',
        light: 'Bright indirect light',
        difficulty: 'Easy'
      };
    }
    
    if (typeof careData === 'object' && careData !== null) {
      return {
        water: careData.water || 'Moderate watering',
        light: careData.light || 'Bright indirect light',
        difficulty: careData.difficulty || 'Easy'
      };
    }
    
    if (typeof careData === 'string') {
      try {
        const parsed = JSON.parse(careData);
        return {
          water: parsed.water || 'Moderate watering',
          light: parsed.light || 'Bright indirect light',
          difficulty: parsed.difficulty || 'Easy'
        };
      } catch (e) {
        return {
          water: 'Moderate watering',
          light: 'Bright indirect light',
          difficulty: 'Easy'
        };
      }
    }
    
    return {
      water: 'Moderate watering',
      light: 'Bright indirect light',
      difficulty: 'Easy'
    };
  };

  // Process plant data for consistent structure
  const processPlantData = (plant) => {
    return {
      ...plant,
      images: Array.isArray(plant.images) ? plant.images : [],
      processedImage: processPlantImage(plant),
      care: parseCareInfo(plant.care)
    };
  };

  // Fetch plants from backend
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/plant/list");
        const plantsData = response.data?.plants || response.data?.data || [];
        
        const plantsWithProcessedData = plantsData.map(processPlantData);
        setPlants(plantsWithProcessedData);
        setError(null);
        
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load plants");
        
        const localPlants = JSON.parse(localStorage.getItem('plants') || '[]');
        const processedLocalPlants = localPlants.map(processPlantData);
        setPlants(processedLocalPlants);
      } finally {
        setLoading(false);
      }
    };

    fetchPlants();
  }, []);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('plantCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        const processedCart = parsedCart.map(item => ({
          ...item,
          processedImage: processPlantImage(item),
          care: parseCareInfo(item.care)
        }));
        setCart(processedCart);
      } catch (e) {
        console.error("Error parsing saved cart:", e);
        localStorage.removeItem('plantCart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('plantCart', JSON.stringify(cart));
  }, [cart]);

  // Filter + Sort plants
  const filteredPlants = useMemo(() => {
    return plants
      .filter(
        (plant) =>
          (selectedCategory === "all" || plant.category === selectedCategory) &&
          (plant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (plant.care?.difficulty && plant.care.difficulty.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (plant.care?.water && plant.care.water.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (plant.care?.light && plant.care.light.toLowerCase().includes(searchTerm.toLowerCase())))
      )
      .sort((a, b) => {
        switch (sortBy) {
          case "price-low": return (a.price || 0) - (b.price || 0);
          case "price-high": return (b.price || 0) - (a.price || 0);
          case "rating": return (b.rating || 0) - (a.rating || 0);
          case "name": return (a.name || "").localeCompare(b.name || "");
          default: return 0;
        }
      });
  }, [plants, selectedCategory, searchTerm, sortBy]);

  const categories = useMemo(() => {
    const uniqueCats = [...new Set(plants.map(p => p.category).filter(Boolean))];
    return uniqueCats.map(cat => ({
      id: cat,
      name: cat,
      count: plants.filter(p => p.category === cat).length,
      icon: "🌱",
    }));
  }, [plants]);

  const addToCart = (plant) => {
    if (!plant?._id && !plant?.id) return;
    const plantId = plant._id || plant.id;
    
    setCart((prev) => {
      const existing = prev.find((item) => (item._id || item.id) === plantId);
      if (existing) {
        return prev.map((item) =>
          (item._id || item.id) === plantId
            ? { ...item, quantity: Math.min(item.quantity + 1, plant.stockQuantity || 10) }
            : item
        );
      }
      return [...prev, { ...plant, quantity: 1 }];
    });
  };

  const updateCartQuantity = (id, quantity) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => (item._id || item.id) !== id));
    } else {
      setCart((prev) =>
        prev.map((item) => 
          (item._id || item.id) === id ? { ...item, quantity } : item
        )
      );
    }
  };

  const toggleWishlist = (plant) => {
    if (!plant?._id && !plant?.id) return;
    const plantId = plant._id || plant.id;
    
    setWishlist((prev) =>
      prev.find((item) => (item._id || item.id) === plantId)
        ? prev.filter((item) => (item._id || item.id) !== plantId)
        : [...prev, plant]
    );
  };

  // View plant details
  const viewPlantDetails = (plant) => {
    setSelectedPlant(plant);
    setDetailModalOpen(true);
  };

  // Clear cart function
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('plantCart');
  };

  // Render star rating
  const renderRating = (rating) => {
    if (rating === undefined || rating === null || rating === 0) {
      return <div className="rating-stars">No ratings yet</div>;
    }
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={14} fill="gold" stroke="gold" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key={fullStars} size={14} fill="gold" stroke="gold" />);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={fullStars + i + (hasHalfStar ? 1 : 0)} size={14} stroke="gold" />);
    }
    
    return <div className="rating-stars">{stars}</div>;
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  if (loading) return <p style={{ textAlign: "center", padding: "50px" }}>Loading plants...</p>;

  return (
    <div className="shop-container">
      {/* Header */}
      <div className="shop-header">
        <div className="header-content">
          <div className="logo">
            <Leaf className="logo-icon" />
            <h1>Plant Paradise</h1>
          </div>
          <div className="header-actions">
            <button onClick={() => setCartOpen(!cartOpen)} className="cart-button">
              <ShoppingCart className="cart-icon" />
              {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
            </button>
            <button onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
              {viewMode === "grid" ? <List /> : <Grid />}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* Search + Sort */}
      <div className="search-sort-panel">
        <input
          type="text"
          placeholder="Search plants, care level, water needs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="name">Sort by Name</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Rating</option>
        </select>
      </div>

      {/* Filters */}
      <div className="filters-panel">
        <button 
          onClick={() => setSelectedCategory("all")}
          className={`category-button ${selectedCategory === "all" ? "active" : ""}`}
        >
          All ({plants.length})
        </button>
        {categories.map((cat) => (
          <button 
            key={cat.id} 
            onClick={() => setSelectedCategory(cat.id)}
            className={`category-button ${selectedCategory === cat.id ? "active" : ""}`}
          >
            {cat.icon} {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      {/* Plant List */}
      <div className={`plants-container ${viewMode}`}>
        {filteredPlants.length === 0 ? (
          <div className="no-plants">
            <p>No plants found.</p>
            {searchTerm && (
              <button onClick={() => setSearchTerm("")}>Clear search</button>
            )}
          </div>
        ) : (
          filteredPlants.map((plant) => (
            <div key={plant._id || plant.id} className="plant-card">
              <div className="plant-image-container">
                <img
                  src={plant.processedImage}
                  alt={plant.name}
                  className="plant-image"
                  onError={(e) => {
                    e.target.src = generatePlaceholder(150, 150, "Plant");
                  }}
                />
                <button 
                  className={`wishlist-btn ${wishlist.find(item => (item._id || item.id) === (plant._id || plant.id)) ? 'active' : ''}`}
                  onClick={() => toggleWishlist(plant)}
                >
                  <Heart size={18} />
                </button>
                
                {(!plant.images || plant.images.length === 0) && (
                  <div className="image-placeholder">
                    <ImageIcon size={32} />
                  </div>
                )}
                
                {plant.popular && (
                  <div className="popular-badge">Popular</div>
                )}
              </div>
              <div className="plant-info">
                <h3>{plant.name}</h3>
                <div className="plant-meta">
                  {plant.rating !== undefined && (
                    <div className="plant-rating">
                      {renderRating(plant.rating)}
                    </div>
                  )}
                  <span className="plant-price">Rs. {plant.price}</span>
                </div>
                <div className="stock-info">
                  {plant.stockQuantity > 0 ? (
                    <span className="in-stock">In stock ({plant.stockQuantity} available)</span>
                  ) : (
                    <span className="out-of-stock">Out of stock</span>
                  )}
                </div>
              </div>
              <div className="plant-actions">
                <button 
                  className="view-details-btn"
                  onClick={() => viewPlantDetails(plant)}
                >
                  <Eye size={16} /> View Details
                </button>
                <button 
                  className="add-cart"
                  onClick={() => addToCart(plant)}
                  disabled={plant.stockQuantity <= 0}
                >
                  {plant.stockQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Plant Details Modal */}
      {detailModalOpen && selectedPlant && (
        <div className="plant-detail-modal">
          <div className="modal-overlay" onClick={() => setDetailModalOpen(false)} />
          <div className="modal-content">
            <button className="close-modal" onClick={() => setDetailModalOpen(false)}>
              <X size={24} />
            </button>
            
            <div className="modal-header">
              <h2>{selectedPlant.name}</h2>
              <div className="modal-price">Rs. {selectedPlant.price}</div>
            </div>
            
            <div className="modal-body">
              <div className="modal-image-section">
                <img
                  src={selectedPlant.processedImage}
                  alt={selectedPlant.name}
                  className="modal-image"
                  onError={(e) => {
                    e.target.src = generatePlaceholder(300, 300, "Plant");
                  }}
                />
                {selectedPlant.rating !== undefined && (
                  <div className="modal-rating">
                    {renderRating(selectedPlant.rating)}
                    <span>({selectedPlant.rating})</span>
                  </div>
                )}
              </div>
              
              <div className="modal-details-section">
                <div className="modal-description">
                  <h3>Description</h3>
                  <p>{selectedPlant.description || 'No description available.'}</p>
                </div>
                
                <div className="modal-care-info">
                  <h3>Care Information</h3>
                  <div className="care-details">
                    <div className="care-item">
                      <Droplets size={18} />
                      <div>
                        <strong>Water:</strong> {selectedPlant.care?.water || 'Moderate watering'}
                      </div>
                    </div>
                    <div className="care-item">
                      <Sun size={18} />
                      <div>
                        <strong>Light:</strong> {selectedPlant.care?.light || 'Bright indirect light'}
                      </div>
                    </div>
                    <div className="care-item">
                      <Thermometer size={18} />
                      <div>
                        <strong>Care Level:</strong> 
                        <span className={`level-${(selectedPlant.care?.difficulty || 'easy').toLowerCase()}`}>
                          {selectedPlant.care?.difficulty || 'Easy'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-stock">
                  <strong>Availability:</strong> 
                  {selectedPlant.stockQuantity > 0 ? (
                    <span className="in-stock"> In stock ({selectedPlant.stockQuantity} available)</span>
                  ) : (
                    <span className="out-of-stock"> Out of stock</span>
                  )}
                </div>
                
                <div className="modal-category">
                  <strong>Category:</strong> {selectedPlant.category || 'Uncategorized'}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="modal-add-cart"
                onClick={() => {
                  addToCart(selectedPlant);
                  setDetailModalOpen(false);
                }}
                disabled={selectedPlant.stockQuantity <= 0}
              >
                {selectedPlant.stockQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className="cart-sidebar">
          <div className="cart-overlay" onClick={() => setCartOpen(false)} />
          <div className="cart-content">
            <div className="cart-header">
              <h3>Shopping Cart ({cartItemCount})</h3>
              <div className="cart-header-actions">
                {cart.length > 0 && (
                  <button className="clear-cart-btn" onClick={clearCart}>
                    Clear Cart
                  </button>
                )}
                <button className="close-cart" onClick={() => setCartOpen(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {cart.length === 0 ? (
              <div className="empty-cart">
                <p>Your cart is empty</p>
                <button onClick={() => setCartOpen(false)}>Continue Shopping</button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div key={item._id || item.id} className="cart-item">
                      <img
                        src={item.processedImage || generatePlaceholder(60, 60, "Cart")}
                        alt={item.name}
                        onError={(e) => {
                          e.target.src = generatePlaceholder(60, 60, "Cart");
                        }}
                      />
                      <div className="item-details">
                        <h4>{item.name}</h4>
                        <p>Rs. {item.price}</p>
                        <div className="cart-qty">
                          <button 
                            onClick={() => updateCartQuantity(item._id || item.id, (item.quantity || 0) - 1)}
                          >
                            <Minus size={14} />
                          </button>
                          <span>{item.quantity || 0}</span>
                          <button 
                            onClick={() => updateCartQuantity(item._id || item.id, (item.quantity || 0) + 1)}
                            disabled={(item.quantity || 0) >= (item.stockQuantity || 10)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="item-total">
                        Rs. {(item.price || 0) * (item.quantity || 0)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-footer">
                  <div className="cart-total">
                    <strong>Total: Rs. {cartTotal.toFixed(2)}</strong>
                  </div>
                  <button className="checkout-btn">Proceed to Checkout</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;