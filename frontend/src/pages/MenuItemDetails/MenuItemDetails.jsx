import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "./MenuItemDetails.css";

const MenuItemDetails = () => {
  const { id } = useParams(); 
  const [menuItem, setMenuItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]); 
  const [recommendedItems, setRecommendedItems] = useState([]); 
  const navigate = useNavigate();

  
  useEffect(() => {
    const fetchMenuItem = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/menu/${id}/with-recommendations`);
        if (!response.ok) {
          throw new Error("Failed to fetch menu item details");
        }
        const data = await response.json();
        setMenuItem(data);

       
        setBreadcrumb((prev) => {
          const newBreadcrumb = [...prev];
          if (!newBreadcrumb.some((item) => item.id === data._id)) {
            newBreadcrumb.push({ id: data._id, name: data.name, category: data.category });
          }
          return newBreadcrumb;
        });

       
        if (data.recommendedItems.length === 0) {
          const categoryResponse = await fetch(`http://localhost:5000/api/menu?category=${data.category}`);
          if (!categoryResponse.ok) {
            throw new Error("Failed to fetch items from the same category");
          }
          const categoryData = await categoryResponse.json();
          setRecommendedItems(categoryData.filter(item => item._id !== data._id)); 
        } else {
          setRecommendedItems(data.recommendedItems);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItem();
  }, [id]);

  // Handle clicking on a recommended item
  const handleRecommendedItemClick = (item) => {
    navigate(`/menu/${item._id}`); 
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!menuItem) {
    return <div>Menu item not found</div>;
  }

  return (
    <div className="menu-item-details">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <Link to="/menu">Menu</Link>
        {breadcrumb.map((item, index) => (
          <span key={item.id}>
            {" > "}
            <Link to={`/menu/${item.id}`}>{item.name}</Link>
          </span>
        ))}
      </div>

      {/* Menu Item Details */}
      <div className="details-container">
        <img src={menuItem.imageUrl} alt={menuItem.name} className="item-image" />
        <div className="item-info">
          <h1>{menuItem.name}</h1>
          <p className="price">Rs.&nbsp;{menuItem.price}</p>
          <p className="description">{menuItem.description}</p>
        </div>
      </div>

      {/* Recommended Items */}
      <div className="recommended-items">
        <h2>Related dishes available</h2>
        <div className="recommended-list">
          {recommendedItems.length > 0 ? (
            recommendedItems.map((item) => (
              <div
                key={item._id}
                className="recommended-item"
                onClick={() => handleRecommendedItemClick(item)}
              >
                <img src={item.imageUrl} alt={item.name} className="recommended-image" />
                <div className="recommended-info">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <p>Rs.&nbsp;{item.price}</p>
                </div>
              </div>
            ))
          ) : (
            <p>No recommended items available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemDetails;