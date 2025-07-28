import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { FiSearch, FiShoppingCart } from "react-icons/fi";
import { MdDownload } from "react-icons/md";
import "./OrderPage.css";

function OrderPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cartItems");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  

  const navigate = useNavigate();

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterItems();
  }, [menuItems, searchTerm, categoryFilter]);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/menu/");
      const fetchedMenuItems = Array.isArray(response.data) ? response.data : (response.data.menuItems || []);
  
      const visibleMenuItems = fetchedMenuItems.filter(item => item.isVisible === true);
  
      setMenuItems(visibleMenuItems);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast.error("Error fetching menu items. Please try again.");
    }
  };
  

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/menu/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Error fetching categories. Please try again.");
    }
  };

  const filterItems = () => {
    let filtered = menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
    setFilteredItems(filtered);
  };

  const addToCart = (item) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => cartItem.menuItemId === item._id);
      let updatedCart;
      if (existingItem) {
        updatedCart = prevItems.map(cartItem =>
          cartItem.menuItemId === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        updatedCart = [
          ...prevItems,
          {
            menuItemId: item._id,
            name: item.name,
            price: item.price,
            quantity: 1
          }
        ];
      }
      
      // Save to localStorage
      localStorage.setItem("cartItems", JSON.stringify(updatedCart));
  
      return updatedCart;
    });
    toast.success(`${item.name} added to cart`);
  };
  

  const navigateToOrderSummary = () => {
    if (cartItems.length === 0) {
      toast.error("Please add items to the cart first");
      return;
    }
    navigate('/order-summary');
  };

  return (
    <div className="view-menu-container">
      <h2 className="view-menu-header">Menu</h2>
      
      <div className="search-and-filter">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="filter-dropdown"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <button 
          onClick={navigateToOrderSummary}
          className="download-button"
          title="View Cart"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Cart ({cartItems.reduce((total, item) => total + item.quantity, 0)}) <FiShoppingCart /> 
          </span>
        </button>
      </div>
      
      <div className="menu-items-grid">
        {filteredItems.map((item) => (
          <div key={item._id} className="menu-item-card">
            <div className="menu-item-image-container">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="menu-item-image"
              />
            </div>
            
            <div className="menu-item-details">
              <h3 className="menu-item-name"><b>{item.name}</b></h3>
              <p className="menu-item-price"><b>Price:</b> Rs. {item.price}</p>
              <p className="menu-item-category"><b>Category:</b> {item.category}</p>
              <p className="menu-item-description">{item.description}</p>
              
              <div className="menu-item-buttons">
                <button
                  onClick={() => addToCart(item)}
                  className="edit-button"
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Add to Cart <FiShoppingCart />
                  </span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderPage;