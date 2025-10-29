import React, { useState } from 'react';
import './Footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');

  const currentYear = new Date().getFullYear();

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    console.log('Newsletter subscription:', email);
    setEmail('');
  };

  return (
    <footer className="modern-footer">
      <div className="footer-content">
        {/* About Us Section */}
        <div className="footer-section about-section">
          <div className="section-header">
            <h3>About Green Scape</h3>
          </div>
          <p className="about-text">
            We're passionate about helping you grow beautiful spaces with expert tips, 
            quality tools, and the right plants for your gardening journey.
          </p>
          
          {/* Newsletter Signup */}
          <div className="newsletter-section">
            <h4>Stay Green with Us</h4>
            <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
              <div className="input-group">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="newsletter-input"
                />
                <button type="submit" className="newsletter-btn">
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="footer-section links-section">
          <div className="section-header">
            <h3>Quick Links</h3>
          </div>
          <div className="footer-links-grid">
            <div className="link-column">
              <a href="#home">Home</a>
              <a href="#shop">Shop</a>
              <a href="#design">Design</a>
              <a href="#planner">Planner</a>
            </div>
            <div className="link-column">
              <a href="#about">About </a>
              <a href="#contact">Contact</a>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="footer-section contact-section">
          <div className="section-header">
            <h3>Contact Info</h3>
          </div>
          
          <div className="contact-info">
            <div className="contact-item">
              <div className="contact-icon">📍</div>
              <span>123 Garden St, Colombo, Sri Lanka</span>
            </div>
            <div className="contact-item">
              <div className="contact-icon">📞</div>
              <span>+94 11 234 5678</span>
            </div>
            <div className="contact-item">
              <div className="contact-icon">✉️</div>
              <span>hello@greenscape.lk</span>
            </div>
          </div>

          <div className="social-links-compact">
            {[
              { name: 'Facebook', color: '#1877f2' },
              { name: 'Instagram', color: '#e4405f' },
              { name: 'Twitter', color: '#1da1f2' },
              { name: 'YouTube', color: '#ff0000' }
            ].map((social) => (
              <a 
                href="#" 
                key={social.name}
                className="social-link-compact"
                style={{ backgroundColor: social.color }}
                aria-label={social.name}
              >
                {social.name.charAt(0)}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <div className="copyright">
            <p>&copy; {currentYear} Green Scape. All rights reserved.</p>
          </div>
          <div className="footer-legal">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;