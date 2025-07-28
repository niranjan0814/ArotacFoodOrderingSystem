import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import { assets } from "../../assets/assets";

const Navbar = () => {
  const [menu, setMenu] = useState("home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="navbar">
       <div className="hamburger-menu" onClick={toggleMobileMenu}>
        ☰
      </div>
      <img src={assets.logo5} alt="AroTac" className="logo" />
      {/* Hamburger Menu Icon */}
     
      {/* Navbar Menu */}
      <ul className={`navbar-menu ${isMobileMenuOpen ? "active" : ""}`}>
        <li onClick={() => setMenu("home")} className={menu === "home" ? "active" : ""}>
          <Link to="/">Home</Link>
        </li>
        <li onClick={() => setMenu("menu")} className={menu === "menu" ? "active" : ""}>
          <Link to="/menu">Menu</Link>
        </li>
        <li onClick={() => setMenu("offers")} className={menu === "offers" ? "active" : ""}>
          <Link to="/offers">Offers</Link>
        </li>
        <li onClick={() => setMenu("contact-us")} className={menu === "contact-us" ? "active" : ""}>
          <Link to="/contact">Contact us</Link>
        </li>
        
      </ul>
      <div className="navbar-right">
        
        
      </div>
    </div>
  );
};

export default Navbar;

