import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FiPlusCircle, FiMinusCircle, FiX, FiPrinter, FiArrowLeft } from "react-icons/fi";
import { MdTableRestaurant, MdDeliveryDining } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import ConfirmationPopup from "./ConfirmationPopup";
import "./OrderSummaryPage.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function OrderSummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cartItems");
    return savedCart ? JSON.parse(savedCart) : (location.state?.cartItems || []);
  });
  
  const [orderDetails, setOrderDetails] = useState({
    tableNumber: "",
    customerName: "",
    orderType: "dine-in"
  });
  const [tables, setTables] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchActiveTables();
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const fetchActiveTables = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/tables/");
      const fetchedTables = Array.isArray(response.data) ? response.data : (response.data.tables || []);

      const activeTables = fetchedTables.filter(table => table.status === 'Active');
  
      setTables(activeTables);
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast.error("Error fetching tables. Please try again.");
    }
  };
  
  const removeFromCart = (itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.menuItemId !== itemId));
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.menuItemId === itemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  const handleOrderSubmit = async () => {
    if (cartItems.length === 0) {
      console.log("Cart is empty");
      toast.error("Please add items to the cart before placing an order");
      return;
    }
    
    if (orderDetails.orderType === "dine-in" && !orderDetails.tableNumber) {
      console.log("No table selected for dine-in");
      toast.error("Please select a table number for dine-in orders");
      return;
    }
    
    setShowConfirm(true);
  };
  

  const confirmOrderSubmit = async () => {
  try {
    const orderData = {
      tableNumber: orderDetails.tableNumber,
      customerName: orderDetails.customerName,
      orderType: orderDetails.orderType,
      items: cartItems.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        name: item.name,
        price: item.price
      })),
      totalAmount: calculateTotal(),
      status: 'pending'
    };

    console.log('Submitting order:', orderData); // Debug log
    
    const response = await axios.post('http://localhost:5000/api/orders', orderData);
    toast.success("Order placed successfully!");
    navigate('/order/view');
  } catch (error) {
    console.error("Full error details:", error.response?.data || error.message);
    toast.error(`Failed to place order: ${error.response?.data?.message || error.message}`);
  }
};

  const generateBill = () => {
    const billContent = `
      <html>
        <head>
          <title>Bill</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            h1 { color: #333; font-size: 24px; margin-bottom: 5px; }
            .restaurant-name { font-size: 18px; font-weight: bold; color: #4a90e2; }
            .order-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; font-weight: 600; }
            .total-row { font-weight: bold; }
            .total-amount { text-align: right; font-size: 18px; }
            .footer { text-align: center; margin-top: 30px; color: #777; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant-name">AroTac - </div>
            <h1>ORDER RECEIPT</h1>
            <div>${new Date().toLocaleDateString()} • ${new Date().toLocaleTimeString()}</div>
          </div>
          
          <div class="order-info">
            <div><strong>Order Type:</strong> ${orderDetails.orderType === 'dine-in' ? `Dine-In (Table ${orderDetails.tableNumber})` : 'Takeaway'}</div>
            <div><strong>Customer:</strong> ${orderDetails.customerName || 'Guest'}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${cartItems.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>Rs. ${item.price.toFixed(2)}</td>
                  <td>Rs. ${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3">Subtotal</td>
                <td>Rs. ${calculateTotal().toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3">Tax (10%)</td>
                <td>Rs. ${(calculateTotal() * 0.1).toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3">Total Amount</td>
                <td class="total-amount">Rs. ${(calculateTotal() * 1.1).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          
          <div class="footer">
            Thank you for dining with us!<br>
            Please visit again
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.open();
    printWindow.document.write(billContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="order-summary-container">
     
      <div className="order-summary-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <FiArrowLeft /> Back to Menu
        </button>
        <h2>Order Summary</h2>
      </div>
      
      <div className="order-summary-content">
        <div className="order-details-section">
          <div className="order-type-selector">
            <button
              className={`order-type-btn ${orderDetails.orderType === 'dine-in' ? 'active' : ''}`}
              onClick={() => setOrderDetails({...orderDetails, orderType: 'dine-in'})}
            >
              <MdTableRestaurant /> Dine-In
            </button>
            <button
              className={`order-type-btn ${orderDetails.orderType === 'takeaway' ? 'active' : ''}`}
              onClick={() => setOrderDetails({...orderDetails, orderType: 'takeaway'})}
            >
              <MdDeliveryDining /> Takeaway
            </button>
          </div>
          
          {orderDetails.orderType === 'dine-in' && (
            <div className="form-group">
              <label>Table Number</label>
              <select
                value={orderDetails.tableNumber}
                onChange={(e) => setOrderDetails({...orderDetails, tableNumber: e.target.value})}
                className="form-control"
              >
                <option value="">Select Table</option>
                {tables.map(table => (
                  <option key={table._id} value={table.name}>
                    {table.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="form-group">
            <label>Customer Name (Optional)</label>
            <div className="input-with-icon">
              <FaUser className="input-icon" />
              <input
                type="text"
                placeholder="Guest"
                value={orderDetails.customerName}
                onChange={(e) => setOrderDetails({...orderDetails, customerName: e.target.value})}
                className="form-control"
              />
            </div>
          </div>
        </div>
        
        <div className="order-items-section">
          <h3 className="section-title">Order Items</h3>
          {cartItems.length === 0 ? (
            <p className="empty-cart-message">Your cart is empty</p>
          ) : (
            <div className="order-items-list">
              {cartItems.map(item => (
                <div key={item.menuItemId} className="order-item">
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-price">Rs. {item.price.toFixed(2)}</div>
                  </div>
                  <div className="item-controls">
                    <button 
                      onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                    
                    >
                      <FiMinusCircle fontSize={30}/>
                    </button>
                    <span className="item-quantity">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                      
                    >
                      <FiPlusCircle fontSize={30}/>
                    </button>
                    <button 
                      onClick={() => removeFromCart(item.menuItemId)}
                      className="remove-item-btn"
                    >
                      <FiX />
                    </button>
                  </div>
                  <div className="item-total">
                    Rs. {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="order-summary-footer">
          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>Rs. {calculateTotal().toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Tax (10%):</span>
              <span>Rs. {(calculateTotal() * 0.1).toFixed(2)}</span>
            </div>
            <div className="total-row grand-total">
              <span>Total:</span>
              <span>Rs. {(calculateTotal() * 1.1).toFixed(2)}</span>
            </div>
          </div>
          
          <div className="order-actions">
            <button 
              onClick={generateBill}
              className="print-bill-btn"
              disabled={cartItems.length === 0}
            >
              <FiPrinter /> Print Bill
            </button>
            <button 
              onClick={handleOrderSubmit}
              className="place-order-btn"
              disabled={cartItems.length === 0 || (orderDetails.orderType === 'dine-in' && !orderDetails.tableNumber)}
            >
              Place Order
            </button>
          </div>
        </div>
      </div>
      
      {showConfirm && (
        <ConfirmationPopup
          message="Are you sure you want to place this order?"
          onConfirm={confirmOrderSubmit}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

export default OrderSummaryPage;