import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Facebook,
  Chrome,
  Apple,
  ArrowRight,
  X,
} from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@plant.com";
  const IS_DEVELOPMENT = import.meta.env.NODE_ENV === 'development' || import.meta.env.VITE_ENABLE_TEST_LOGIN === 'true';

  // Form validation
  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) newErrors.email = "Email address is required";
    else if (!emailRegex.test(email))
      newErrors.email = "Please enter a valid email address";

    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Test login function
  const handleTestLogin = () => {
    setLoginSuccess(true);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("token", "test-token");
    localStorage.setItem("role", "user");
    window.dispatchEvent(new Event('loginSuccess'));
    
    setTimeout(() => {
      navigate("/");
    }, 1500);
  };

  // Regular login function
  const handleRegularLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      let endpoint = "/api/user/login";
      let body = { email: email.trim().toLowerCase(), password };

      // Admin login
      if (email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        endpoint = "/api/user/admin/login";
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (!res.ok || !data.success) {
        setAuthError(data.message || "Invalid email or password");
      } else {
        setLoginSuccess(true);
        setEmail("");
        setPassword("");
        setErrors({});

        // Save general token
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role || "user");
        localStorage.setItem("isLoggedIn", "true");
        
        // Store user data if available
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        // Trigger navbar update
        window.dispatchEvent(new Event('loginSuccess'));

        // Save admin token if role is admin
        if (data.role === "admin") {
          localStorage.setItem("adminToken", data.token);
          
          setTimeout(() => {
            navigate("/admin");
          }, 1500);
        } else {
          setTimeout(() => {
            navigate("/");
          }, 1500);
        }
      }
    } catch (error) {
      console.error(error);
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle submit with test login integration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setLoginSuccess(false);

    // Check if this should be a test login
    // Trigger test login if:
    // 1. Development mode AND empty fields
    // 2. OR specific test credentials are used
    const isTestLogin = (
      IS_DEVELOPMENT && 
      (!email.trim() && !password)
    ) || (
      email.toLowerCase() === 'test@greenscape.com' && 
      password === 'test123'
    );

    if (isTestLogin) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        handleTestLogin();
      }, 800); // Small delay to show loading state
    } else {
      await handleRegularLogin();
    }
  };

  // Auto-dismiss error after 5s
  useEffect(() => {
    if (authError) {
      const timer = setTimeout(() => setAuthError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [authError]);

  // Auto-dismiss success message and navigate
  useEffect(() => {
    if (loginSuccess) {
      const timer = setTimeout(() => setLoginSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [loginSuccess]);

  // Social login button component
  const SocialButton = ({ icon: Icon, text, className }) => (
    <button type="button" className={`login-social-button ${className}`}>
      <Icon size={20} />
      {text}
    </button>
  );

  // Determine button text and style
  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 className="login-spinner" /> 
          {(!email.trim() && !password && IS_DEVELOPMENT) ? "Test Login..." : "Logging in..."}
        </>
      );
    }
    
    if (!email.trim() && !password && IS_DEVELOPMENT) {
      return (
        <>
          🚀 Test Login <ArrowRight size={20} />
        </>
      );
    }
    
    return (
      <>
        Login <ArrowRight size={20} />
      </>
    );
  };

  return (
    <div className="login-workspace">
      <div className="login-background-elements">
        <div className="login-leaf login-leaf-1"></div>
        <div className="login-leaf login-leaf-2"></div>
        <div className="login-leaf login-leaf-3"></div>
        <div className="login-leaf login-leaf-4"></div>
      </div>

      <div className="login-card-wrapper">
        <div className="login-card" role="main">
          {/* Header */}
          <div className="login-header">
            <h1 className="login-title">
              Welcome to <span className="login-highlight">GreenScape</span> 🌱
            </h1>
            <p className="login-subtitle">Grow your garden, grow your life.</p>
          </div>

          {/* Messages */}
          {authError && (
            <div className="login-message login-error-message">
              <AlertCircle className="login-message-icon" />
              <span>{authError}</span>
              <button
                onClick={() => setAuthError("")}
                className="login-message-close"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {loginSuccess && (
            <div className="login-message login-success-message">
              <CheckCircle className="login-message-icon" />
              <span>Login successful! Welcome back to GreenScape!</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} aria-label="Login form" className="login-form">
            {/* Email */}
            <div className="login-input-group">
              <label htmlFor="email" className="login-label">
                <Mail className="login-label-icon" />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                }}
                className={`login-input ${errors.email ? "login-input-error" : ""}`}
                placeholder={IS_DEVELOPMENT ? "john.doe@example.com (or leave empty for test login)" : "john.doe@example.com"}
                autoComplete="email"
              />
              {errors.email && (
                <span className="login-error">
                  <AlertCircle className="login-error-icon" />
                  {errors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="login-input-group">
              <label htmlFor="password" className="login-label">
                <Lock className="login-label-icon" />
                Password
              </label>
              <div className="login-password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  className={`login-input ${errors.password ? "login-input-error" : ""}`}
                  placeholder={IS_DEVELOPMENT ? "Enter your password (or leave empty for test login)" : "Enter your password"}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="login-error">
                  <AlertCircle className="login-error-icon" />
                  {errors.password}
                </span>
              )}
            </div>

            {/* Development hint */}
            {IS_DEVELOPMENT && !email.trim() && !password && (
              <div className="login-dev-hint">
                <p>💡 <strong>Development Mode:</strong> Leave fields empty for instant test login, or use <code>test@greenscape.com / test123</code></p>
              </div>
            )}

            {/* Options */}
            <div className="login-options">
              <label className="login-checkbox-group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="login-checkbox-input"
                />
                <span className="login-checkbox-custom">
                  <CheckCircle size={16} className="login-checkbox-icon" />
                </span>
                Remember me
              </label>
              <label className="login-checkbox-group">
                <input
                  type="checkbox"
                  checked={subscribeNewsletter}
                  onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                  className="login-checkbox-input"
                />
                <span className="login-checkbox-custom">
                  <CheckCircle size={16} className="login-checkbox-icon" />
                </span>
                Subscribe to newsletter
              </label>
              <a href="#" className="login-forgot-password">
                Forgot password?
              </a>
            </div>

            {/* Submit Button with Dynamic Content */}
            <button 
              type="submit" 
              className={`login-submit-button ${(!email.trim() && !password && IS_DEVELOPMENT) ? 'login-test-mode' : ''}`}
              disabled={loading}
            >
              {getButtonContent()}
            </button>
          </form>

          {/* Divider */}
          <div className="login-divider">
            <span>OR</span>
          </div>

          {/* Social login */}
          <div className="login-social-login">
            <SocialButton icon={Facebook} text="Login with Facebook" className="facebook" />
            <SocialButton icon={Chrome} text="Login with Google" className="google" />
            <SocialButton icon={Apple} text="Login with Apple" className="apple" />
          </div>

          {/* Sign Up */}
          <p className="login-signup-link">
            New to GreenScape? <a href="/signup">Sign Up</a>
          </p>
        </div>

        {/* Right-side image */}
        <div className="login-image-section">
          <img
            src="/login-background.webp"
            alt="Leafy background"
            className="login-background-image"
            loading="lazy"
          />
          <div className="login-image-overlay"></div>
          <div className="login-image-content">
            <h2>Your Green Journey Starts Here</h2>
            <p>
              Access personalized plant care, garden planning tools, and a vibrant community.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;