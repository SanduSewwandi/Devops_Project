import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check authentication status on component mount and location changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const authStatus = localStorage.getItem('isLoggedIn');
      setIsLoggedIn(authStatus === 'true');
    };
    
    checkAuthStatus();
    
    // Listen for storage changes (when other tabs/components update localStorage)
    window.addEventListener('storage', checkAuthStatus);
    
    // Listen for custom login events
    const handleLoginSuccess = () => {
      setIsLoggedIn(true);
    };
    
    window.addEventListener('loginSuccess', handleLoginSuccess);
    
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('loginSuccess', handleLoginSuccess);
    };
  }, [location.pathname]); // Also check on route changes

  // Function to check if the current path matches the link
  const isActiveLink = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // Page navigation mapping
  const pageRoutes = {
    'home': '/',
    'shop': '/shop',
    'design': '/design',
    'planner': '/planner',
    'about': '/about',
    'contact': '/contact',
    'login': '/login',
    'signup': '/signup'
  };

  // Handle search functionality
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      const route = pageRoutes[searchLower];
      
      if (route) {
        navigate(route);
        setSearchTerm("");
      } else {
        // If exact match not found, try partial matching
        const matchedPage = Object.keys(pageRoutes).find(page => 
          page.includes(searchLower) || searchLower.includes(page)
        );
        
        if (matchedPage) {
          navigate(pageRoutes[matchedPage]);
          setSearchTerm("");
        } else {
          alert(`Page "${searchTerm}" not found. Available pages: Home, Shop, Design, Planner, About, Contact`);
        }
      }
    }
  };

  // Handle logout
  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    
    // Update state immediately
    setIsLoggedIn(false);
    
    // Navigate to home page
    navigate('/');
    
    // Dispatch custom event for other components
    window.dispatchEvent(new Event('logoutSuccess'));
    
    // Show success message
    alert('You have been logged out successfully!');
  };

  return (
    <header className="navbar">
      {/* Top section with logo, search, and auth buttons */}
      <div className="navbar-top">
        <div className="logo">
          <img src="/src/assets/growing-plant.png" alt="GreenScape Logo" />
          <h1>GreenScape</h1>
        </div>

        <form className="search-box" onSubmit={handleSearch}>
          <input 
            type="text" 
            placeholder="Search pages (Home, Shop, Design, Planner, About, Contact)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">
            <i className="fa fa-search"></i>
          </button>
        </form>

        <div className="auth-buttons">
          {!isLoggedIn ? (
            <>
              <Link to="/signup" className="signup-btn">Sign Up</Link>
              <Link to="/login" className="login-btn">Log In</Link>
            </>
          ) : (
            <button onClick={handleLogout} className="logout-btn">
              <i className="fa fa-sign-out-alt"></i>
              Log Out
            </button>
          )}
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="navbar-links">
        <Link
          to="/"
          className={isActiveLink("/") ? "active" : ""}
        >
          Home
        </Link>
        <Link
          to="/shop"
          className={isActiveLink("/shop") ? "active" : ""}
        >
          Shop
        </Link>
        <Link
          to="/design"
          className={isActiveLink("/design") ? "active" : ""}
        >
          Design
        </Link>
        <Link
          to="/planner"
          className={isActiveLink("/planner") ? "active" : ""}
        >
          Planner
        </Link>
        <Link
          to="/about"
          className={isActiveLink("/about") ? "active" : ""}
        >
          About
        </Link>
        <Link
          to="/contact"
          className={isActiveLink("/contact") ? "active" : ""}
        >
          Contact
        </Link>
      </nav>
    </header>
  );
}

export default Navbar;