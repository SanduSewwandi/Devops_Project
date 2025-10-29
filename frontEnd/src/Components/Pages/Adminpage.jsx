import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  Users,
  Settings,
  Leaf,
  ShoppingCart,
  BarChart,
  Bell,
  ChevronRight,
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Filter,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  RefreshCw,
  Activity,
  Target,
} from "lucide-react"
import "./Adminpage.css"

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddPlant, setShowAddPlant] = useState(false)
  const [editingPlant, setEditingPlant] = useState(null)
  const [plants, setPlantsState] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0)

  // Function to process plant image URL
  const getPlantImageUrl = (plant) => {
    if (!plant.images || plant.images.length === 0) {
      return null;
    }
    
    const imageUrl = plant.images[0];
    
    if (imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    
    if (imageUrl.startsWith('/')) {
      return `http://localhost:5000${imageUrl}`;
    }
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    return imageUrl;
  };

  // Load plants from localStorage on component mount
  useEffect(() => {
    const loadPlants = () => {
      try {
        const storedPlants = localStorage.getItem('plants')
        if (storedPlants) {
          const parsedPlants = JSON.parse(storedPlants)
          setPlantsState(parsedPlants)
        } else {
          const initialPlants = [
            { 
              id: 1, 
              name: "Monstera Deliciosa", 
              description: "A stunning tropical plant with large, split leaves perfect for brightening any indoor space.",
              category: "indoor", 
              price: 45.00, 
              images: [], 
              rating: 4.8,
              stockQuantity: 25,
              care: {
                water: "weekly",
                light: "indirect-light",
                difficulty: "easy"
              },
              popular: true,
              dateAdded: "2024-01-15"
            },
            { 
              id: 2, 
              name: "Snake Plant", 
              description: "Low-maintenance plant that thrives in low light conditions and purifies the air.",
              category: "indoor", 
              price: 32.00, 
              images: [], 
              rating: 4.6,
              stockQuantity: 50,
              care: {
                water: "bi-weekly",
                light: "low-light",
                difficulty: "easy"
              },
              popular: true,
              dateAdded: "2024-02-01"
            }
          ]
          setPlantsState(initialPlants)
          localStorage.setItem('plants', JSON.stringify(initialPlants))
        }
      } catch (error) {
        console.error('Error loading plants:', error)
      }
    }

    loadPlants()
  }, [])

  // Fetch plants from backend when products section is active
  useEffect(() => {
    if (activeSection === "products") {
      fetchPlants();
    }
  }, [activeSection, forceUpdate]);

  // Function to fetch plants from backend
  const fetchPlants = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/plant/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch plants");
      }
      
      const data = await response.json();
      const plantsData = data.plants || data.data || [];
      
      setPlantsState(plantsData);
      localStorage.setItem('plants', JSON.stringify(plantsData));
    } catch (error) {
      console.error("Error fetching plants:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users from MongoDB when users section is active
  useEffect(() => {
    if (activeSection === "users") {
      fetchUsers();
    }
  }, [activeSection]);

  // Function to fetch users from MongoDB
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/user/all", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Navigation to add product page
  const handleAddProduct = () => {
    setEditingPlant(null)
    setShowAddPlant(true)
  }

  // Handle adding new plant - FIXED: Use the actual stockQuantity from form data
  const handleAddPlant = async (plantData) => {
    try {
      console.log('Plant data received in handleAddPlant:', plantData);
      
      // Prepare data for backend with correct field names
      const backendPlantData = {
        name: plantData.plantName || plantData.name,
        description: plantData.description,
        price: parseFloat(plantData.price),
        images: plantData.images || [],
        category: plantData.category,
        rating: parseFloat(plantData.rating) || 0,
        stockQuantity: parseInt(plantData.stockQuantity) || 0,
        care: {
          water: plantData.wateringSchedule || plantData.care?.water,
          light: plantData.lightRequirements || plantData.care?.light,
          difficulty: plantData.careDifficulty || plantData.care?.difficulty
        },
        popular: plantData.isPopular || plantData.popular || false
      };
      
      console.log('Backend plant data:', backendPlantData);
      
      // Try to save to backend first
      try {
        const response = await fetch("http://localhost:5000/api/plant/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(backendPlantData),
        });
        
        if (response.ok) {
          const newPlant = await response.json();
          console.log('Plant added to backend:', newPlant);
          
          // Update local state with the plant from backend
          const updatedPlants = [...plants, newPlant.plant || newPlant];
          setPlantsState(updatedPlants);
          localStorage.setItem('plants', JSON.stringify(updatedPlants));
          setShowAddPlant(false);
          setForceUpdate(prev => prev + 1);
          return;
        } else {
          console.error('Failed to add plant to backend');
        }
      } catch (error) {
        console.error('Error adding plant to backend:', error);
      }
      
      // Fallback to local storage if backend fails
      const newPlant = {
        ...backendPlantData,
        id: Date.now(),
        dateAdded: new Date().toISOString()
      }
      
      console.log('New plant object (local):', newPlant);
      
      const updatedPlants = [...plants, newPlant]
      setPlantsState(updatedPlants)
      localStorage.setItem('plants', JSON.stringify(updatedPlants))
      setShowAddPlant(false)
      setForceUpdate(prev => prev + 1);
    } catch (error) {
      console.error('Error adding plant:', error)
      alert('Failed to add plant. Please try again.')
    }
  }

  // Handle editing plant
  const handleEditPlant = (plant) => {
    // Transform backend plant data to frontend format if needed
    const frontendPlant = {
      ...plant,
      plantName: plant.name,
      wateringSchedule: plant.care?.water,
      lightRequirements: plant.care?.light,
      careDifficulty: plant.care?.difficulty,
      isPopular: plant.popular
    };
    
    setEditingPlant(frontendPlant)
    setShowAddPlant(true)
  }

  // Handle updating plant - FIXED: Use the actual stockQuantity from form data
  const handleUpdatePlant = async (plantData) => {
    try {
      console.log('Plant data received in handleUpdatePlant:', plantData);
      
      // Prepare data for backend with correct field names
      const backendPlantData = {
        name: plantData.plantName || plantData.name,
        description: plantData.description,
        price: parseFloat(plantData.price),
        images: plantData.images || [],
        category: plantData.category,
        rating: parseFloat(plantData.rating) || 0,
        stockQuantity: parseInt(plantData.stockQuantity) || 0,
        care: {
          water: plantData.wateringSchedule || plantData.care?.water,
          light: plantData.lightRequirements || plantData.care?.light,
          difficulty: plantData.careDifficulty || plantData.care?.difficulty
        },
        popular: plantData.isPopular || plantData.popular || false
      };
      
      // If we have a backend ID, update via API
      if (editingPlant._id) {
        setLoading(true);
        try {
          const response = await fetch(`http://localhost:5000/api/plant/update/${editingPlant._id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(backendPlantData),
          });

          if (!response.ok) {
            throw new Error("Failed to update plant on server");
          }

          const updatedPlant = await response.json();
          console.log("Plant updated on server:", updatedPlant);
          
          const updatedPlants = plants.map(plant =>
            plant._id === editingPlant._id 
              ? { ...updatedPlant.plant || updatedPlant } 
              : plant
          );
          
          setPlantsState(updatedPlants);
          localStorage.setItem('plants', JSON.stringify(updatedPlants));
          setShowAddPlant(false);
          setEditingPlant(null);
          setForceUpdate(prev => prev + 1);
          return;
        } catch (error) {
          console.error("Error updating plant on server:", error);
        }
      }
      
      // Local update
      const updatedPlants = plants.map(plant =>
        (plant.id === editingPlant.id || plant._id === editingPlant._id) 
          ? { 
              ...backendPlantData, 
              id: editingPlant.id || plant.id,
              _id: editingPlant._id || plant._id,
              dateAdded: plant.dateAdded || new Date().toISOString()
            }
          : plant
      );
      
      console.log('Updated plants:', updatedPlants);
      
      setPlantsState(updatedPlants);
      localStorage.setItem('plants', JSON.stringify(updatedPlants));
      setShowAddPlant(false);
      setEditingPlant(null);
      setForceUpdate(prev => prev + 1);
    } catch (error) {
      console.error('Error updating plant:', error);
      alert('Failed to update plant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlant = async (plantId) => {
  if (!plantId) return alert("Invalid plant ID");

  // Get token from localStorage or your auth context
  const token = localStorage.getItem('adminToken'); // or your token storage method
  
  if (!token) {
    alert("Please login again");
    // Redirect to login
    return;
  }

  if (window.confirm("Are you sure you want to delete this plant?")) {
    try {
      const response = await fetch(`http://localhost:5000/api/plant/delete/${plantId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete plant from server");
      }

      const data = await response.json();
      console.log(data.message);

      const updatedPlants = plants.filter((plant) => (plant._id || plant.id) !== plantId);
      setPlantsState(updatedPlants);
      localStorage.setItem("plants", JSON.stringify(updatedPlants));
      setForceUpdate(prev => prev + 1);

      alert("Plant deleted successfully!");
    } catch (error) {
      console.error("Error deleting plant:", error);
      alert("Failed to delete plant. Please try again.");
    }
  }
};

  // Function to delete a user
  const handleDeleteUser = async (userId) => {
    if (!userId) return alert("Invalid user ID");

    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete user from server");
        }

        setUsers(users.filter(user => user._id !== userId));
        alert("User deleted successfully!");
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user. Please try again.");
      }
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setShowAddPlant(false)
    setEditingPlant(null)
  }

  const navItems = [
    { id: "dashboard", icon: <LayoutDashboard />, label: "Dashboard" },
    { id: "users", icon: <Users />, label: "Users" },
    { id: "products", icon: <Leaf />, label: "Plants" },
  ]

  // Dashboard Mock Data
  const stats = [
    { 
      id: 1, 
      label: "Total Users", 
      value: users.length.toString(), 
      icon: <Users />, 
      color: "green",
      trend: "+12%",
      subtitle: "Active customers"
    },
    { 
      id: 2, 
      label: "Plants in Stock", 
      value: plants.reduce((total, plant) => total + (plant.stockQuantity || 0), 0).toString(), 
      icon: <Leaf />, 
      color: "emerald",
      trend: plants.length > 10 ? "+3%" : "-3%",
      subtitle: "Total inventory"
    },
    { 
      id: 3, 
      label: "Revenue (Month)", 
      value: "Rs.56,789", 
      icon: <DollarSign />, 
      color: "blue",
      trend: "+15%",
      subtitle: "Monthly earnings"
    },
    { 
      id: 4, 
      label: "Orders Today", 
      value: "18", 
      icon: <ShoppingCart />, 
      color: "purple",
      trend: "+8%",
      subtitle: "Daily orders"
    },
  ]

  // Get low stock products from dynamic plants data
  const lowStockProducts = plants.filter(plant => 
    (plant.stockQuantity || 0) <= 10 && (plant.stockQuantity || 0) > 0
  ).slice(0, 4)

  // Get top selling plants
  const topSellingPlants = plants.filter(plant => plant.popular).slice(0, 3)

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPlants = plants.filter(plant => 
    plant.name && plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plant.category && plant.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get category display name
  const getCategoryDisplayName = (category) => {
    const categoryMap = {
      'indoor': 'Indoor Plants',
      'outdoor': 'Outdoor Plants',
      'succulents': 'Succulents',
      'flowering': 'Flowering Plants',
      'herbs': 'Herbs',
      'trees': 'Trees'
    }
    return categoryMap[category] || category
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="admin-dashboard-content">
            {/* Enhanced Stats Grid */}
            <div className="admin-stats-grid enhanced">
              {stats.map((stat) => (
                <div key={stat.id} className={`admin-stat-card enhanced admin-stat-${stat.color}`}>
                  <div className="admin-stat-header">
                    <div className="admin-stat-icon-wrapper enhanced">{stat.icon}</div>
                    <div className="admin-stat-trend enhanced">
                      {stat.trend.startsWith('+') ? 
                        <TrendingUp size={16} className="admin-trend-up" /> : 
                        <TrendingDown size={16} className="admin-trend-down" />
                      }
                      <span className={stat.trend.startsWith('+') ? 'admin-trend-up' : 'admin-trend-down'}>
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                  <div className="admin-stat-content">
                    <div className="admin-stat-value enhanced">{stat.value}</div>
                    <div className="admin-stat-label enhanced">{stat.label}</div>
                    <div className="admin-stat-subtitle">{stat.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Dashboard Grid */}
            <div className="admin-dashboard-grid enhanced">
              {/* Performance Overview */}
              <div className="admin-section-card performance-overview">
                <div className="admin-card-header">
                  <h3 className="admin-card-title">
                    <Activity size={20} />
                    Performance Overview
                  </h3>
                  <button className="admin-view-all-btn">
                    <BarChart size={16} /> View Analytics
                  </button>
                </div>
                <div className="admin-performance-metrics">
                  <div className="admin-metric-item">
                    <div className="admin-metric-icon green">
                      <Target size={18} />
                    </div>
                    <div className="admin-metric-content">
                      <div className="admin-metric-value">94%</div>
                      <div className="admin-metric-label">Customer Satisfaction</div>
                    </div>
                  </div>
                  <div className="admin-metric-item">
                    <div className="admin-metric-icon blue">
                      <Package size={18} />
                    </div>
                    <div className="admin-metric-content">
                      <div className="admin-metric-value">87</div>
                      <div className="admin-metric-label">Products Sold Today</div>
                    </div>
                  </div>
                  <div className="admin-metric-item">
                    <div className="admin-metric-icon purple">
                      <Clock size={18} />
                    </div>
                    <div className="admin-metric-content">
                      <div className="admin-metric-value">2.4h</div>
                      <div className="admin-metric-label">Avg. Response Time</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="admin-section-card recent-activity">
                <div className="admin-card-header">
                  <h3 className="admin-card-title">
                    <Bell size={20} />
                    Recent Activity
                  </h3>
                  <button className="admin-view-all-btn">View All</button>
                </div>
                <div className="admin-recent-activity enhanced">
                  <div className="admin-activity-item enhanced">
                    <div className="admin-activity-icon success">
                      <Users size={18} />
                    </div>
                    <div className="admin-activity-content">
                      <div className="admin-activity-title">5 new users registered</div>
                      <div className="admin-activity-desc">New customers joined today</div>
                      <span className="admin-activity-time">2 hours ago</span>
                    </div>
                  </div>
                  <div className="admin-activity-item enhanced">
                    <div className="admin-activity-icon info">
                      <Leaf size={18} />
                    </div>
                    <div className="admin-activity-content">
                      <div className="admin-activity-title">Fiddle Leaf Fig added</div>
                      <div className="admin-activity-desc">New plant added to catalog</div>
                      <span className="admin-activity-time">5 hours ago</span>
                    </div>
                  </div>
                  <div className="admin-activity-item enhanced">
                    <div className="admin-activity-icon warning">
                      <ShoppingCart size={18} />
                    </div>
                    <div className="admin-activity-content">
                      <div className="admin-activity-title">12 plants sold</div>
                      <div className="admin-activity-desc">Sales in the last 24 hours</div>
                      <span className="admin-activity-time">1 day ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Selling Plants */}
              <div className="admin-section-card top-selling">
                <div className="admin-card-header">
                  <h3 className="admin-card-title">
                    <Star size={20} />
                    Top Selling Plants
                  </h3>
                  <button className="admin-view-all-btn" onClick={() => setActiveSection("products")}>
                    View All Plants
                  </button>
                </div>
                <div className="admin-top-selling-list">
                  {topSellingPlants.length > 0 ? (
                    topSellingPlants.map((plant, index) => (
                      <div key={plant.id || plant._id} className="admin-top-selling-item">
                        <div className="admin-plant-rank">#{index + 1}</div>
                        <div className="admin-plant-image-small">
                          {getPlantImageUrl(plant) ? (
                            <img src={getPlantImageUrl(plant)} alt={plant.name} />
                          ) : (
                            <div className="admin-no-image-small">
                              <Leaf size={16} />
                            </div>
                          )}
                        </div>
                        <div className="admin-plant-details">
                          <div className="admin-plant-name">{plant.name}</div>
                          <div className="admin-plant-category">{getCategoryDisplayName(plant.category)}</div>
                        </div>
                        <div className="admin-plant-stats">
                          <div className="admin-plant-price">Rs{parseFloat(plant.price).toFixed(2)}</div>
                          <div className="admin-plant-rating">
                            <Star size={12} className="admin-star-filled" />
                            {plant.rating || '0'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="admin-no-data">
                      <Leaf size={24} />
                      <p>No popular plants yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Low Stock Alert */}
              <div className="admin-section-card low-stock-alert">
                <div className="admin-card-header">
                  <h3 className="admin-card-title">
                    <AlertCircle size={20} className="admin-alert-icon" />
                    Low Stock Alert
                  </h3>
                  <button className="admin-view-all-btn" onClick={() => setActiveSection("products")}>
                    Manage Inventory
                  </button>
                </div>
                <div className="admin-low-stock-list enhanced">
                  {lowStockProducts.length > 0 ? (
                    lowStockProducts.map((plant) => (
                      <div key={plant.id || plant._id} className="admin-low-stock-item enhanced">
                        <div className="admin-product-info">
                          <div className="admin-product-details">
                            <div className="admin-product-name">{plant.name}</div>
                            <div className="admin-product-category">{getCategoryDisplayName(plant.category)}</div>
                          </div>
                          <div className="admin-product-price">Rs{parseFloat(plant.price).toFixed(2)}</div>
                        </div>
                        <div className="admin-stock-info">
                          <span className={`admin-stock-count ${(plant.stockQuantity || 0) <= 5 ? 'critical' : 'low'}`}>
                            {plant.stockQuantity || 0} left
                          </span>
                          <button className="admin-restock-btn" title="Edit Plant" onClick={() => handleEditPlant(plant)}>
                            <Edit size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="admin-no-low-stock">
                      <CheckCircle size={24} className="admin-success-icon" />
                      <p>All plants are well stocked! 🌱</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="admin-section-card quick-actions-card">
              <h3 className="admin-card-title">Quick Actions</h3>
              <div className="admin-quick-actions-grid enhanced">
                <button className="admin-quick-action-btn enhanced primary" onClick={handleAddProduct}>
                  <Plus size={20} /> 
                  <div className="admin-action-content">
                    <span>Add New Plant</span>
                    <small>Expand your catalog</small>
                  </div>
                </button>
                <button className="admin-quick-action-btn enhanced secondary" onClick={() => setActiveSection("users")}>
                  <Users size={20} /> 
                  <div className="admin-action-content">
                    <span>Manage Users</span>
                    <small>View all customers</small>
                  </div>
                </button>
                <button className="admin-quick-action-btn enhanced tertiary">
                  <Package size={20} /> 
                  <div className="admin-action-content">
                    <span>Update Inventory</span>
                    <small>Manage stock levels</small>
                  </div>
                </button>
                <button className="admin-quick-action-btn enhanced quaternary">
                  <BarChart size={20} /> 
                  <div className="admin-action-content">
                    <span>View Reports</span>
                    <small>Analytics & insights</small>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )
      case "users":
        return (
          <div className="admin-users-content">
            <div className="admin-section-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">User Management</h3>
                <div className="admin-header-actions">
                  <button className="admin-secondary-btn">
                    <Download size={18} /> Export
                  </button>
                  <button className="admin-add-button" onClick={fetchUsers}>
                    <RefreshCw size={18} /> Refresh
                  </button>
                </div>
              </div>
              <div className="admin-table-controls">
                <div className="admin-search-input-wrapper">
                  <Search size={18} />
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    className="admin-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="admin-filter-controls">
                  <button className="admin-filter-btn">
                    <Filter size={18} /> Filter
                  </button>
                </div>
              </div>
              
              {loading ? (
                <div className="admin-loading">
                  <p>Loading users...</p>
                </div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Join Date</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user._id}>
                          <td>
                            <div className="admin-user-cell">
                              <div className="admin-user-avatar">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div className="admin-user-info">
                                <div className="admin-user-name">{user.name || 'Unknown User'}</div>
                                <div className="admin-user-email">{user.email || 'No email'}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`admin-role-badge admin-role-${user.role ? user.role.toLowerCase() : 'customer'}`}>
                              {user.role || 'Customer'}
                            </span>
                          </td>
                          <td>
                            <span className={`admin-status-badge admin-status-${user.isActive !== false ? 'active' : 'inactive'}`}>
                              {user.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>{formatDate(user.createdAt)}</td>
                          <td className="admin-last-login">
                            {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                          </td>
                          <td>
                            <div className="admin-table-actions">
                              <button 
                                type="button" 
                                className="admin-action-btn admin-delete-btn" 
                                title="Delete"
                                onClick={() => handleDeleteUser(user._id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )
      case "products":
        return (
          <div className="admin-products-content">
            <div className="admin-section-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">Plant Catalog Management</h3>
                <div className="admin-header-actions">
                  <button className="admin-secondary-btn">
                    <Download size={18} /> Export
                  </button>
                  <button className="admin-add-button" onClick={handleAddProduct}>
                    <Plus size={18} /> Add New Plant
                  </button>
                  <button className="admin-add-button" onClick={fetchPlants}>
                    <RefreshCw size={18} /> Refresh
                  </button>
                </div>
              </div>
              <div className="admin-table-controls">
                <div className="admin-search-input-wrapper">
                  <Search size={18} />
                  <input 
                    type="text" 
                    placeholder="Search plants..." 
                    className="admin-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="admin-filter-controls">
                  <button className="admin-filter-btn">
                    <Filter size={18} /> Filter
                  </button>
                </div>
              </div>
              <div className="admin-table-container">
                {loading ? (
                  <div className="admin-loading">
                    <p>Loading plants...</p>
                  </div>
                ) : filteredPlants.length === 0 ? (
                  <div className="admin-empty-state">
                    <Leaf size={48} className="admin-empty-icon" />
                    <h3>No plants found</h3>
                    <p>
                      {searchTerm 
                        ? 'Try adjusting your search term'
                        : 'Start by adding your first plant to the catalog'
                      }
                    </p>
                    {!searchTerm && (
                      <button className="admin-add-button" onClick={handleAddProduct}>
                        <Plus size={18} /> Add New Plant
                      </button>
                    )}
                  </div>
                ) : (
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Rating</th>
                        <th>Stock</th>
                        <th>Care Level</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlants.map((plant) => {
                        const imageUrl = getPlantImageUrl(plant);
                        
                        return (
                          <tr key={plant.id || plant._id}>
                            <td>
                              <div className="admin-plant-image">
                                {imageUrl ? (
                                  <img 
                                    src={imageUrl} 
                                    alt={plant.name}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : (
                                  <div className="admin-no-image">
                                    <Leaf size={20} />
                                  </div>
                                )}
                                {imageUrl && (
                                  <div className="admin-no-image" style={{ display: 'none' }}>
                                    <Leaf size={20} />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="admin-plant-info">
                                <div className="admin-plant-name">{plant.name || 'No Name'}</div>
                                {plant.popular && <span className="admin-popular-badge">Popular</span>}
                              </div>
                            </td>
                            <td>
                              <span className="admin-category-badge">
                                {getCategoryDisplayName(plant.category)}
                              </span>
                            </td>
                            <td className="admin-product-price">Rs{parseFloat(plant.price).toFixed(2)}</td>
                            <td>
                              <div className="admin-rating">
                                <Star size={14} className="admin-star-filled" />
                                <span>{plant.rating || '0'}</span>
                              </div>
                            </td>
                            <td className="admin-product-stock">{plant.stockQuantity || 0}</td>
                            <td>
                              <span className={`admin-difficulty-badge admin-difficulty-${plant.care?.difficulty?.toLowerCase() || 'easy'}`}>
                                {plant.care?.difficulty || 'Easy'}
                              </span>
                            </td>
                            <td>
                              <div className="admin-table-actions">
                                <button 
                                  type="button" 
                                  className="admin-action-btn admin-view-btn" 
                                  title="View"
                                >
                                  <Eye size={16} />
                                </button>
                                <button 
                                  type="button" 
                                  className="admin-action-btn admin-edit-btn" 
                                  title="Edit"
                                  onClick={() => handleEditPlant(plant)}
                                >
                                  <Edit size={16} />
                                </button>
                                <button 
                                  type="button" 
                                  className="admin-action-btn admin-delete-btn" 
                                  title="Delete"
                                  onClick={() => handleDeletePlant(plant._id || plant.id)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="admin-dashboard-content">
            <div className="admin-stats-grid">
              {stats.map((stat) => (
                <div key={stat.id} className={`admin-stat-card admin-stat-${stat.color}`}>
                  <div className="admin-stat-icon-wrapper">{stat.icon}</div>
                  <div className="admin-stat-info">
                    <div className="admin-stat-value">{stat.value}</div>
                    <div className="admin-stat-label">{stat.label}</div>
                    <div className="admin-stat-trend">
                      {stat.trend.startsWith('+') ? 
                        <TrendingUp size={14} className="admin-trend-up" /> : 
                        <TrendingDown size={14} className="admin-trend-down" />
                      }
                      <span className={stat.trend.startsWith('+') ? 'admin-trend-up' : 'admin-trend-down'}>
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="admin-workspace">
      <div className="admin-main-layout">
        <aside className="admin-sidebar">
          <nav className="admin-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`admin-nav-item ${activeSection === item.id ? "active" : ""}`}
                onClick={() => setActiveSection(item.id)}
                aria-current={activeSection === item.id ? "page" : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="admin-content-area">
          <div className="admin-content-header">
            <h2 className="admin-section-heading">{navItems.find((item) => item.id === activeSection)?.label}</h2>
            <p className="admin-section-description">
              {activeSection === "dashboard" && "Overview of your GreenScape operations and key metrics."}
              {activeSection === "users" && "Manage all registered users, roles, and permissions."}
              {activeSection === "products" && "Manage your plant catalog, inventory, and product details."}
            </p>
          </div>

          {renderContent()}
        </main>
      </div>

      {showAddPlant && (
        <AddPlant 
          onClose={handleCloseModal}
          onSave={editingPlant ? handleUpdatePlant : handleAddPlant}
          initialData={editingPlant}
          isEditing={!!editingPlant}
        />
      )}
    </div>
  )
}