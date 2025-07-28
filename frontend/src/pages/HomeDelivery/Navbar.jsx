import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { assets } from "../../assets/assets";
import { FiMenu, FiX, FiShoppingCart, FiUser, FiHome, FiList, FiMail, FiPackage } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import "./Navbar.css";

const Navbar = () => {
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Set active menu based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === "/Home" || path === "/") setActiveMenu("home");
    else if (path === "/foodList") setActiveMenu("menu");
    else if (path === "/contact-us") setActiveMenu("contact-us");
    else if (path === "/profile") setActiveMenu("profile");
    else if (path === "/cart") setActiveMenu("cart");
    else if (path === "/order") setActiveMenu("order");
  }, [location]);

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { name: "home", path: "/Home", icon: <FiHome /> },
    { name: "menu", path: "/foodList", icon: <FiList /> },
    { name: "contact-us", path: "/contact-us", icon: <FiMail /> },
    { name: "profile", path: "/profile", icon: <FiUser /> },
    { name: "cart", path: "/cart", icon: <FiShoppingCart /> },
    { name: "order", path: "/order", icon: <FiPackage /> }
  ];

  return (
    <motion.nav 
      className={`navbar ${scrolled ? "scrolled" : ""}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="navbar-container">
        {/* Logo */}
        <motion.div 
          className="logo-container"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/Home">
            <img src={assets.logo5} alt="AroTac" className="logo" />
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <ul className="navbar-menu">
          {navItems.map((item) => (
            <motion.li 
              key={item.name}
              className={activeMenu === item.name ? "active" : ""}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to={item.path} onClick={() => setActiveMenu(item.name)}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.name.replace("-", " ")}</span>
              </Link>
            </motion.li>
          ))}
        </ul>

        {/* Mobile Menu Button */}
        <motion.button 
          className="hamburger-menu"
          onClick={toggleMobileMenu}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </motion.button>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              className="mobile-menu-container"
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              <ul className="mobile-menu">
                {navItems.map((item) => (
                  <motion.li 
                    key={`mobile-${item.name}`}
                    className={activeMenu === item.name ? "active" : ""}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Link 
                      to={item.path} 
                      onClick={() => {
                        setActiveMenu(item.name);
                        closeMobileMenu();
                      }}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-text">{item.name.replace("-", " ")}</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;