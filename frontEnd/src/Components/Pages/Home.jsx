import React from 'react';
import './Home.css';

const Home = () => {
  const aboutImage = "/images/about-gardener.jpg";
  const serviceImages = {
    design: "/images/service-design.jpg",
    maintenance: "/images/service-maintenance.jpg",
    consultation: "/images/service-consultation.jpg"
  };
  
  const plantCategories = [
    { name: "Indoor Plants", image: "/src/assets/premium_photo-1673969608352-ec2d84279614.jpeg", description: "Perfect for home decoration" },
    { name: "Outdoor Plants", image: "/src/assets/4x_360x.jpg", description: "Garden beautification" },
    { name: "Succulents", image: "/src/assets/succulents.webp", description: "Low maintenance options" },
    { name: "Flowering Plants", image: "/src/assets/summer-flowers-dahlia-flowers-pink-flower-garden-royalty-free-image-1710974666.avif", description: "Colorful blooms" },
    { name: "Trees & Shrubs", image: "/src/assets/GrassRoots-Lawn-Care-and-Shrub-Care.webp", description: "Structural landscaping" },
    { name: "Herbs & Vegetables", image: "/src/assets/5ZzJRLPC4omCKG5CWzm6f6.jpg", description: "Edible gardening" }
  ];

  const gardeningExamples = [
    { image: "/src/assets/hq720.jpg", title: "Modern Landscape Design" },
    { image: "/src/assets/5-Ways-To-Turn-Your-Landscape-Design-Into-A-Tropical-Paradise.jpg", title: "Tropical Garden Paradise" },
    { image: "/src/assets/1f20277efe43315ec7b0c9f7f268f4de.jpg", title: "Zen Garden Retreat" },
    { image: "/src/assets/images (4).jpeg", title: "Cottage Garden Style" },
    { image:"/src/assets/images (5).jpeg", title: "Contemporary Outdoor Space" },
    { image: "/src/assets/shutterstock_428313904.jpg", title: "Colorful Flower Beds" }
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Green Scape</h1>
            <p>BRINGING NATURE AND HARMONY TO YOUR LANDSCAPE</p>
           
          </div>
        </div>
       
      </section>

      {/* About Section */}
      <section className="about">
        <div className="about-content">
          <div className="about-text">
            <h2>About Green Scape</h2>
            <p>We are passionate about creating beautiful, sustainable landscapes that enhance your outdoor living experience. Our team of expert landscapers and garden designers work closely with you to transform your vision into reality.</p>
          </div>
          <div className="about-image">
            <img src="/src/assets/pexels-gary-barnes-6231974.jpg"/>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services">
        <h2>Our Services</h2>
        <div className="services-grid">
          <div className="service-card">
            <img src="/src/assets/pexels-exactissime-33343217.jpg" />
            <h3>Garden Design</h3>
            <p>Custom landscape design tailored to your space and preferences</p>
          </div>
          <div className="service-card">
            <img src="/src/assets/pexels-karolina-grabowska-4751973.jpg" />
            <h3>Garden Maintenance</h3>
            <p>Professional care to keep your garden healthy and beautiful year-round</p>
          </div>
          <div className="service-card">
            <img src="/src/assets/pexels-cottonbro-4503737.jpg" />
            <h3>Consultation</h3>
            <p>Expert advice for all your landscaping and gardening needs</p>
          </div>
        </div>
      </section>

      {/* Plant Categories */}
      <section className="plant-categories">
        <h2>Shop By Categories</h2>
        <div className="categories-grid">
          {plantCategories.map((category, index) => (
            <div key={index} className="category-card">
              <img src={category.image} alt={category.name} />
              <div className="category-info">
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features/Icons Section */}
      <section className="features">
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">☀️</div>
            <span>Sunlight</span>
          </div>
          <div className="feature">
            <div className="feature-icon">📱</div>
            <span>Digital</span>
          </div>
          <div className="feature">
            <div className="feature-icon">💧</div>
            <span>Watering</span>
          </div>
          <div className="feature">
            <div className="feature-icon">🌱</div>
            <span>Growing</span>
          </div>
          <div className="feature">
            <div className="feature-icon">⚖️</div>
            <span>Balance</span>
          </div>
        </div>
      </section>

      {/* Plant Showcase */}
      <section className="plant-showcase">
        <div className="showcase-plants">
          <div className="plant-item">
            <img src="/src/assets/Indoor-Plants-Guide-01-0505180010.jpg" />
          </div>
          
        </div>
      </section>

      {/* Features Banner */}
      <div className="features-banner">
        <div className="feature-item">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 17h18c0-3.87-.84-7.11-2.5-9.5L17 9l-1-4-4 1.5L11 5l-1 1.5L6 5L5 9l-1.5-1.5C1.84 9.89 1 13.13 1 17h2z" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M12 19v3" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 19v3" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 19v3" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="feature-text">
            <h3>Free Shipping</h3>
            <p>Free shipping on order</p>
          </div>
        </div>

        <div className="feature-item">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="feature-text">
            <h3>100% Money Back</h3>
            <p>You've 30 Days To Return</p>
          </div>
        </div>

        <div className="feature-item">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          <div className="feature-text">
            <h3>Support 24/7</h3>
            <p>Contact Us Anytime</p>
          </div>
        </div>
      </div>

      {/* Rewards Club */}
      <section className="rewards-club">
        <div className="rewards-content">
          <div className="rewards-text">
            <h2>Join our Plant Parent Rewards Club</h2>
            <p>Get exclusive access to plant care tips, seasonal guides, and member-only discounts on our premium plants and services.</p>
          </div>
          <div className="rewards-image">
            <img src="/src/assets/PPC.webp" />
          </div>
        </div>
      </section>

      {/* Gardening Examples */}
      <section className="gardening-examples">
        <h2>Gardening Category</h2>
        <div className="examples-grid">
          {gardeningExamples.map((example, index) => (
            <div key={index} className="example-card">
              <img src={example.image} alt={example.title} />
              <div className="example-overlay">
                <h3>{example.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

     {/* Contact/Location */}
<section className="location">
  <div className="location-content">
    <div className="location-info">
      <h2>Visit Our Garden Center</h2>
      <p>
        Come explore our extensive collection of plants, tools, and garden
        accessories. Our knowledgeable staff is here to help you create your
        perfect garden.
      </p>
      <div className="contact-details">
        <p>📍 123 Garden Street, Green City, GC 12345</p>
        <p>📞 047 2256890</p>
        <p>✉️ info@greenscape.com</p>
      </div>
    </div>
    <div className="location-map">
      <iframe
        title="Google Map"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.094091981023!2d-122.41941548468165!3d37.774929779759996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085808c8a6e66ff%3A0xa0f5c1b8c4d0c1b!2s123%20Garden%20St%2C%20Green%20City%2C%20GC%2012345!5e0!3m2!1sen!2sus!4v1691234567890!5m2!1sen!2sus"
        width="100%"
        height="300"
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
    </div>
  </div>
</section>

    </div>
  );
};

export default Home;