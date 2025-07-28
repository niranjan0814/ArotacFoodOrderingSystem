import React, { useContext, useEffect, useState, useMemo } from "react";
import Navbar from "./Navbar.jsx";
import { CartContext } from "../../Context/CartContext.jsx";
import { toast } from "react-toastify";
import "./OrdersPage.css";

const fallbackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 208 208'%3E%3Crect width='208' height='208' fill='%23f3f4f6'/%3E%3Ctext x='50%' y='50%' font-family='sans-serif' font-size='14' text-anchor='middle' dominant-baseline='middle' fill='%236b7280'%3ENo Orders%3C/text%3E%3C/svg%3E";

const OrdersPage = () => {
  const { orders, fetchOrders, cancelOrder } = useContext(CartContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = useMemo(() => localStorage.getItem("userId"), []);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        if (userId) {
          await fetchOrders(userId);
        } else {
          setError("Please log in to view your orders.");
          toast.error("Please log in to view your orders.");
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError("Failed to load orders. Please try again.");
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [userId, fetchOrders]);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = fallbackImage;
  };

  const calculateOrderTotal = (orderItems) => {
    if (!orderItems || !Array.isArray(orderItems)) return 0;
    return orderItems.reduce((total, item) => {
      const itemPrice = parseFloat(item.price) || 0;
      const itemQuantity = parseInt(item.quantity, 10) || 0;
      return total + itemPrice * itemQuantity;
    }, 0);
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await cancelOrder(orderId);
      toast.success("Order cancelled successfully");
    } catch (error) {
      toast.error(error.message || "Failed to cancel order");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="error-container">
          <div className="error-message">{error}</div>
        </div>
      </>
    );
  }

  return (
    <div className="orders-page">
      <Navbar />
      <div className="orders-container">
        <h1 className="orders-title">My Orders</h1>

        {!orders || orders.length === 0 ? (
          <div className="orders-empty">
            <img src={fallbackImage} alt="No orders" className="orders-empty-image" />
            <p className="orders-empty-text">No orders found yet!</p>
          </div>
        ) : (
          orders.map((order) => {
            let orderItems = [];
            try {
              orderItems =
                typeof order.order === "string"
                  ? JSON.parse(order.order)
                  : Array.isArray(order.order)
                  ? order.order
                  : [];
            } catch (e) {
              console.error(`Error parsing order items:`, e);
              orderItems = [];
            }

            const orderDate = new Date(order.createdAt);
            const now = new Date();
            const diffMinutes = (now - orderDate) / (1000 * 60);
            const canCancel = order.status === "pending" && diffMinutes <= 10;
            const orderTotal = calculateOrderTotal(orderItems);

            return (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-meta">
                    <p className="order-id">Order #{order._id}</p>
                    <p className="order-date">Date: {orderDate.toLocaleString()}</p>
                    <p className="order-status">
                      Status: <span className={`status-${order.status}`}>{order.status}</span>
                    </p>
                    {order.address && <p className="order-address">Address: {order.address}</p>}
                    {order.phoneNumber && <p className="order-phone">Phone: {order.phoneNumber}</p>}
                  </div>
                  <div className="order-pricing">
                    <p className="order-total">Total: Rs. {orderTotal.toFixed(2)}</p>
                    {order.deliveryFee > 0 && (
                      <p className="order-delivery-fee">
                        (Includes Rs. {order.deliveryFee.toFixed(2)} delivery fee)
                      </p>
                    )}
                  </div>
                </div>

                <div className="order-items-grid">
                  {orderItems.map((item, idx) => (
                    <div key={`${order._id}-${idx}`} className="order-item">
                      <img
                        src={item.image || fallbackImage}
                        alt={item.name}
                        className="order-item-image"
                        onError={handleImageError}
                      />
                      <div className="order-item-details">
                        <p className="order-item-name">{item.name}</p>
                        {item.category && (
                          <p className="order-item-category">Category: {item.category}</p>
                        )}
                        <p className="order-item-price">Price: Rs. {(parseFloat(item.price) || 0).toFixed(2)}</p>
                        <p className="order-item-quantity">Qty: {parseInt(item.quantity, 10) || 1}</p>
                        <p className="order-item-subtotal">
                          Subtotal: Rs. {(
                            (parseFloat(item.price) || 0) *
                            (parseInt(item.quantity, 10) || 1
                          ).toFixed(2))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {order.status === "pending" && (
                  <div className="order-actions">
                    <button
                      onClick={() => handleCancelOrder(order._id)}
                      disabled={!canCancel}
                      className="cancel-order-btn"
                      title={!canCancel ? "Cancellation window expired (10 minutes)" : "Cancel Order"}
                    >
                      Cancel Order
                    </button>
                    {!canCancel && (
                      <p className="cancel-notice">
                        Can only cancel within 10 minutes of ordering
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default React.memo(OrdersPage);