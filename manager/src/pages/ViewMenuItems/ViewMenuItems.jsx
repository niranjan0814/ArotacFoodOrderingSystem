import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import ConfirmationPopup from "./ConfirmationPopup";
import { MdDelete } from "react-icons/md";
import "./ViewMenuItems.css";
import { MdOutlineModeEdit } from "react-icons/md";
import { BiHide } from "react-icons/bi";
import { GrFormView } from "react-icons/gr";
import { MdDownload } from "react-icons/md";


function ViewMenuItems() {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showHideConfirmation, setShowHideConfirmation] = useState(false);
  const [itemToToggleVisibility, setItemToToggleVisibility] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterItems();
  }, [menuItems, searchTerm, visibilityFilter, categoryFilter]);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/menu");
      setMenuItems(response.data);
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

  const checkItemInComboOffers = async (itemId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/offers/check-combo/${itemId}`);
      return response.data.inUse; 
    } catch (error) {
      console.error("Error checking combo offers:", error);
      return false;
    }
  };

  const filterItems = () => {
    let filtered = menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVisibility = visibilityFilter === "all" || item.isVisible === (visibilityFilter === "visible");
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchesSearch && matchesVisibility && matchesCategory;
    });
    setFilteredItems(filtered);
  };

  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setShowConfirmation(true);

    
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/menu/${itemToDelete}`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchMenuItems();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete item");
    } finally {
      setShowConfirmation(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowConfirmation(false);
    setItemToDelete(null);
  };

  const handleEdit = (id) => {
    navigate(`/menu/edit/${id}`);
  };

  const handleToggleVisibilityClick = (id) => {
    setItemToToggleVisibility(id);
    setShowHideConfirmation(true);
  };

  const handleToggleVisibilityConfirm = async () => {
    try {
      // Check if item is in any combo offers
      const inCombo = await checkItemInComboOffers(itemToToggleVisibility);
      if (inCombo) {
        toast.error("Cannot hide this item as it is currently used in combo offers");
        setShowHideConfirmation(false);
        setItemToToggleVisibility(null);
        return;
      }
  
      const item = menuItems.find(i => i._id === itemToToggleVisibility);
      const newVisibility = !item.isVisible;
      
      const response = await axios.put(
        `http://localhost:5000/api/menu/${itemToToggleVisibility}`,
        { isVisible: newVisibility }
      );
      
      toast.success(response.data.message);
      fetchMenuItems();
    } catch (error) {
      console.error("Error updating menu item visibility:", error);
      toast.error("Error updating menu item visibility. Please try again.");
    } finally {
      setShowHideConfirmation(false);
      setItemToToggleVisibility(null);
    }
  };
  

  const handleToggleVisibilityCancel = () => {
    setShowHideConfirmation(false);
    setItemToToggleVisibility(null);
  };

  const getRecommendations = (item) => {
    return menuItems.filter((menuItem) =>
      item.recommendedItems.includes(menuItem._id)
    );
  };

  const handleDownload = () => {
    try {
      
      const headers = [
        "Name",
        "Price",
        "Category",
        "Description",
        "Visibility",
        "Recommended Items"
      ];
  
      const dataRows = filteredItems.map(item => {
        // Safely handle potentially undefined values
        const name = item.name ? `"${item.name.toString().replace(/"/g, '""')}"` : '""';
        const category = item.category ? `"${item.category.toString().replace(/"/g, '""')}"` : '""';
        const description = item.description ? `"${item.description.toString().replace(/"/g, '""')}"` : '""';
        
        const recommendations = getRecommendations(item)
          .map(rec => rec?.name || '')
          .filter(name => name) 
          .join(", ");
  
        return [
          name,
          item.price || 0,
          category,
          description,
          item.isVisible ? "Visible" : "Hidden",
          `"${recommendations}"`
        ];
      });
  
  
      const csvContent = [
        headers.join(","),
        ...dataRows.map(row => row.join(","))
      ].join("\n");
  
    
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "menu_items.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast.error("Failed to download menu items. Please try again.");
    }
  };

  return (
    <div className="view-menu-container">
      <h2 className="view-menu-header">All Menu Items</h2>
      
      <div className="search-and-filter">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
        <select
          value={visibilityFilter}
          onChange={(e) => setVisibilityFilter(e.target.value)}
          className="filter-dropdown"
        >
          <option value="all">All</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
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
  onClick={handleDownload}
  className="download-button"
  title="Download menu items"
>
  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    Download <MdDownload /> 
  </span>
</button>
      </div>
      
      <div className="menu-items-grid">
      
        {filteredItems.map((item) => {
          const recommendations = getRecommendations(item);
          return (
            <div key={item._id} className="menu-item-card">
               <MdDelete
    className="delete-icon1"
    onClick={() => handleDeleteClick(item._id)}
  />
              
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
                <div className="recommendations">
                  <h5><b>Recommendations:</b></h5>
                  {recommendations.length > 0 ? (
                    <p>
                      {recommendations.map((rec, index) => (
                        <span key={rec._id}>
                          {rec.name}
                          {index < recommendations.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </p>
                  ) : (
                    <p>No recommendations available.</p>
                  )}
                </div>
                <div className="menu-item-buttons">
                  <button
                  onClick={() => handleEdit(item._id)}
                  className="edit-button"
                      >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Edit <MdOutlineModeEdit />
                    </span>
                      </button>
                  {item.isVisible ? (
                    <button
                      onClick={() => handleToggleVisibilityClick(item._id)}
                      className="hide-button"
                    >
                     <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                         Hide <BiHide />
                    </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleVisibilityClick(item._id)}
                      className="unhide-button"
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      Unhide <GrFormView />
                      </span>
                      
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Popup */}
      {showConfirmation && (
        <ConfirmationPopup
          message="Are you sure you want to delete this menu item?"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      {/* Hide/Unhide Confirmation Popup */}
      {showHideConfirmation && (
        <ConfirmationPopup
          message={
            menuItems.find(i => i._id === itemToToggleVisibility)?.isVisible
              ? "Are you sure you want to hide this menu item from sales?"
              : "Are you sure you want to unhide this menu item?"
          }
          onConfirm={handleToggleVisibilityConfirm}
          onCancel={handleToggleVisibilityCancel}
        />
      )}
    </div>
  );
}

export default ViewMenuItems;