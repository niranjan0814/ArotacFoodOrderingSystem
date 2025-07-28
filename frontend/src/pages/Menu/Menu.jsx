import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaFilter } from "react-icons/fa"; 
import "./Menu.css";
import Navbar from "../../components/Navbar/Navbar.jsx";



const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState(1000); 
  const [showDropdown, setShowDropdown] = useState(false); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const menuResponse = await fetch("http://localhost:5000/api/menu");
        if (!menuResponse.ok) {
          throw new Error("Failed to fetch menu items");
        }
        const menuData = await menuResponse.json();
        setMenuItems(menuData);
  
        const categoriesResponse = await fetch("http://localhost:5000/api/menu/categories");
        if (!categoriesResponse.ok) {
          throw new Error("Failed to fetch categories");
        }
        const categoriesData = await categoriesResponse.json();
        setCategories(["All", ...categoriesData]);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  
    const interval = setInterval(fetchData, 2000);
  
    return () => clearInterval(interval);
  }, []);

  
  const filteredItems = menuItems.filter((item) => {
    const matchesSearchTerm = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <><Navbar /><div className="menu-page">

      <div className="search-filter-container">

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search for food or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} />
        </div>


        <div className="category-filter">
          <div className="filter-icon" onClick={() => setShowDropdown(!showDropdown)}>
            <FaFilter />
          </div>
          {showDropdown && (
            <div className="dropdown">
              {categories.map((category) => (
                <div
                  key={category}
                  className={`dropdown-item ${selectedCategory === category ? "active" : ""}`}
                  onClick={() => handleCategoryChange(category)}
                >
                  {category}
                </div>
              ))}
            </div>
          )}
        </div>



      </div>

      <div className="price-filter">
        <h4>Price Range</h4>
        <div className="range-slider">
          <input
            type="range"
            min="0"
            max="5000"
            value={maxPrice}
            onChange={(e) => handlePriceChange(Number(e.target.value))} />
        </div>
        <div className="range-value">
          <span>Up to Rs. {maxPrice}</span>
        </div>
      </div>




      <div className="menu-items">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <Link to={`/menu/${item._id}`} key={item._id} className="menu-item">
              {!item.isVisible && (
                <div className="not-available-overlay">
                  <span>Not Available</span>
                </div>
              )}
              <img src={item.imageUrl} alt={item.name} className="item-image" />
              <div className="item-details">
                <h2>{item.name}</h2>
                <p>{item.description}</p>
                <p className="price">Rs.&nbsp;{item.price}</p>
              </div>
            </Link>
          ))
        ) : (
          <div className="no-items-message">
            <p>Looks like it's not available, but feel free to explore other menu items!</p>
            {menuItems.map((item) => (
              <Link to={`/menu/${item._id}`} key={item._id} className="menu-item">
                {!item.isVisible && (
                  <div className="not-available-overlay">
                    <span>Not Available</span>
                  </div>
                )}
                <img src={item.imageUrl} alt={item.name} className="item-image" />
                <div className="item-details">
                  <h2>{item.name}</h2>
                  <p>{item.description}</p>
                  <p className="price">Rs.&nbsp;{item.price}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div></>
  );
};

export default Menu;