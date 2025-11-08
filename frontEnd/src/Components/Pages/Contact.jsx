import { useState } from "react"
import './Contact.css';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  User,
  MessageSquare,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Calendar,
  Headphones,
  Globe,
  Star,
  ArrowRight,
} from "lucide-react"

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    contactMethod: "email",
    urgency: "normal",
  })

  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("contact")

  const contactMethods = [
    {
      icon: <Mail className="contact-method-icon" />,
      title: "Email Us",
      description: "Get a response within 24 hours",
      value: "contact@greenscape.com",
      action: "Send Email",
      color: "blue",
    },
    {
      icon: <Phone className="contact-method-icon" />,
      title: "Call Us",
      description: "Mon-Fri, 9AM-6PM EST",
      value: "047 2256089",
      action: "Call Now",
      color: "green",
    },
    {
      icon: <MessageSquare className="contact-method-icon" />,
      title: "Live Chat",
      description: "Available during business hours",
      value: "Start Chat",
      action: "Chat Now",
      color: "purple",
    },
    {
      icon: <Calendar className="contact-method-icon" />,
      title: "Book Meeting",
      description: "Schedule a consultation",
      value: "Free 30-min session",
      action: "Book Now",
      color: "orange",
    },
  ]

  const officeLocations = [
    {
      name: "Main Office",
      address: "123 Garden Lane, Plant City, Green State 12345",
      phone: "+1 (555) 123-GROW",
      email: "main@greenscape.com",
      hours: "Mon-Fri: 9AM-6PM, Sat: 10AM-4PM",
      type: "Headquarters",
    },
    {
      name: "West Coast Branch",
      address: "456 Bloom Street, Flower City, CA 90210",
      phone: "+1 (555) 456-LEAF",
      email: "west@greenscape.com",
      hours: "Mon-Fri: 8AM-5PM, Sat: 9AM-3PM",
      type: "Branch Office",
    },
    {
      name: "East Coast Branch",
      address: "789 Sprout Avenue, Garden City, NY 10001",
      phone: "+1 (555) 789-SEED",
      email: "east@greenscape.com",
      hours: "Mon-Fri: 9AM-7PM, Sat: 10AM-5PM",
      type: "Branch Office",
    },
  ]

  const faqs = [
    {
      question: "How quickly do you respond to inquiries?",
      answer:
        "We typically respond to all inquiries within 24 hours during business days. Urgent matters are handled within 4 hours.",
    },
    {
      question: "Do you offer consultations?",
      answer:
        "Yes! We offer free 30-minute consultations for new customers. You can book one through our scheduling system or by calling us directly.",
    },
    {
      question: "What services do you provide?",
      answer:
        "We offer garden design, plant care guidance, landscaping consultations, and educational resources for gardeners of all levels.",
    },
    {
      question: "Can you help with plant identification?",
      answer:
        "Our expert botanists can help identify plants and provide care instructions. Just send us a clear photo along with your inquiry.",
    },
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (formData.phone && !/^[+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-$$$$]/g, ""))) {
      newErrors.phone = "Please enter a valid phone number"
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required"
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required"
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (validate()) {
      setIsSubmitting(true)

      // Simulate API call
      setTimeout(() => {
        console.log("Contact form submitted:", formData)
        setSubmitted(true)
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
          contactMethod: "email",
          urgency: "normal",
        })
        setErrors({})
        setIsSubmitting(false)

        // Hide success message after 5 seconds
        setTimeout(() => setSubmitted(false), 5000)
      }, 2000)
    }
  }

  return (
    <div className="contact-workspace">
      {/* Contact Hero Section */}
      <header className="contact-hero-section">
        <div className="contact-hero-background">
          <div className="contact-hero-pattern"></div>
        </div>

        <div className="contact-hero-content">
          <div className="contact-hero-badge">
            <Mail className="contact-badge-icon" />
            <span>Get In Touch</span>
          </div>

          <h1 className="contact-hero-title">
            Contact <span className="contact-hero-highlight">GreenScape</span>
            <span className="contact-hero-emoji">🌿</span>
          </h1>

          <p className="contact-hero-subtitle">
            We'd love to hear from you! Whether you have questions, need advice, or want to share your garden success
            story.
          </p>

          <div className="contact-hero-stats">
            <div className="contact-stat-item">
              <Clock className="contact-stat-icon" />
              <span>24hr Response</span>
            </div>
            <div className="contact-stat-item">
              <Headphones className="contact-stat-icon" />
              <span>Expert Support</span>
            </div>
            <div className="contact-stat-item">
              <Globe className="contact-stat-icon" />
              <span>Global Reach</span>
            </div>
          </div>
        </div>
      </header>

      {/* Contact Methods Section */}
      <section className="contact-methods-section">
        <div className="contact-container">
          <div className="contact-section-header">
            <h2 className="contact-section-title">Choose Your Preferred Contact Method</h2>
            <p className="contact-section-subtitle">We're here to help in whatever way works best for you</p>
          </div>

          <div className="contact-methods-grid">
            {contactMethods.map((method, index) => (
              <div key={method.title} className={`contact-method-card contact-method-${method.color}`}>
                <div className="contact-method-icon-wrapper">{method.icon}</div>
                <h3 className="contact-method-title">{method.title}</h3>
                <p className="contact-method-description">{method.description}</p>
                <div className="contact-method-value">{method.value}</div>
                <button className="contact-method-button">
                  {method.action}
                  <ArrowRight className="contact-method-arrow" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="contact-main-section">
        <div className="contact-container">
          <div className="contact-main-grid">
            {/* Contact Form */}
            <div className="contact-form-section">
              <div className="contact-form-header">
                <h2 className="contact-form-title">Send Us a Message</h2>
                <p className="contact-form-subtitle">
                  Fill out the form below and we'll get back to you as soon as possible
                </p>
              </div>

              {submitted && (
                <div className="contact-success-message">
                  <CheckCircle className="contact-success-icon" />
                  <div className="contact-success-content">
                    <h3>Message Sent Successfully!</h3>
                    <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
                  </div>
                </div>
              )}

              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                <div className="contact-form-row">
                  <div className="contact-input-group">
                    <label htmlFor="name" className="contact-label">
                      <User className="contact-label-icon" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`contact-input ${errors.name ? "contact-input-error" : ""}`}
                      placeholder="Enter your full name"
                      required
                    />
                    {errors.name && (
                      <span className="contact-error">
                        <AlertCircle className="contact-error-icon" />
                        {errors.name}
                      </span>
                    )}
                  </div>

                  <div className="contact-input-group">
                    <label htmlFor="email" className="contact-label">
                      <Mail className="contact-label-icon" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`contact-input ${errors.email ? "contact-input-error" : ""}`}
                      placeholder="Enter your email address"
                      required
                    />
                    {errors.email && (
                      <span className="contact-error">
                        <AlertCircle className="contact-error-icon" />
                        {errors.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="contact-form-row">
                  <div className="contact-input-group">
                    <label htmlFor="phone" className="contact-label">
                      <Phone className="contact-label-icon" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`contact-input ${errors.phone ? "contact-input-error" : ""}`}
                      placeholder="Enter your phone number"
                    />
                    {errors.phone && (
                      <span className="contact-error">
                        <AlertCircle className="contact-error-icon" />
                        {errors.phone}
                      </span>
                    )}
                  </div>

                  <div className="contact-input-group">
                    <label htmlFor="subject" className="contact-label">
                      <MessageSquare className="contact-label-icon" />
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={`contact-input contact-select ${errors.subject ? "contact-input-error" : ""}`}
                      required
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="plant-care">Plant Care Question</option>
                      <option value="garden-design">Garden Design</option>
                      <option value="consultation">Consultation Request</option>
                      <option value="partnership">Partnership</option>
                      <option value="support">Technical Support</option>
                      <option value="feedback">Feedback</option>
                    </select>
                    {errors.subject && (
                      <span className="contact-error">
                        <AlertCircle className="contact-error-icon" />
                        {errors.subject}
                      </span>
                    )}
                  </div>
                </div>

                <div className="contact-form-row">
                  <div className="contact-input-group">
                    <label htmlFor="urgency" className="contact-label">
                      <Star className="contact-label-icon" />
                      Priority Level
                    </label>
                    <select
                      id="urgency"
                      name="urgency"
                      value={formData.urgency}
                      onChange={handleChange}
                      className="contact-input contact-select"
                    >
                      <option value="low">Low - General question</option>
                      <option value="normal">Normal - Standard inquiry</option>
                      <option value="high">High - Urgent matter</option>
                      <option value="critical">Critical - Emergency</option>
                    </select>
                  </div>

                  <div className="contact-input-group">
                    <label htmlFor="contactMethod" className="contact-label">
                      <Headphones className="contact-label-icon" />
                      Preferred Contact Method
                    </label>
                    <select
                      id="contactMethod"
                      name="contactMethod"
                      value={formData.contactMethod}
                      onChange={handleChange}
                      className="contact-input contact-select"
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="both">Either Email or Phone</option>
                    </select>
                  </div>
                </div>

                <div className="contact-input-group">
                  <label htmlFor="message" className="contact-label">
                    <MessageSquare className="contact-label-icon" />
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="6"
                    value={formData.message}
                    onChange={handleChange}
                    className={`contact-input contact-textarea ${errors.message ? "contact-input-error" : ""}`}
                    placeholder="Tell us about your gardening needs, questions, or how we can help you..."
                    required
                  />
                  <div className="contact-textarea-counter">{formData.message.length}/500 characters</div>
                  {errors.message && (
                    <span className="contact-error">
                      <AlertCircle className="contact-error-icon" />
                      {errors.message}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className={`contact-submit-button ${isSubmitting ? "contact-submitting" : ""}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="contact-spinner"></div>
                      Sending Message...
                    </>
                  ) : (
                    <>
                      <Send className="contact-submit-icon" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="contact-info-section">
              <div className="contact-info-card">
                <h3 className="contact-info-title">Our Office Locations</h3>

                {officeLocations.map((office, index) => (
                  <div key={office.name} className="contact-office-card">
                    <div className="contact-office-header">
                      <h4 className="contact-office-name">{office.name}</h4>
                      <span className="contact-office-type">{office.type}</span>
                    </div>

                    <div className="contact-office-details">
                      <div className="contact-office-item">
                        <MapPin className="contact-office-icon" />
                        <span>{office.address}</span>
                      </div>
                      <div className="contact-office-item">
                        <Phone className="contact-office-icon" />
                        <span>{office.phone}</span>
                      </div>
                      <div className="contact-office-item">
                        <Mail className="contact-office-icon" />
                        <span>{office.email}</span>
                      </div>
                      <div className="contact-office-item">
                        <Clock className="contact-office-icon" />
                        <span>{office.hours}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="contact-social-card">
                <h3 className="contact-social-title">Follow Us</h3>
                <p className="contact-social-subtitle">Stay connected for the latest gardening tips and updates</p>

                <div className="contact-social-links">
                  <a href="#" className="contact-social-link facebook" aria-label="Facebook">
                    <Facebook className="contact-social-icon" />
                    <span>Facebook</span>
                  </a>
                  <a href="#" className="contact-social-link twitter" aria-label="Twitter">
                    <Twitter className="contact-social-icon" />
                    <span>Twitter</span>
                  </a>
                  <a href="#" className="contact-social-link instagram" aria-label="Instagram">
                    <Instagram className="contact-social-icon" />
                    <span>Instagram</span>
                  </a>
                  <a href="#" className="contact-social-link linkedin" aria-label="LinkedIn">
                    <Linkedin className="contact-social-icon" />
                    <span>LinkedIn</span>
                  </a>
                  <a href="#" className="contact-social-link youtube" aria-label="YouTube">
                    <Youtube className="contact-social-icon" />
                    <span>YouTube</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="contact-map-section">
        <div className="contact-container">
          <div className="contact-map-header">
            <h2 className="contact-section-title">Find Us</h2>
            <p className="contact-section-subtitle">Visit our main office or any of our branch locations</p>
          </div>

          <div className="contact-map-container">
            <iframe
              title="GreenScape Office Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.094091981023!2d-122.41941548468165!3d37.774929779759996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085808c8a6e66ff%3A0xa0f5c1b8c4d0c1b!2s123%20Garden%20Lane%2C%20Plant%20City%2C%20Green%20State%2012345!5e0!3m2!1sen!2sus!4v1691234567890!5m2!1sen!2sus"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="contact-map-iframe"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="contact-faq-section">
        <div className="contact-container">
          <div className="contact-section-header">
            <h2 className="contact-section-title">Frequently Asked Questions</h2>
            <p className="contact-section-subtitle">Quick answers to common questions</p>
          </div>

          <div className="contact-faq-grid">
            {faqs.map((faq, index) => (
              <div key={index} className="contact-faq-card">
                <h3 className="contact-faq-question">{faq.question}</h3>
                <p className="contact-faq-answer">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact
