import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./AdminNavbar.css";

function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Load admin data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setAdminData(user);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Function to check if the current path matches the link
  const isActiveLink = (path) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  // Handle logout
  const handleLogout = () => {
    // Clear all admin-related data
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("isLoggedIn");
    
    // Dispatch logout event for other components
    window.dispatchEvent(new Event('logout'));
    
    // Redirect to login page
    navigate("/login");
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // You can implement search functionality here
      console.log("Searching for:", searchQuery);
      // For now, just clear the search
      setSearchQuery("");
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.admin-profile')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <header className="admin-navbar">
      {/* Top section with logo, search, and user profile */}
      <div className="admin-navbar-top">
        <div className="admin-logo">
          <img src="/src/assets/growing-plant.png" />
          <h1>GreenScape Admin</h1>
        </div>
        <div className="admin-user-section">
          <div className="notification-icon">
            <i className="fa fa-bell"></i>
            <span className="notification-badge">3</span>
          </div>
          
          {/* Direct logout button - more prominent */}
          <button 
            className="admin-logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            <i className="fa fa-sign-out"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="admin-navbar-links">
        <Link
          to="/admin"
          className={isActiveLink("/admin") ? "active" : ""}
        >
          <i className="fa fa-dashboard"></i>
          <span>Dashboard</span>
        </Link>
        <Link
          to="/admin/add"
          className={isActiveLink("/admin/add") ? "active" : ""}
        >
          <i className="fa fa-plus"></i>
          <span>Add Plant</span>
        </Link>
        <Link
          to="/admin/manage"
          className={isActiveLink("/admin/manage") ? "active" : ""}
        >
          <i className="fa fa-cogs"></i>
          <span>Manage Plants</span>
        </Link>
      </nav>
    </header>
  );
}

export default AdminNavbar;