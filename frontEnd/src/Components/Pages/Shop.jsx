import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, ShoppingCart, Heart, Star, Grid, List, SortAsc, X, Plus, Minus, Eye, Share2, ChevronDown, Leaf, Sun, Droplets, TrendingUp, Award, Gift } from 'lucide-react';
import './Shop.css';

const Shop = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [viewMode, setViewMode] = useState('grid');
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Sample plant data with enhanced properties
  const plants = [
    { id: 1, name: 'Snake Plant', category: 'indoor', price: 299, rating: 4.8, difficulty: 'Easy', light: 'Low-Medium', image: "/src/assets/1716209064-81SXDZveAL.avif", description: "Perfect for beginners, purifies air effectively", inStock: 15, trending: true, bestSeller: false },
    { id: 2, name: 'Monstera Deliciosa', category: 'indoor', price: 599, rating: 4.9, difficulty: 'Medium', light: 'Bright Indirect', image: '/api/placeholder/250/250', description: "Instagram-famous plant with stunning fenestrated leaves", inStock: 8, trending: true, bestSeller: true },
    { id: 3, name: 'Pothos Golden', category: 'indoor', price: 199, rating: 4.7, difficulty: 'Easy', light: 'Low-Medium', image: '/api/placeholder/250/250', description: "Trailing beauty perfect for hanging baskets", inStock: 20, trending: false, bestSeller: true },
    { id: 4, name: 'Rubber Plant', category: 'indoor', price: 449, rating: 4.6, difficulty: 'Easy', light: 'Bright Indirect', image: '/api/placeholder/250/250', description: "Glossy leaves and easy care make this a favorite", inStock: 12, trending: false, bestSeller: false },
    { id: 5, name: 'ZZ Plant', category: 'indoor', price: 399, rating: 4.8, difficulty: 'Easy', light: 'Low', image: '/api/placeholder/250/250', description: "Nearly indestructible, perfect for offices", inStock: 18, trending: false, bestSeller: false },
    { id: 6, name: 'Peace Lily', category: 'indoor', price: 349, rating: 4.5, difficulty: 'Medium', light: 'Medium', image: '/api/placeholder/250/250', description: "Beautiful white flowers and air purifying", inStock: 10, trending: false, bestSeller: false },
    { id: 7, name: 'Fiddle Leaf Fig', category: 'indoor', price: 799, rating: 4.3, difficulty: 'Hard', light: 'Bright', image: '/api/placeholder/250/250', description: "Statement plant with large violin-shaped leaves", inStock: 5, trending: true, bestSeller: false },
    { id: 8, name: 'Spider Plant', category: 'indoor', price: 249, rating: 4.6, difficulty: 'Easy', light: 'Medium', image: '/api/placeholder/250/250', description: "Produces baby plants, great for propagation", inStock: 25, trending: false, bestSeller: false },
    
    { id: 9, name: 'Bonsai Ficus', category: 'specialty', price: 1299, rating: 4.4, difficulty: 'Hard', light: 'Bright', image: '/api/placeholder/250/250', description: "Ancient art form in a small package", inStock: 3, trending: false, bestSeller: false },
    { id: 10, name: 'Orchid White', category: 'specialty', price: 899, rating: 4.7, difficulty: 'Medium', light: 'Bright Indirect', image: '/api/placeholder/250/250', description: "Elegant flowering plant for special occasions", inStock: 7, trending: false, bestSeller: true },
    { id: 11, name: 'Carnivorous Plant', category: 'specialty', price: 699, rating: 4.2, difficulty: 'Hard', light: 'Bright', image: '/api/placeholder/250/250', description: "Fascinating insect-eating plant", inStock: 4, trending: true, bestSeller: false },
    { id: 12, name: 'Air Plant', category: 'specialty', price: 399, rating: 4.5, difficulty: 'Medium', light: 'Bright Indirect', image: "/src/assets/images.jpeg", description: "No soil needed, just mist regularly", inStock: 15, trending: false, bestSeller: false },
    
    { id: 13, name: 'Small Pothos', category: 'tabletop', price: 149, rating: 4.8, difficulty: 'Easy', light: 'Low-Medium', image: '/api/placeholder/250/250', description: "Perfect desk companion", inStock: 30, trending: false, bestSeller: true },
    { id: 14, name: 'Desk Succulent', category: 'tabletop', price: 99, rating: 4.6, difficulty: 'Easy', light: 'Bright', image: '/api/placeholder/250/250', description: "Tiny and adorable office plant", inStock: 40, trending: false, bestSeller: false },
    { id: 15, name: 'Mini Bamboo', category: 'tabletop', price: 199, rating: 4.4, difficulty: 'Easy', light: 'Medium', image: '/api/placeholder/250/250', description: "Brings luck and positive energy", inStock: 22, trending: false, bestSeller: false },
    { id: 16, name: 'Table Palm', category: 'tabletop', price: 249, rating: 4.5, difficulty: 'Medium', light: 'Bright Indirect', image: '/api/placeholder/250/250', description: "Tropical vibes for your workspace", inStock: 16, trending: false, bestSeller: false },
    
    { id: 17, name: 'Hibiscus Red', category: 'outdoor', price: 399, rating: 4.6, difficulty: 'Medium', light: 'Full Sun', image: '/api/placeholder/250/250', description: "Stunning red flowers all season", inStock: 14, trending: false, bestSeller: false },
    { id: 18, name: 'Bougainvillea', category: 'outdoor', price: 549, rating: 4.7, difficulty: 'Medium', light: 'Full Sun', image: '/api/placeholder/250/250', description: "Vibrant climbing plant with papery flowers", inStock: 9, trending: false, bestSeller: false },
    { id: 19, name: 'Rose Plant', category: 'outdoor', price: 449, rating: 4.8, difficulty: 'Medium', light: 'Full Sun', image: '/api/placeholder/250/250', description: "Classic beauty with fragrant blooms", inStock: 11, trending: false, bestSeller: true },
    { id: 20, name: 'Mint Plant', category: 'outdoor', price: 99, rating: 4.9, difficulty: 'Easy', light: 'Partial Sun', image: '/api/placeholder/250/250', description: "Fresh herbs for your kitchen", inStock: 35, trending: false, bestSeller: false },
    
    { id: 21, name: 'Palm Tree', category: 'landscaping', price: 1999, rating: 4.5, difficulty: 'Medium', light: 'Full Sun', image: '/api/placeholder/250/250', description: "Create a tropical paradise", inStock: 2, trending: false, bestSeller: false },
    { id: 22, name: 'Hedge Plants', category: 'landscaping', price: 299, rating: 4.4, difficulty: 'Easy', light: 'Full Sun', image: '/api/placeholder/250/250', description: "Perfect for privacy and borders", inStock: 50, trending: false, bestSeller: false },
    { id: 23, name: 'Bamboo Cluster', category: 'landscaping', price: 1299, rating: 4.6, difficulty: 'Medium', light: 'Partial Sun', image:"/src/assets/images (10).jpeg", description: "Fast-growing natural screen", inStock: 6, trending: false, bestSeller: false },
    { id: 24, name: 'Large Agave', category: 'landscaping', price: 899, rating: 4.3, difficulty: 'Easy', light: 'Full Sun', image: '/api/placeholder/250/250', description: "Dramatic succulent for modern gardens", inStock: 8, trending: false, bestSeller: false }
  ];

  const categories = [
    { id: 'all', name: 'All Plants', icon: '🌿', count: plants.length },
    { id: 'indoor', name: 'Indoor Plants', icon: '🏠', count: plants.filter(p => p.category === 'indoor').length },
    { id: 'specialty', name: 'Specialty Plants', icon: '🌺', count: plants.filter(p => p.category === 'specialty').length },
    { id: 'tabletop', name: 'Table Top Plants', icon: '🪴', count: plants.filter(p => p.category === 'tabletop').length },
    { id: 'outdoor', name: 'Outdoor Plants', icon: '🌳', count: plants.filter(p => p.category === 'outdoor').length },
    { id: 'landscaping', name: 'Landscaping Plants', icon: '🌲', count: plants.filter(p => p.category === 'landscaping').length }
  ];

  // Filter and sort plants
  const filteredPlants = useMemo(() => {
    let filtered = plants.filter(plant => {
      const matchesCategory = selectedCategory === 'all' || plant.category === selectedCategory;
      const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           plant.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPrice = plant.price >= priceRange[0] && plant.price <= priceRange[1];
      
      return matchesCategory && matchesSearch && matchesPrice;
    });

    // Sort plants
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        case 'name': return a.name.localeCompare(b.name);
        case 'trending': return b.trending - a.trending;
        default: return 0;
      }
    });

    return filtered;
  }, [plants, selectedCategory, searchTerm, priceRange, sortBy]);

  // Cart functions
  const addToCart = (plant) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === plant.id);
      if (existing) {
        return prev.map(item => 
          item.id === plant.id 
            ? { ...item, quantity: Math.min(item.quantity + 1, plant.inStock) }
            : item
        );
      }
      return [...prev, { ...plant, quantity: 1 }];
    });
  };

  const updateCartQuantity = (id, quantity) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      setCart(prev => prev.map(item => 
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const toggleWishlist = (plant) => {
    setWishlist(prev => {
      const exists = prev.find(item => item.id === plant.id);
      if (exists) {
        return prev.filter(item => item.id !== plant.id);
      }
      return [...prev, plant];
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
            <button 
              onClick={() => setCartOpen(true)}
              className="cart-button"
            >
              <ShoppingCart className="cart-icon" />
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h2 className="hero-title">Transform Your Space</h2>
          <p className="hero-subtitle">Discover our beautiful collection of plants for every corner of your life</p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">500+</span>
              <span className="stat-label">Plant Varieties</span>
            </div>
            <div className="stat">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Happy Customers</span>
            </div>
            <div className="stat">
              <span className="stat-number">98%</span>
              <span className="stat-label">Satisfaction Rate</span>
            </div>
          </div>
        </div>
        <div className="hero-decorations">
          <div className="decoration decoration-1">🌿</div>
          <div className="decoration decoration-2">🌱</div>
          <div className="decoration decoration-3">🍃</div>
          <div className="decoration decoration-4">🌺</div>
          <div className="decoration decoration-5">🌸</div>
          <div className="decoration decoration-6">🌵</div>
        </div>
      </div>

      <div className="main-content">
        {/* Search and Controls */}
        <div className="search-controls">
          <div className="controls-row">
            {/* Search */}
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search plants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="control-buttons">
              {/* Sort */}
              <div className="sort-container">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="name">Sort by Name</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="trending">Trending</option>
                </select>
                <ChevronDown className="select-icon" />
              </div>

              {/* View Mode */}
              <div className="view-mode-buttons">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
                >
                  <Grid className="view-icon" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
                >
                  <List className="view-icon" />
                </button>
              </div>

              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`filters-toggle ${showFilters ? 'active' : ''}`}
              >
                <Filter className="filter-icon" />
                Filters
              </button>
            </div>
          </div>

          {/* Expandable Filters */}
          <div className={`filters-panel ${showFilters ? 'open' : ''}`}>
            <div className="filters-grid">
              {/* Categories */}
              <div className="filter-group">
                <h3 className="filter-title">Categories</h3>
                <div className="category-grid">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
                    >
                      <div className="category-content">
                        <span className="category-icon">{category.icon}</span>
                        <div className="category-text">
                          <span className="category-name">{category.name}</span>
                          <span className="category-count">({category.count})</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="filter-group">
                <h3 className="filter-title">Price Range</h3>
                <div className="price-range">
                  <div className="price-labels">
                    <span>₹{priceRange[0]}</span>
                    <span>₹{priceRange[1]}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="price-slider"
                  />
                  <div className="price-quick-filters">
                    <button onClick={() => setPriceRange([0, 300])} className="price-quick-btn">Under ₹300</button>
                    <button onClick={() => setPriceRange([300, 600])} className="price-quick-btn">₹300-₹600</button>
                    <button onClick={() => setPriceRange([600, 2000])} className="price-quick-btn">Above ₹600</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="results-header">
          <div className="results-info">
            <h2 className="results-title">
              {categories.find(cat => cat.id === selectedCategory)?.name || 'All Plants'}
            </h2>
            <p className="results-count">{filteredPlants.length} plants found</p>
          </div>
          
          {/* Quick Filters */}
          <div className="quick-filters">
            <button 
              onClick={() => setSortBy('trending')} 
              className={`quick-filter ${sortBy === 'trending' ? 'active' : ''}`}
            >
              <TrendingUp className="quick-filter-icon" />
              Trending
            </button>
            <button 
              onClick={() => setSortBy('rating')} 
              className={`quick-filter ${sortBy === 'rating' ? 'active' : ''}`}
            >
              <Award className="quick-filter-icon" />
              Top Rated
            </button>
          </div>
        </div>

        {/* Plants Grid/List */}
        <div className={`plants-container ${viewMode}`}>
          {filteredPlants.map(plant => (
            <div key={plant.id} className="plant-card">
              <div className="plant-image-container">
                <img
                  src={plant.image}
                  alt={plant.name}
                  className="plant-image"
                />
                
                {/* Badges */}
                <div className="plant-badges">
                  {plant.trending && (
                    <span className="badge trending">
                      <TrendingUp className="badge-icon" />
                      Trending
                    </span>
                  )}
                  {plant.bestSeller && (
                    <span className="badge bestseller">
                      <Award className="badge-icon" />
                      Best Seller
                    </span>
                  )}
                  {plant.inStock < 5 && (
                    <span className="badge low-stock">
                      Only {plant.inStock} left!
                    </span>
                  )}
                </div>
                
                {/* Overlay Buttons */}
                <div className="plant-overlay">
                  <div className="overlay-buttons">
                    <button
                      onClick={() => setSelectedPlant(plant)}
                      className="overlay-btn"
                      title="Quick View"
                    >
                      <Eye className="overlay-icon" />
                    </button>
                    <button
                      onClick={() => toggleWishlist(plant)}
                      className={`overlay-btn ${wishlist.find(item => item.id === plant.id) ? 'active' : ''}`}
                      title="Add to Wishlist"
                    >
                      <Heart className="overlay-icon" />
                    </button>
                    <button className="overlay-btn" title="Share">
                      <Share2 className="overlay-icon" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="plant-info">
                <div className="plant-header">
                  <h3 className="plant-name">{plant.name}</h3>
                  <div className="plant-rating">
                    <Star className="star-icon" />
                    <span className="rating-text">{plant.rating}</span>
                  </div>
                </div>

                <p className="plant-description">{plant.description}</p>

                <div className="plant-tags">
                  <span className={`tag difficulty-${plant.difficulty.toLowerCase()}`}>
                    {plant.difficulty}
                  </span>
                  <span className="tag light">
                    <Sun className="tag-icon" />
                    {plant.light}
                  </span>
                </div>

                <div className="plant-footer">
                  <span className="plant-price">₹{plant.price}</span>
                  <button
                    onClick={() => addToCart(plant)}
                    disabled={plant.inStock === 0}
                    className="add-to-cart-btn"
                  >
                    <Plus className="btn-icon" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPlants.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🌱</div>
            <h3 className="empty-title">No plants found</h3>
            <p className="empty-description">Try adjusting your search or filters</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setPriceRange([0, 2000]);
              }}
              className="reset-filters-btn"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Shopping Cart Sidebar */}
      <div className={`cart-sidebar ${cartOpen ? 'open' : ''}`}>
        <div className="cart-overlay" onClick={() => setCartOpen(false)}></div>
        <div className="cart-content">
          <div className="cart-header">
            <h3 className="cart-title">Shopping Cart</h3>
            <button
              onClick={() => setCartOpen(false)}
              className="cart-close-btn"
            >
              <X className="close-icon" />
            </button>
          </div>

          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <ShoppingCart className="empty-cart-icon" />
                <p className="empty-cart-text">Your cart is empty</p>
                <button onClick={() => setCartOpen(false)} className="continue-shopping-btn">
                  Continue Shopping
                </button>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} className="cart-item-image" />
                  
                  <div className="cart-item-info">
                    <h4 className="cart-item-name">{item.name}</h4>
                    <p className="cart-item-price">₹{item.price}</p>
                  </div>

                  <div className="quantity-controls">
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="quantity-btn"
                    >
                      <Minus className="quantity-icon" />
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="quantity-btn"
                      disabled={item.quantity >= item.inStock}
                    >
                      <Plus className="quantity-icon" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="cart-footer">
              <div className="cart-summary">
                <div className="total-row">
                  <span className="total-label">Total:</span>
                  <span className="total-amount">₹{cartTotal}</span>
                </div>
              </div>
              <button className="checkout-btn">
                <Gift className="checkout-icon" />
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Plant Quick View Modal */}
      {selectedPlant && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{selectedPlant.name}</h3>
              <button
                onClick={() => setSelectedPlant(null)}
                className="modal-close-btn"
              >
                <X className="close-icon" />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-image">
                <img
                  src={selectedPlant.image}
                  alt={selectedPlant.name}
                  className="modal-plant-image"
                />
                {selectedPlant.trending && (
                  <span className="modal-badge trending">
                    <TrendingUp className="badge-icon" />
                    Trending
                  </span>
                )}
                {selectedPlant.bestSeller && (
                  <span className="modal-badge bestseller">
                    <Award className="badge-icon" />
                    Best Seller
                  </span>
                )}
              </div>

              <div className="modal-details">
                <div className="modal-rating">
                  <Star className="star-icon" />
                  <span className="rating-text">{selectedPlant.rating}</span>
                  <span className="rating-count">(127 reviews)</span>
                </div>

                <p className="modal-description">{selectedPlant.description}</p>

                <div className="modal-specs">
                  <div className="spec-row">
                    <span className="spec-label">Difficulty:</span>
                    <span className={`spec-value difficulty-${selectedPlant.difficulty.toLowerCase()}`}>
                      {selectedPlant.difficulty}
                    </span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Light Requirements:</span>
                    <span className="spec-value">
                      <Sun className="spec-icon" />
                      {selectedPlant.light}
                    </span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Stock:</span>
                    <span className="spec-value">{selectedPlant.inStock} available</span>
                  </div>
                </div>

                <div className="modal-footer">
                  <span className="modal-price">₹{selectedPlant.price}</span>
                  <button
                    onClick={() => {
                      addToCart(selectedPlant);
                      setSelectedPlant(null);
                    }}
                    className="modal-add-btn"
                    disabled={selectedPlant.inStock === 0}
                  >
                    <Plus className="btn-icon" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;