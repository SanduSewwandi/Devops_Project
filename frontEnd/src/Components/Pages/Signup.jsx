import { useState } from "react"
import { useNavigate } from "react-router-dom" // Add this import
import './Signup.css';
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Facebook,
  Chrome,
  Apple,
  ArrowRight,
} from "lucide-react"

const Signup = () => {
  const navigate = useNavigate() // Add this hook
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    newsletter: true,
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0) 
  const [loading, setLoading] = useState(false)
  const [signupError, setSignupError] = useState("")
  const [signupSuccess, setSignupSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }

    if (name === "password") {
      checkPasswordStrength(value)
    }
  }

  const checkPasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.match(/[A-Z]/) && password.match(/[a-z]/)) strength++
    if (password.match(/[0-9]/) && password.match(/[^A-Za-z0-9]/)) strength++
    setPasswordStrength(strength)
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required"
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    } else if (passwordStrength < 2) {
      newErrors.password = "Password is too weak. Use uppercase, numbers, and symbols."
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSignupError("")
    setSignupSuccess(false)

    if (validate()) {
      setLoading(true)
      try {
        const res = await fetch("http://localhost:5000/api/user/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        })

        const data = await res.json()
        console.log("Response:", data)

        if (!res.ok) {
          setSignupError(data.message || "Signup failed. Please try again.")
        } else {
          setSignupSuccess(true)
          setFormData({
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            newsletter: true,
          })
          setPasswordStrength(0)
          setErrors({})
          
          // Navigate to login page after successful signup
          setTimeout(() => {
            navigate("/login")
          }, 1500) // Show success message for 1.5 seconds before navigating
        }
      } catch (error) {
        setSignupError("An unexpected error occurred. Please try again.")
      } finally {
        setLoading(false)
      }
    }
  }

  const getStrengthText = () => {
    if (passwordStrength === 0) return "Weak"
    if (passwordStrength === 1) return "Medium"
    if (passwordStrength === 2) return "Strong"
    return ""
  }

  const getStrengthClass = () => {
    if (passwordStrength === 0) return "weak"
    if (passwordStrength === 1) return "medium"
    if (passwordStrength === 2) return "strong"
    return ""
  }

  return (
    <div className="signup-workspace">
      <div className="signup-background-elements">
        <div className="signup-leaf signup-leaf-1"></div>
        <div className="signup-leaf signup-leaf-2"></div>
        <div className="signup-leaf signup-leaf-3"></div>
        <div className="signup-leaf signup-leaf-4"></div>
      </div>

      <div className="signup-card" role="main">
        <div className="signup-header">
          <h1 className="signup-title">
            Create Your <span className="signup-highlight">GreenScape</span> Account 🌿
          </h1>
          <p className="signup-subtitle">Join our community of plant lovers and start growing today.</p>
        </div>

        {signupError && (
          <div className="signup-message signup-error-message">
            <AlertCircle className="signup-message-icon" />
            <span>{signupError}</span>
          </div>
        )}
        {signupSuccess && (
          <div className="signup-message signup-success-message">
            <CheckCircle className="signup-message-icon" />
            <span>Signup successful! Redirecting to login page...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} aria-label="Signup form" className="signup-form">
          {/* Full Name */}
          <div className="signup-input-group">
            <label htmlFor="name" className="signup-label">
              <User className="signup-label-icon" />
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`signup-input ${errors.name ? "signup-input-error" : ""}`}
              placeholder="John Doe"
              required
            />
            {errors.name && (
              <span className="signup-error">
                <AlertCircle className="signup-error-icon" />
                {errors.name}
              </span>
            )}
          </div>

          {/* Email */}
          <div className="signup-input-group">
            <label htmlFor="email" className="signup-label">
              <Mail className="signup-label-icon" />
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`signup-input ${errors.email ? "signup-input-error" : ""}`}
              placeholder="john.doe@example.com"
              required
            />
            {errors.email && (
              <span className="signup-error">
                <AlertCircle className="signup-error-icon" />
                {errors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="signup-input-group">
            <label htmlFor="password" className="signup-label">
              <Lock className="signup-label-icon" />
              Password
            </label>
            <div className="signup-password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`signup-input ${errors.password ? "signup-input-error" : ""}`}
                placeholder="Minimum 8 characters"
                required
              />
              <button
                type="button"
                className="signup-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formData.password && (
              <div className="signup-password-strength-indicator">
                <div
                  className={`signup-strength-bar ${getStrengthClass()}`}
                  style={{ width: `${passwordStrength * 33.33}%` }}
                ></div>
                <span className={`signup-strength-text ${getStrengthClass()}`}>Strength: {getStrengthText()}</span>
              </div>
            )}
            {errors.password && (
              <span className="signup-error">
                <AlertCircle className="signup-error-icon" />
                {errors.password}
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="signup-input-group">
            <label htmlFor="confirmPassword" className="signup-label">
              <Lock className="signup-label-icon" />
              Confirm Password
            </label>
            <div className="signup-password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`signup-input ${errors.confirmPassword ? "signup-input-error" : ""}`}
                placeholder="Re-enter your password"
                required
              />
              <button
                type="button"
                className="signup-toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="signup-error">
                <AlertCircle className="signup-error-icon" />
                {errors.confirmPassword}
              </span>
            )}
          </div>

          <label className="signup-checkbox-group">
            <input
              type="checkbox"
              name="newsletter"
              checked={formData.newsletter}
              onChange={handleChange}
              className="signup-checkbox-input"
            />
            <span className="signup-checkbox-custom">
              <CheckCircle size={16} className="signup-checkbox-icon" />
            </span>
            Subscribe to GreenScape tips & updates
          </label>

          <button type="submit" className="signup-submit-button" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="signup-spinner" />
                Creating account...
              </>
            ) : (
              <>
                Sign Up <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="signup-divider">
          <span>OR</span>
        </div>

        <div className="signup-social-login">
          <button className="signup-social-button facebook">
            <Facebook size={20} />
            Sign up with Facebook
          </button>
          <button className="signup-social-button google">
            <Chrome size={20} />
            Sign up with Google
          </button>
          <button className="signup-social-button apple">
            <Apple size={20} />
            Sign up with Apple
          </button>
        </div>

        <p className="signup-login-link">
          Already have an account? <a href="/login">Log In</a>
        </p>
      </div>
    </div>
  )
}

export default Signup