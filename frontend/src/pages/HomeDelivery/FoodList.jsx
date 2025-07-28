import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaFilter, FaCartPlus, FaSearch, FaTimes } from "react-icons/fa";
import { CartContext } from "../../Context/CartContext.jsx";
import { toast } from 'react-toastify';
import Navbar from "./Navbar.jsx";
import Feedback from "./Feedback.jsx";
import Chatbot from "../../components/Chatbot/Chatbot.jsx";
import { motion, AnimatePresence } from "framer-motion";
import "./Menu.css";

const FoodList = () => {
  const { addToCart } = useContext(CartContext);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [menuResponse, categoriesResponse] = await Promise.all([
          fetch("http://localhost:5000/api/menu"),
          fetch("http://localhost:5000/api/menu/categories")
        ]);

        if (!menuResponse.ok) throw new Error("Failed to fetch menu items");
        if (!categoriesResponse.ok) throw new Error("Failed to fetch categories");

        const [menuData, categoriesData] = await Promise.all([
          menuResponse.json(),
          categoriesResponse.json()
        ]);

        setMenuItems(menuData);
        setCategories(["All", ...categoriesData]);
      } catch (error) {
        setError(error.message);
        toast.error(`Error loading menu: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredItems = menuItems.filter((item) => {
    const matchesSearchTerm =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesPrice = item.price <= maxPrice;
    return matchesSearchTerm && matchesCategory && matchesPrice;
  });

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setShowDropdown(false);
  };

  const handlePriceChange = (value) => {
    setMaxPrice(value);
  };

 const handleAddToCart = (item) => {
  if (!item.isVisible) {
    toast.warning(`${item.name} is currently unavailable`);
    return;
  }

  const cartItem = {
    _id: item._id,
    name: item.name,
    price: item.price,
    imageUrl: item.imageUrl,
    category: item.category,
    quantity: 1
  };

  addToCart(cartItem);
  
  toast.success(
    <div className="toast-container">
      <div className="toast-image-container">
        <img 
          src={item.imageUrl || "/default-food.jpg"} 
          alt={item.name}
          className="toast-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/default-food.jpg";
          }}
        />
      </div>
      <div className="toast-content">
        <p className="toast-title">{item.name} added to cart!</p>
        <p className="toast-price">Rs. {item.price.toLocaleString()}</p>
        <div className="toast-progress-bar"></div>
      </div>
    </div>,
    {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      className: 'custom-toast'
    }
  );
};

  const handleImageClick = (foodId) => {
    setSelectedFoodId(foodId);
    setShowFeedback(true);
  };

  const closeFeedback = () => {
    setShowFeedback(false);
    setSelectedFoodId(null);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-container">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="loading-spinner"
          ></motion.div>
          <p className="loading-text">Loading delicious foods...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <><Chatbot />
        <Navbar />
        <div className="error-container">
          <p className="error-message">Error: {error}</p>
          <motion.button
            onClick={() => window.location.reload()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="retry-button"
          >
            Try Again
          </motion.button>
        </div>
      </>
    );
  }

  return (
    <>
      <Chatbot />
      <Navbar />
      <div className="food-list-container">
        <motion.h1 
          className="page-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Our Delicious Foods
        </motion.h1>

        <div className="filter-controls">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search for food or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button onClick={clearSearch} className="clear-search">
                <FaTimes />
              </button>
            )}
          </div>

          <div className="filter-dropdown-container">
            <motion.button
              className="filter-button"
              onClick={() => setShowDropdown(!showDropdown)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaFilter className="filter-icon" />
              <span>Filter</span>
            </motion.button>
            
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  className="category-dropdown"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {categories.map((category) => (
                    <div
                      key={category}
                      className={`dropdown-item ${
                        selectedCategory === category ? "active" : ""
                      }`}
                      onClick={() => handleCategoryChange(category)}
                    >
                      {category}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="price-filter-container">
          <h4 className="price-filter-title">Price Range</h4>
          <div className="price-range-container">
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={maxPrice}
              onChange={(e) => handlePriceChange(Number(e.target.value))}
              className="price-range-slider"
            />
            <div className="price-range-labels">
              <span>Rs. 0</span>
              <span className="current-price">Max: Rs. {maxPrice}</span>
              <span>Rs. 5000</span>
            </div>
          </div>
        </div>

        {filteredItems.length > 0 ? (
          <motion.div 
            className="food-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            {filteredItems.map((item) => (
              <motion.div
                key={item._id}
                className="food-card"
                whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="food-image-container">
                  <motion.img
                    src={item.imageUrl || "/default-food.jpg"}
                    alt={item.name}
                    className="food-image"
                    onClick={() => handleImageClick(item._id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  />
                  {!item.isVisible && (
                    <div className="unavailable-overlay">
                      <span className="unavailable-badge">Currently Unavailable</span>
                    </div>
                  )}
                </div>
                <div className="food-details">
                  <h3 className="food-name">{item.name}</h3>
                  <p className="food-category">{item.category}</p>
                  <p className="food-price">Rs. {item.price}</p>
                </div>
                <motion.button
                  onClick={() => handleAddToCart(item)}
                  disabled={!item.isVisible}
                  className={`add-to-cart-button ${
                    !item.isVisible ? "disabled" : ""
                  }`}
                  whileHover={item.isVisible ? { scale: 1.05 } : {}}
                  whileTap={item.isVisible ? { scale: 0.95 } : {}}
                >
                  <FaCartPlus className="cart-icon" />
                  {item.isVisible ? "Add to Cart" : "Unavailable"}
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            className="no-items-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p>No items found matching your criteria. Try adjusting your filters.</p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showFeedback && (
          <Feedback foodId={selectedFoodId} onClose={closeFeedback} />
        )}
      </AnimatePresence>
    </>
  );
};

export default FoodList;