import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer/Footer';
import './Home.css';
import Navbar from '../../components/Navbar/Navbar';
import Chatbot from "../../components/Chatbot/Chatbot";

const Home = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar/>   <Chatbot />
      <div className="landing-page">
        {/* Hero Banner */}
        <section className="hero-banner">
          <div className="hero-overlay">
            <h1 className="hero-title">Welcome to AROTAC</h1>
            <p className="hero-subtitle">Delicious food delivered fresh to your door.</p>
            <div className="hero-buttons">
              <button
                 onClick={() => window.location.href = 'http://localhost:8080'}
                className="btn btn-inshop"
              >
                In-Shop Login
              </button>
              <button
                onClick={() => navigate('/login-home')}
                className="btn btn-home"
              >
                Home Delivery Login
              </button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="features">
          <h2 className="section-title">How It Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>1. Browse Menu</h3>
              <p>Explore our curated selection of dishes from trusted chefs and restaurants.</p>
            </div>
            <div className="feature-card">
              <h3>2. Place Order</h3>
              <p>Select your favorite meals, customize them, and place your order in minutes.</p>
            </div>
            <div className="feature-card">
              <h3>3. Enjoy Food</h3>
              <p>Receive your food hot and fresh at your doorstep or dine in at our location.</p>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="about">
          <h2 className="about-title">About AROTAC</h2>
          <p className="about-text">
            AROTAC is a modern food service platform delivering top-tier dishes from your favorite local restaurants. Whether you're craving a classic meal or exploring something new, we ensure it arrives fresh, fast, and full of flavor.
          </p>
        </section>

        {/* Testimonials */}
        <section className="testimonials">
          <h2 className="section-title">What Our Customers Say</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <p className="testimonial-text">"Absolutely delicious! The ordering process was smooth and the food arrived hot."</p>
              <p className="testimonial-author">– Alex K.</p>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">"Great service and amazing variety of dishes. Highly recommend Arotac!"</p>
              <p className="testimonial-author">– Priya D.</p>
            </div>
          </div>
        </section>

        {/* Visit */}
        <section className="visit">
          <h2 className="section-title">Visit Our Restaurant</h2>
          <div className="visit-content">
            <img
              src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=600&q=80"
              alt="Restaurant"
              className="visit-image"
            />
            <div className="visit-info">
              <p className="visit-address">📍 123 Arotac Street, Food City, Country</p>
              <p className="visit-hours">Open Daily: 10:00 AM – 10:00 PM</p>
            </div>
          </div>
        </section>

        {/* Map */}
        <section className="map-section">
          <h2 className="section-title">Find Us on the Map</h2>
          <div className="map-container">
          <iframe
  title="AROTAC Location"
  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3156.463974073231!2d80.21930031531624!3d9.729573993045874!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwNDMnNDYuNCJOIDgwwrAxMicyOS45IkU!5e0!3m2!1sen!2sin!4v1682693837422!5m2!1sen!2sin"
  allowFullScreen
  loading="lazy"
></iframe>
          </div>
        </section>

        {/* Footer */}
        <Footer/>
      </div>
    </>
  );
};

export default Home;