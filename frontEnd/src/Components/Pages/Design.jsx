import { useState, useEffect } from "react"
import './Design.css';
import {
  Heart,
  Star,
  Play,
  Download,
  Calendar,
  Users,
  Palette,
  TreePine,
  Search,
  Filter,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  Award,
  Eye,
  Bookmark,
  Clock,
  TrendingUp,
} from "lucide-react"

export default function Design() {
  const [activeTab, setActiveTab] = useState("layouts")
  const [favorites, setFavorites] = useState(new Set())
  const [isPlaying, setIsPlaying] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [isVisible, setIsVisible] = useState({})
  const [hoveredTool, setHoveredTool] = useState(null)
  const [viewMode, setViewMode] = useState("grid")

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }))
          }
        })
      },
      { threshold: 0.1 },
    )

    document.querySelectorAll("[id]").forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const toggleFavorite = (id) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(id)) {
      newFavorites.delete(id)
    } else {
      newFavorites.add(id)
    }
    setFavorites(newFavorites)
  }

  const designTools = [
    {
      id: 1,
      title: "3D Garden Visualizer",
      description: "See your garden in stunning 3D before you plant with AR technology",
      icon: <TreePine className="design-tool-icon" />,
      color: "design-tool-card-green",
      features: ["VR Compatible", "Real-time Shadows", "Weather Simulation"],
      price: "Free",
      users: "12.5K",
      link: "https://www.livehome3d.com/fields-of-use/garden-design-app"
    },
    {
      id: 2,
      title: "AI Plant Matcher",
      description: "Get personalized plant recommendations based on your climate and preferences",
      icon: <Star className="design-tool-icon" />,
      color: "design-tool-card-purple",
      features: ["Climate Analysis", "Soil Testing", "Growth Prediction"],
      price: "Premium",
      users: "8.3K",
      link: "https://ai-plantfinder.com/"
    },
    {
      id: 3,
      title: "Color Palette Generator",
      description: "Create harmonious color schemes that bloom throughout seasons",
      icon: <Palette className="design-tool-icon" />,
      color: "design-tool-card-orange",
      features: ["Seasonal Colors", "Bloom Calendar", "Color Harmony"],
      price: "Free",
      users: "15.2K",
      link: "https://www.canva.com/colors/color-palette-generator/"
    },
    {
      id: 4,
      title: "Smart Planning Calendar",
      description: "AI-powered planting and maintenance schedule for year-round success",
      icon: <Calendar className="design-tool-icon" />,
      color: "design-tool-card-blue",
      features: ["Weather Integration", "Task Reminders", "Seasonal Tips"],
      price: "Premium",
      users: "9.7K",
      link: "https://reclaim.ai/"
    },
  ]

  const gardenStyles = [
    {
      id: 1,
      name: "Modern Minimalist",
      image:"/src/assets/shutterstock_378363121-e1611360407905.jpg" ,
      features: ["Clean lines", "Geometric shapes", "Limited plant palette"],
      popularity: 95,
      difficulty: "Beginner",
      maintenance: "Low",
      category: "modern",
      estimatedCost: "$2,500 - $5,000",
      timeToComplete: "2-3 weeks",
    },
    {
      id: 2,
      name: "English Cottage",
      image: "/src/assets/hq720 (1).jpg",
      features: ["Mixed borders", "Climbing roses", "Natural pathways"],
      popularity: 88,
      difficulty: "Intermediate",
      maintenance: "High",
      category: "traditional",
      estimatedCost: "$3,500 - $7,000",
      timeToComplete: "4-6 weeks",
    },
    {
      id: 3,
      name: "Mediterranean Oasis",
      image:"/src/assets/3_800.jpg",
      features: ["Drought-tolerant", "Terra cotta", "Herb gardens"],
      popularity: 82,
      difficulty: "Beginner",
      maintenance: "Low",
      category: "mediterranean",
      timeToComplete: "3-4 weeks",
    },
    {
      id: 4,
      name: "Zen Japanese",
      image:"/src/assets/Japanese-indoor-garden-design.jpg",
      features: ["Water features", "Bamboo", "Stone elements"],
      popularity: 90,
      difficulty: "Advanced",
      maintenance: "Medium",
      category: "zen",
      timeToComplete: "6-8 weeks",
    },
    {
      id: 5,
      name: "Urban Rooftop",
      image:"/src/assets/Rooftop+Gardens_+Elevating+Design+For+Urban+Buildings.webp",
      features: ["Container plants", "Wind resistant", "City views"],
      popularity: 76,
      difficulty: "Intermediate",
      maintenance: "Medium",
      category: "urban",
      timeToComplete: "2-3 weeks",
    },
    {
      id: 6,
      name: "Wildflower Meadow",
      image: "/src/assets/20230411070452-64354aca9277bdaf028f7628jpeg.jpg",
      features: ["Native plants", "Pollinator friendly", "Natural beauty"],
      popularity: 84,
      difficulty: "Beginner",
      maintenance: "Very Low",
      category: "natural",
      timeToComplete: "1-2 weeks",
    },
  ]

  const testimonials = [
    {
      id: 1,
      name: "Subhanya Hatharasinghe",
      location: "Galle",
      text: "The 3D visualizer helped me see exactly how my garden would look. I saved thousands by avoiding costly mistakes!",
      rating: 5,
      image: "/Src/assets/download (1).jpg",
      verified: true,
    },
    {
      id: 2,
      name: "Hirun Iresha",
      location: "Matara",
      text: "AI plant recommendations were spot-on for my climate. My garden has never looked better!",
      rating: 5,
      image: "/src/assets/download (10).jpeg",
      verified: true,
    },
    {
      id: 3,
      name: "Devika Thushari",
      location: "Colombo",
      text: "From beginner to garden expert in just one season. The planning tools are incredible!",
      rating: 5,
      image: "/src/assets/images.jpg",
      verified: true,
    },
  ]

  const filteredStyles = gardenStyles.filter((style) => {
    const matchesSearch =
      style.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      style.features.some((feature) => feature.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = selectedFilter === "all" || style.category === selectedFilter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="design-workspace">
      {/* Lead Section */}
      <header className="lead-banner" id="lead">
        <div className="lead-backdrop">
          <div className="lead-gradient-overlay"></div>
          <div className="lead-pattern-bg"></div>
        </div>

        <div className="floating-design-elements">
          <div className="floating-design-element floating-design-1"></div>
          <div className="floating-design-element floating-design-2"></div>
          <div className="floating-design-element floating-design-3"></div>
          <div className="floating-design-element floating-design-4"></div>
          <div className="floating-design-element floating-design-5"></div>
          <div className="floating-design-element floating-design-6"></div>
        </div>

        <div className="design-container">
          <div className="lead-main-content">
            <div className="lead-status-badge">
              <TrendingUp className="status-badge-icon" />
              <span>Join 25K+ Happy Gardeners</span>
            </div>

            <h1 className="lead-main-title">
              Design Your
              <span className="lead-title-highlight">Dream Garden</span>
              <span className="lead-title-sub">with AI-Powered Tools</span>
            </h1>

            <p className="lead-description">
              Transform your outdoor space into a stunning sanctuary with professional design tools, expert guidance,
              and cutting-edge technology.
            </p>

           

            <div className="lead-feature-list">
              <div className="lead-feature-item">
                <CheckCircle className="lead-feature-icon" />
                <span>No Credit Card Required</span>
              </div>
              <div className="lead-feature-item">
                <Shield className="lead-feature-icon" />
                <span>30-Day Money Back</span>
              </div>
              <div className="lead-feature-item">
                <Award className="lead-feature-icon" />
                <span>Award Winning Design</span>
              </div>
            </div>

            <div className="lead-social-validation">
              <div className="design-user-avatars">
                <img src="/src/assets/download (10).jpeg" />
                <img src="/src/assets/download (11).jpeg" />
                <img src="/src/assets/images (8).jpeg" />
                <img src="/src/assets/images (9).jpeg"/>
                <span className="additional-users">+25K</span>
              </div>
              <p className="social-validation-text">Trusted by gardeners worldwide</p>
            </div>
          </div>

          <div className="lead-design-preview">
            <div className="design-preview-window">
              <div className="design-preview-header">
                <div className="design-preview-controls">
                  <div className="design-control red"></div>
                  <div className="design-control yellow"></div>
                  <div className="design-control green"></div>
                </div>
              </div>
              <div className="design-preview-content">
                <img src="/src/assets/j37bh4qoja0kr4h5pfak.jpg"alt="Garden Design Preview" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Design Tools Section */}
      <section className="design-tools-section" id="tools">
        <div className="design-container">
          <div className="design-section-header">
            <div className="design-section-badge">
              <Palette className="status-badge-icon" />
              <span>Professional Tools</span>
            </div>
            <h2 className="design-section-title">Everything You Need to Design</h2>
            <p className="design-section-subtitle">
              Powerful AI-driven tools that make professional garden design accessible to everyone
            </p>
          </div>

          <div className="design-tools-grid">
            {designTools.map((tool, index) => (
              <div
                key={tool.id}
                className={`design-tool-card ${tool.color} ${isVisible.tools ? "animate-slide-in" : ""}`}
                style={{ animationDelay: `${index * 0.15}s` }}
                onMouseEnter={() => setHoveredTool(tool.id)}
                onMouseLeave={() => setHoveredTool(null)}
              >
                <div className="design-tool-header">
                  <div className="design-tool-icon-wrapper">
                    {tool.icon}
                    <div className="design-tool-glow"></div>
                  </div>
                  <div className="design-tool-meta">
                    <span className="design-tool-price">{tool.price}</span>
                    <div className="design-tool-users">
                      <Users className="design-users-icon" />
                      <span>{tool.users}</span>
                    </div>
                  </div>
                </div>

                <div className="design-tool-content">
                  <h3 className="design-tool-title">{tool.title}</h3>
                  <p className="design-tool-description">{tool.description}</p>

                  <ul className="design-tool-features">
                    {tool.features.map((feature, idx) => (
                      <li key={idx} className="design-tool-feature">
                        <CheckCircle className="design-feature-check" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="design-tool-actions">
                    <button 
                      className="design-tool-button primary"
                      onClick={() => window.open(tool.link, '_blank')}
                    >
                      Try Now
                      <ArrowRight className="design-button-arrow" />
                    </button>
                    <button className="design-tool-button secondary">
                      <Eye className="design-btn-icon" />
                    </button>
                    <button className="design-tool-button secondary">
                      <Bookmark className="design-btn-icon" />
                    </button>
                  </div>
                </div>

                {hoveredTool === tool.id && <div className="design-tool-hover-effect"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Garden Styles Section */}
      <section className="garden-styles-section" id="styles">
        <div className="design-container">
          <div className="design-section-header">
            <div className="design-section-badge">
              <TreePine className="status-badge-icon" />
              <span>Style Gallery</span>
            </div>
            <h2 className="design-section-title">Find Your Perfect Garden Style</h2>
            <p className="design-section-subtitle">
              Explore curated garden designs from modern minimalist to traditional cottage styles
            </p>
          </div>

          <div className="garden-styles-controls">
            <div className="design-controls-left">
              <div className="design-search-wrapper">
                <Search className="design-search-icon" />
                <input
                  type="text"
                  placeholder="Search garden styles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="design-search-input"
                />
              </div>

              <div className="design-filter-wrapper">
                <Filter className="design-filter-icon" />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="design-filter-select"
                >
                  <option value="all">All Styles</option>
                  <option value="modern">Modern</option>
                  <option value="traditional">Traditional</option>
                  <option value="mediterranean">Mediterranean</option>
                  <option value="zen">Zen</option>
                  <option value="urban">Urban</option>
                  <option value="natural">Natural</option>
                </select>
              </div>
            </div>
            <div className="design-controls-right">
              <div className="design-results-count">{filteredStyles.length} styles found</div>
            </div>
          </div>

          <div className="garden-styles-grid">
            {filteredStyles.map((style, index) => (
              <div
                key={style.id}
                className={`garden-style-card ${isVisible.styles ? "animate-slide-in" : ""}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="garden-style-image-wrapper">
                  <img
                    src={style.image || "/placeholder.svg"}
                    alt={style.name}
                    className="garden-style-image"
                    loading="lazy"
                  />
                  <div className="garden-style-overlay"></div>

                  <button
                    onClick={() => toggleFavorite(style.id)}
                    className={`design-favorite-btn ${favorites.has(style.id) ? "favorited" : ""}`}
                  >
                    <Heart className="design-favorite-icon" />
                  </button>

                  <div className="garden-style-badges">
                    <span className="design-popularity-badge">
                      <TrendingUp className="status-badge-icon" />
                      {style.popularity}% Popular
                    </span>
                    <span className={`design-difficulty-badge difficulty-${style.difficulty.toLowerCase()}`}>
                      {style.difficulty}
                    </span>
                  </div>

                  <div className="garden-style-quick-info">
                    <div className="design-quick-info-item">
                      <Clock className="design-info-icon" />
                      <span>{style.timeToComplete}</span>
                    </div>
                  </div>
                </div>

                <div className="garden-style-content">
                  <div className="garden-style-header">
                    <h3 className="garden-style-name">{style.name}</h3>
                    <div className="garden-style-price">{style.estimatedCost}</div>
                  </div>

                  <div className="garden-style-meta">
                    <span className="design-maintenance">
                      Maintenance: <strong>{style.maintenance}</strong>
                    </span>
                  </div>

                  <div className="garden-style-features">
                    {style.features.map((feature, idx) => (
                      <span key={idx} className="design-feature-tag">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredStyles.length === 0 && (
            <div className="design-no-results">
              <TreePine className="design-no-results-icon" />
              <h3>No styles found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </section>

      {/* Design Testimonials Section */}
      <section className="design-testimonials-section" id="testimonials">
        <div className="design-container">
          <div className="design-section-header">
            <div className="design-section-badge">
              <Star className="status-badge-icon" />
              <span>Success Stories</span>
            </div>
            <h2 className="design-section-title">Loved by Gardeners Worldwide</h2>
            <p className="design-section-subtitle">
              Real stories from real people who transformed their outdoor spaces
            </p>
          </div>

          <div className="design-testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`design-testimonial-card ${isVisible.testimonials ? "animate-slide-in" : ""}`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="design-testimonial-header">
                  <div className="design-stars">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="design-star filled" />
                    ))}
                  </div>
                  {testimonial.verified && (
                    <div className="design-verified-badge">
                      <CheckCircle className="design-verified-icon" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>

                <div className="design-testimonial-content">
                  <p className="design-testimonial-text">"{testimonial.text}"</p>
                </div>

                <div className="design-testimonial-author">
                  <img
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="design-author-image"
                  />
                  <div className="design-author-info">
                    <h4 className="design-author-name">{testimonial.name}</h4>
                    <p className="design-author-location">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Design Stats Section */}
      <section className="design-stats-section" id="stats">
        <div className="design-container">
          <div className="design-stats-grid">
            <div className="design-stat-item">
              <div className="design-stat-icon">
                <TreePine />
              </div>
              <div className="design-stat-number">50K+</div>
              <div className="design-stat-label">Gardens Designed</div>
              <div className="design-stat-description">Professional layouts created</div>
            </div>
            <div className="design-stat-item">
              <div className="design-stat-icon">
                <Palette />
              </div>
              <div className="design-stat-number">1M+</div>
              <div className="design-stat-label">Plants Placed</div>
              <div className="design-stat-description">Successfully positioned</div>
            </div>
            <div className="design-stat-item">
              <div className="design-stat-icon">
                <Users />
              </div>
              <div className="design-stat-number">25K+</div>
              <div className="design-stat-label">Happy Gardeners</div>
              <div className="design-stat-description">Active community members</div>
            </div>
            <div className="design-stat-item">
              <div className="design-stat-icon">
                <Star />
              </div>
              <div className="design-stat-number">500+</div>
              <div className="design-stat-label">Plant Varieties</div>
              <div className="design-stat-description">In our database</div>
            </div>
          </div>
        </div>
      </section>

      {/* Design CTA Section */}
      <section className="design-cta-section" id="cta">
        <div className="design-cta-background">
          <div className="design-cta-pattern"></div>
        </div>

        <div className="design-container">
          <div className="design-cta-content">
            <div className="design-cta-badge">
              <Zap className="status-badge-icon" />
              <span>Limited Time Offer</span>
            </div>

            <h2 className="design-cta-title">Ready to Create Your Dream Garden?</h2>
            <p className="design-cta-subtitle">
              Join thousands of gardeners who have transformed their outdoor spaces with our AI-powered tools
            </p>

            <div className="design-cta-features">
              <div className="design-cta-feature">
                <CheckCircle className="lead-feature-icon" />
                <span>14-day free trial</span>
              </div>
              <div className="design-cta-feature">
                <CheckCircle className="lead-feature-icon" />
                <span>No setup fees</span>
              </div>
              <div className="design-cta-feature">
                <CheckCircle className="lead-feature-icon" />
                <span>Cancel anytime</span>
              </div>
            </div>
            <div className="design-cta-guarantee">
              <Shield className="design-guarantee-icon" />
              <span>30-day money-back guarantee</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}