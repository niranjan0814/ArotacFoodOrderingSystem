import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FiPlusCircle, FiMinus, FiX, FiPrinter, FiArrowLeft, FiSave,FiSearch ,FiMinusCircle  } from "react-icons/fi";
import { MdTableRestaurant, MdDeliveryDining } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import ConfirmationPopup from "./ConfirmationPopup";
import "./OrderSummaryPage.css";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function EditOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orderDetails, setOrderDetails] = useState({
    tableNumber: "",
    customerName: "",
    orderType: "dine-in",
    status: "pending"
  });
  const [tables, setTables] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    menuItemId: "",
    quantity: 1
  });

  useEffect(() => {
    fetchOrder();
    fetchActiveTables();
    fetchMenuItems();
  }, []);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter menu items based on search term
  const filteredMenuItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // In your fetchOrder function
const fetchOrder = async () => {
    if (!id) {
      toast.error("No order ID provided");
      navigate('/orders');
      return;
    }
  
    try {
      const response = await axios.get(`http://localhost:5000/api/orders/${id}`);
      const orderData = response.data;
      
      // Transform items to ensure consistent structure
      const transformedItems = orderData.items.map(item => ({
        menuItemId: item.menuItem?._id || item.menuItemId,
        name: item.menuItem?.name || item.name,
        price: item.menuItem?.price || item.price,
        quantity: item.quantity
      }));
  
      setOrder(orderData);
      setCartItems(transformedItems);
      setOrderDetails({
        tableNumber: orderData.tableNumber || "",
        customerName: orderData.customerName || "",
        orderType: orderData.orderType,
        status: orderData.status
      });
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Error fetching order details. Please try again.");
      navigate('/orders');
    }
  };

  const fetchActiveTables = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/tables/");
      const activeTables = response.data.tables.filter(table => table.status === 'Active');
      setTables(activeTables);
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast.error("Error fetching tables. Please try again.");
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/menu?isVisible=true");
      // Verify the response structure
      console.log("Menu items fetched:", response.data);
      setMenuItems(response.data);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast.error("Error fetching menu items. Please try again.");
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

  const handleAddItem = () => {
    const selectedMenuItem = menuItems.find(item => item._id === newItem.menuItemId);
    if (!selectedMenuItem) return;

    const existingItem = cartItems.find(item => item.menuItemId === newItem.menuItemId);
    
    if (existingItem) {
      updateQuantity(newItem.menuItemId, existingItem.quantity + newItem.quantity);
    } else {
      setCartItems(prevItems => [
        ...prevItems,
        {
          menuItemId: selectedMenuItem._id,
          name: selectedMenuItem.name,
          price: selectedMenuItem.price,
          quantity: newItem.quantity
        }
      ]);
    }
    
    setNewItem({ menuItemId: "", quantity: 1 });
    setShowAddItemModal(false);
  };

  const handleSaveOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Please add items to the order");
      return;
    }
    
    if (orderDetails.orderType === "dine-in" && !orderDetails.tableNumber) {
      toast.error("Please select a table number for dine-in orders");
      return;
    }
    
    setShowConfirm(true);
  };

 


  const confirmSaveOrder = async () => {
    try {
      const updatedOrder = {
        tableNumber: orderDetails.tableNumber,
        customerName: orderDetails.customerName,
        orderType: orderDetails.orderType,
        status: orderDetails.status,
        items: cartItems.map(item => ({
          menuItemId: item.menuItemId, // Keep as menuItemId
          quantity: item.quantity
          // Don't send name/price - backend will get them
        }))
        // Don't send totalAmount - backend will calculate
      };
  
      console.log("Sending update:", updatedOrder);
  
      const response = await axios.put(
        `http://localhost:5000/api/orders/${id}`,
        updatedOrder
      );
      
      toast.success("Order updated successfully!");
      navigate('/orders');
    } catch (error) {
      console.error("Full error:", {
        message: error.message,
        response: error.response?.data,
        config: error.config
      });
      toast.error(`Update failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setShowConfirm(false);
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
            <div><strong>Order #:</strong> ${order?.orderNumber}</div>
            <div><strong>Order Type:</strong> ${orderDetails.orderType === 'dine-in' ? `Dine-In (Table ${orderDetails.tableNumber})` : 'Takeaway'}</div>
            <div><strong>Customer:</strong> ${orderDetails.customerName || 'Guest'}</div>
            <div><strong>Status:</strong> ${orderDetails.status}</div>
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

  if (!order) {
    return <div className="order-summary-container">Loading...</div>;
  }

  return (
    <div className="order-summary-container">
      <div className="order-summary-header">
        <button onClick={() => navigate('/orders')} className="back-button">
          <FiArrowLeft /> Back to Orders
        </button>
        <h2>Edit Order #{order.orderNumber}</h2>
      </div>
      
      <div className="order-summary-content">
        <div className="order-details-section">
          <div className="form-group">
            <label>Order Status</label>
            <select
              value={orderDetails.status}
              onChange={(e) => setOrderDetails({...orderDetails, status: e.target.value})}
              className="form-control"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>

            </select>
          </div>

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
          <div className="section-header">
            <h3 className="section-title">Order Items</h3>
            <button 
              onClick={() => setShowAddItemModal(true)}
              
            >
              <FiPlusCircle fontSize={30}/> Add Item
            </button>
          </div>
          
          {cartItems.length === 0 ? (
            <p className="empty-cart-message">No items in this order</p>
          ) : (
            <div className="order-items-list">
              {/* In your order-items-list */}
{cartItems.map((item) => (
  <div key={item.menuItemId} className="order-item"> {/* Use menuItemId as key */}
    <div className="item-info">
      <div className="item-name">{item.name}</div>
      <div className="item-price">Rs. {item.price?.toFixed(2) || '0.00'}</div>
    </div>
    <div className="item-controls">
      <button 
        onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
         aria-label="Decrease quantity"
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
              onClick={handleSaveOrder}
              className="place-order-btn"
              disabled={cartItems.length === 0 || (orderDetails.orderType === 'dine-in' && !orderDetails.tableNumber)}
            >
              <FiSave /> Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Menu Item ({filteredMenuItems.length} of {menuItems.length})</h3>
              <button 
                onClick={() => setShowAddItemModal(false)}
                className="close-modal-btn"
              >
                ×
              </button>
            </div>
            
            {/* Search input */}
            <div className="search-container">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="menu-items-list1">
              {filteredMenuItems.length > 0 ? (
                filteredMenuItems.map(item => (
                  <div 
                    key={item._id} 
                    className={`menu-item-card1 ${newItem.menuItemId === item._id ? 'selected' : ''}`}
                    onClick={() => setNewItem({...newItem, menuItemId: item._id})}
                  >
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="item-image1"
                      />
                    ) : (
                      <div className="item-image-placeholder1">
                        <span>No Image</span>
                      </div>
                    )}
                    <div className="item-details1">
                      <h4>{item.name}</h4>
                      <p className="item-category1">{item.category}</p>
                      <p className="item-price1">Rs. {item.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-items-message1">No items found matching your search</p>
              )}
            </div>

            <div className="quantity-control-container">
              <label>Quantity</label>
              <div className="quantity-control">
                <button 
                  onClick={() => setNewItem({...newItem, quantity: Math.max(1, newItem.quantity - 1)})}
                  
                >
                  <FiMinusCircle fontSize={30} />
                </button>
                <span className="quantity-display">{newItem.quantity}</span>
                <button 
                  onClick={() => setNewItem({...newItem, quantity: newItem.quantity + 1})}
                  
                >
                  <FiPlusCircle fontSize={30}/>
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowAddItemModal(false);
                  setSearchTerm('');
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  handleAddItem();
                  setSearchTerm('');
                }}
                className="confirm-btn"
                disabled={!newItem.menuItemId}
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showConfirm && (
        <ConfirmationPopup
          message="Are you sure you want to save these changes to the order?"
          onConfirm={confirmSaveOrder}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

export default EditOrderPage;