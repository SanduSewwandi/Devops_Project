import { useState, useEffect } from "react"
import './About.css';

import {
  Users,
  Target,
  Heart,
  BookOpen,
  Sprout,
  Globe,
  Award,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ArrowRight,
  CheckCircle,
  Star,
} from "lucide-react"

const teamMembers = [
  {
    id: 1,
    name: "Kamal Gunawardhana",
    role: "Founder & CEO",
    img: "/src/assets/photo-1562788869-4ed32648eb72.avif",
    bio: "Passionate gardener and environmentalist with 10+ years experience in sustainable agriculture and community building.",
    expertise: ["Sustainable Gardening", "Business Strategy", "Environmental Policy"],
    socials: {
      facebook: "#",
      twitter: "#",
      instagram: "#",
      linkedin: "#",
    },
  },
  {
    id: 2,
    name: "Milan Hatharasinghe",
    role: "Chief Botanist",
    img: "/src/assets/photo-1589386417686-0d34b5903d23.avif",
    bio: "Expert in plant biology and sustainable gardening practices with PhD in Botanical Sciences from Harvard University.",
    expertise: ["Plant Biology", "Soil Science", "Organic Farming"],
    socials: {
      facebook: "#",
      twitter: "#",
      instagram: "#",
      linkedin: "#",
    },
  },
  {
    id: 3,
    name: "Kavitha Jayasuriya",
    role: "Community Manager",
    img: "/src/assets/premium_photo-1661589856899-6dd0871f9db6.avif",
    bio: "Connects GreenScape with local communities and green initiatives, fostering relationships that grow our gardening family.",
    expertise: ["Community Building", "Social Media", "Event Planning"],
    socials: {
      facebook: "#",
      twitter: "#",
      instagram: "#",
      linkedin: "#",
    },
  },
  {
    id: 4,
    name: "Hiran Edirisinghe",
    role: "Head of Design",
    img: "/src/assets/pexels-pranavdigwal-32976.jpg",
    bio: "Creative visionary who brings beauty and functionality together in our digital garden experiences.",
    expertise: ["UI/UX Design", "Garden Design", "Digital Innovation"],
    socials: {
      facebook: "#",
      twitter: "#",
      instagram: "#",
      linkedin: "#",
    },
  },
]

const values = [
  {
    icon: <Sprout className="about-value-icon" />,
    title: "Sustainability",
    desc: "Promoting eco-friendly gardening practices for a greener planet and sustainable future.",
    color: "green",
  },
  {
    icon: <Users className="about-value-icon" />,
    title: "Community",
    desc: "Building strong bonds between plant lovers worldwide through shared knowledge and experiences.",
    color: "blue",
  },
  {
    icon: <BookOpen className="about-value-icon" />,
    title: "Education",
    desc: "Sharing knowledge and expertise to empower gardeners at every level of their journey.",
    color: "purple",
  },
  {
    icon: <Heart className="about-value-icon" />,
    title: "Growth",
    desc: "Encouraging personal and botanical growth through nurturing care and continuous learning.",
    color: "pink",
  },
]

const achievements = [
  {
    number: "50K+",
    label: "Happy Gardeners",
    icon: <Users className="about-achievement-icon" />,
  },
  {
    number: "1M+",
    label: "Plants Grown",
    icon: <Sprout className="about-achievement-icon" />,
  },
  {
    number: "200+",
    label: "Communities",
    icon: <Globe className="about-achievement-icon" />,
  },
  {
    number: "15+",
    label: "Awards Won",
    icon: <Award className="about-achievement-icon" />,
  },
]

const services = [
  {
    icon: <BookOpen className="about-service-icon" />,
    title: "Expert Tutorials & Guides",
    description: "Comprehensive gardening tutorials from beginner basics to advanced techniques.",
  },
  {
    icon: <Users className="about-service-icon" />,
    title: "Community Forums",
    description: "Connect with fellow gardeners to share tips, stories, and growing experiences.",
  },
  {
    icon: <Target className="about-service-icon" />,
    title: "Garden Planning Tools",
    description: "Smart planning tools and plant care reminders to optimize your garden's success.",
  },
  {
    icon: <CheckCircle className="about-service-icon" />,
    title: "Eco-Friendly Products",
    description: "Curated recommendations for sustainable and environmentally conscious gardening.",
  },
]

export default function About() {
  const [isVisible, setIsVisible] = useState({})
  const [activeTeamMember, setActiveTeamMember] = useState(null)

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

  return (
    <div className="about-workspace">
      {/* Hero Section with Background Image */}
      <header className="about-hero-section" id="hero">
        <div className="about-hero-background">
          <div className="about-hero-image-container">
            {/* Add your background image here */}
            <img
              src="/src/assets/fresh-spring-lawn-with-blooming-with-white-daffodil-flowers-various-tulips-green-tree-formal-garden-water-spring-background-retro-toned_971686-1776.avif"
              alt="Beautiful Garden Background"
              className="about-hero-background-image"
            />
            <div className="about-hero-overlay"></div>
          </div>
        </div>

        <div className="about-hero-content">
          <div className="about-hero-badge">
            <Sprout className="about-badge-icon" />
            <span>Growing Since 2020</span>
          </div>

          <h1 className="about-hero-title">
            About <span className="about-hero-highlight">GreenScape</span>
            <span className="about-hero-emoji">🌿</span>
          </h1>

          <p className="about-hero-subtitle">Growing gardens, growing lives, growing communities</p>
        </div>

        <div className="about-hero-scroll-indicator">
          <div className="about-scroll-arrow"></div>
        </div>
      </header>

      {/* Vision Section */}
      <section className="about-vision-section" id="vision">
        <div className="about-container">
          <div className="about-vision-content">
            <div className="about-vision-text">
              <div className="about-section-badge">
                <Target className="about-badge-icon" />
                <span>Our Vision</span>
              </div>
              <h2 className="about-section-title">Cultivating a Greener Tomorrow</h2>
              <p className="about-vision-description">
                At GreenScape, we believe that everyone can cultivate their own little paradise. We're dedicated to
                inspiring sustainable gardening practices and bringing people closer to nature through innovative tools,
                expert guidance, and a supportive community.
              </p>
              <p className="about-vision-description">
                Our mission extends beyond individual gardens – we're building a global movement of conscious gardeners
                who understand that every seed planted is a step toward a more sustainable and beautiful world.
              </p>
              <div className="about-vision-features">
                <div className="about-vision-feature">
                  <CheckCircle className="about-feature-icon" />
                  <span>Sustainable Practices</span>
                </div>
                <div className="about-vision-feature">
                  <CheckCircle className="about-feature-icon" />
                  <span>Community Driven</span>
                </div>
                <div className="about-vision-feature">
                  <CheckCircle className="about-feature-icon" />
                  <span>Expert Guidance</span>
                </div>
              </div>
            </div>
            <div className="about-vision-image">
              <img
                src="/src/assets/Creating-a-Green-Landscape-in-Unused-Urban-Spaces-1024x675.webp"
                alt="Sustainable Garden Vision"
                className="about-vision-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="about-achievements-section" id="achievements">
        <div className="about-container">
          <div className="about-achievements-grid">
            {achievements.map((achievement, index) => (
              <div
                key={achievement.label}
                className={`about-achievement-card ${isVisible.achievements ? "animate-fade-in" : ""}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="about-achievement-icon-wrapper">{achievement.icon}</div>
                <div className="about-achievement-number">{achievement.number}</div>
                <div className="about-achievement-label">{achievement.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="about-values-section" id="values">
        <div className="about-container">
          <div className="about-section-header">
            <div className="about-section-badge">
              <Heart className="about-badge-icon" />
              <span>Our Values</span>
            </div>
            <h2 className="about-section-title">What Drives Us Forward</h2>
            <p className="about-section-subtitle">
              Our core values guide every decision we make and every relationship we build
            </p>
          </div>

          <div className="about-values-grid">
            {values.map((value, index) => (
              <div
                key={value.title}
                className={`about-value-card about-value-${value.color} ${isVisible.values ? "animate-slide-up" : ""}`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="about-value-icon-wrapper">{value.icon}</div>
                <h3 className="about-value-title">{value.title}</h3>
                <p className="about-value-description">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="about-services-section" id="services">
        <div className="about-container">
          <div className="about-section-header">
            <div className="about-section-badge">
              <Star className="about-badge-icon" />
              <span>What We Offer</span>
            </div>
            <h2 className="about-section-title">Comprehensive Garden Solutions</h2>
            <p className="about-section-subtitle">
              Everything you need to create and maintain your perfect garden sanctuary
            </p>
          </div>

          <div className="about-services-grid">
            {services.map((service, index) => (
              <div
                key={service.title}
                className={`about-service-card ${isVisible.services ? "animate-fade-in" : ""}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="about-service-icon-wrapper">{service.icon}</div>
                <h3 className="about-service-title">{service.title}</h3>
                <p className="about-service-description">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="about-team-section" id="team">
        <div className="about-container">
          <div className="about-section-header">
            <div className="about-section-badge">
              <Users className="about-badge-icon" />
              <span>Our Team</span>
            </div>
            <h2 className="about-section-title">Meet the Green Experts</h2>
            <p className="about-section-subtitle">
              Passionate individuals dedicated to helping you grow the garden of your dreams
            </p>
          </div>

          <div className="about-team-grid">
            {teamMembers.map((member, index) => (
              <div
                key={member.id}
                className={`about-team-card ${isVisible.team ? "animate-slide-up" : ""}`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onMouseEnter={() => setActiveTeamMember(member.id)}
                onMouseLeave={() => setActiveTeamMember(null)}
              >
                <div className="about-team-image-wrapper">
                  <img src={member.img || "/placeholder.svg"} alt={`${member.name} - ${member.role}`} loading="lazy" />
                  <div className="about-team-overlay"></div>
                </div>

                <div className="about-team-content">
                  <h3 className="about-team-name">{member.name}</h3>
                  <p className="about-team-role">{member.role}</p>
                  <p className="about-team-bio">{member.bio}</p>

                  <div className="about-team-expertise">
                    {member.expertise.map((skill) => (
                      <span key={skill} className="about-expertise-tag">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="about-team-socials">
                    <a
                      href={member.socials.facebook}
                      className="about-social-link"
                      aria-label={`${member.name} Facebook`}
                    >
                      <Facebook className="about-social-icon" />
                    </a>
                    <a
                      href={member.socials.twitter}
                      className="about-social-link"
                      aria-label={`${member.name} Twitter`}
                    >
                      <Twitter className="about-social-icon" />
                    </a>
                    <a
                      href={member.socials.instagram}
                      className="about-social-link"
                      aria-label={`${member.name} Instagram`}
                    >
                      <Instagram className="about-social-icon" />
                    </a>
                    <a
                      href={member.socials.linkedin}
                      className="about-social-link"
                      aria-label={`${member.name} LinkedIn`}
                    >
                      <Linkedin className="about-social-icon" />
                    </a>
                  </div>
                </div>

                {activeTeamMember === member.id && <div className="about-team-hover-effect"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta-section" id="cta">
        <div className="about-cta-background">
          <div className="about-cta-pattern"></div>
        </div>

        <div className="about-container">
          <div className="about-cta-content">
            <div className="about-cta-badge">
              <Mail className="about-badge-icon" />
              <span>Get In Touch</span>
            </div>

            <h2 className="about-cta-title">Ready to Start Your Garden Journey?</h2>
            <p className="about-cta-subtitle">
              Join our community of passionate gardeners and let's grow something beautiful together
            </p>
            <div className="about-cta-contact-info">
              <div className="about-contact-item">
                <Mail className="about-contact-icon" />
                <span>hello@greenscape.com</span>
              </div>
              <div className="about-contact-item">
                <Phone className="about-contact-icon" />
                <span>047 2256089</span>
              </div>
              <div className="about-contact-item">
                <MapPin className="about-contact-icon" />
                <span>123 Garden Street,Colombo</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
