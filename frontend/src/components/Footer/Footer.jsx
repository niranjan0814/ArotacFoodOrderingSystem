import React from 'react';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    {/* Top copyright */}
    <div className="footer-top">
      <p>© 2025 AROTAC. All rights reserved.</p>
    </div>

    {/* Main footer content */}
    <div className="footer-content">
      <div className="footer-section footer-about">
        <h3>AROTAC</h3>
        <p>
          Delicious food delivered to your door. Order online for pickup or delivery.
        </p>
      </div>

      <div className="footer-section footer-links">
        <h3>Quick Links</h3>
        <ul>
          <li><a href="/menu">Menu</a></li>
          <li><a href="/cart">Cart</a></li>
          <li><a href="/profile">Profile</a></li>
        </ul>
      </div>

      <div className="footer-section footer-contact">
        <h3>Contact Us</h3>
        <address>
          123 Main Street<br/>
          City, State 12345<br/>
          Phone: (123) 456-7890<br/>
          Email: <a href="mailto:info@AROTAC.com">info@AROTAC.com</a>
        </address>
      </div>
    </div>

    {/* Bottom copyright & separator */}
    <div className="footer-bottom">
      <hr/>
      <p>© 2025 AROTAC. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;