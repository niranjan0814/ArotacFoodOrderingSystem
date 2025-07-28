import React, { useContext, useState } from "react";
import { CartContext } from "../../Context/CartContext.jsx";
import { FaTrash, FaPlus, FaMinus, FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { FiCreditCard, FiTruck, FiCheckCircle } from "react-icons/fi";
import Navbar from "../HomeDelivery/Navbar.jsx";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Chatbot from "../../components/Chatbot/Chatbot.jsx";
import "./CartPage.css";

const CartPage = () => {
  const {
    cartItems,
    removeFromCart,
    clearCart,
    increaseQuantity,
    decreaseQuantity,
    postOrder,
  } = useContext(CartContext);
  const navigate = useNavigate();

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");

  const [shippingDetails, setShippingDetails] = useState({
    address: "",
    mobile: "",
    notes: ""
  });

  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    name: ""
  });

  // Formatters
  const formatMobile = (value) => {
    const numbers = value.replace(/\D/g, "").slice(0, 10);
    return numbers
      .replace(/(\d{3})(\d{3})(\d{1,4})/, "$1-$2-$3")
      .slice(0, 12);
  };

  const formatCardNumber = (value) => {
    const numbers = value.replace(/\D/g, "").slice(0, 16);
    return numbers.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3) return cleaned.replace(/(\d{2})(\d{1,2})/, "$1/$2");
    return cleaned;
  };

  const formatCVV = (value) => value.replace(/\D/g, "").slice(0, 3);

  const handleNext = () => {
    if (activeStep === 1) {
      if (!shippingDetails.address || !/^\d{3}-\d{3}-\d{4}$/.test(shippingDetails.mobile)) {
        toast.error("Please provide a valid address and mobile number (10 digits).");
        return;
      }
    }
    if (activeStep === 2 && paymentMethod === "card") {
      const digitsOnlyCard = cardDetails.cardNumber.replace(/\s/g, "");
      if (
        digitsOnlyCard.length !== 16 ||
        !/^\d{2}\/\d{2}$/.test(cardDetails.expiry) ||
        cardDetails.cvv.length !== 3 ||
        !cardDetails.name
      ) {
        toast.error("Please enter valid card details.");
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handlePaymentConfirm = async () => {
    setIsProcessing(true);
    const userId = localStorage.getItem("userId");
    if (!userId) {
      toast.error("User not authenticated");
      setIsProcessing(false);
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      setIsProcessing(false);
      return;
    }

    if (!shippingDetails.address || !shippingDetails.mobile) {
      toast.error("Please provide complete shipping details");
      setIsProcessing(false);
      return;
    }

    try {
      await postOrder({
        userId,
        address: shippingDetails.address,
        phoneNumber: shippingDetails.mobile.replace(/-/g, ''),
        orderItems: cartItems,
        paymentMethod,
        notes: shippingDetails.notes
      });

      toast.success(
        <div>
          <FiCheckCircle style={{ marginRight: "8px" }} />
          Order placed successfully!
        </div>
      );
      clearCart();
      setIsPayModalOpen(false);
      setActiveStep(1);
      navigate("/order");
    } catch (error) {
      console.error("Order submission failed:", error);
      toast.error(
        <div>
          <FiCheckCircle style={{ marginRight: "8px" }} />
          Failed to place order. Please try again.
        </div>
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="cart-page">
      <Chatbot />
      <Navbar />
      
      <div className="cart-container">
        {/* Main Cart Content */}
        <div className="cart-items-container">
          <div className="cart-header">
            <h1 className="cart-title">Your Cart</h1>
            <span className="cart-count">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <h3 className="empty-cart-title">Your cart is empty</h3>
              <p className="empty-cart-message">Looks like you haven't added anything to your cart yet</p>
              <button 
                onClick={() => navigate("/foodList")} 
                className="browse-menu-btn"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div>
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="cart-item-image"
                  />
                  
                  <div className="cart-item-details">
                    <div className="cart-item-header">
                      <div>
                        <h3 className="cart-item-name">{item.name}</h3>
                        <p className="cart-item-category">Category: {item.category}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="delete-btn"
                      >
                        <FaTrash />
                      </button>
                    </div>
                    
                    <div className="cart-item-actions">
                      <div className="quantity-control">
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          className="quantity-btn"
                        >
                          <FaMinus />
                        </button>
                        <span className="quantity-display">{item.quantity}</span>
                        <button
                          onClick={() => increaseQuantity(item.id)}
                          className="quantity-btn"
                        >
                          <FaPlus />
                        </button>
                      </div>
                      
                      <p className="cart-item-price">Rs. {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Order Notes */}
          
        </div>
        
        {/* Order Summary */}
        {cartItems.length > 0 && (
          <div className="order-summary">
            <h3 className="order-summary-title">Order Summary</h3>
            
            <div style={{ marginBottom: "24px" }}>
              <div className="summary-row">
                <span className="summary-label">Subtotal</span>
                <span className="summary-value">Rs. {totalPrice.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Delivery Fee</span>
                <span className="summary-value">Rs. 150.00</span>
              </div>
              <div className="summary-row summary-divider">
                <span className="summary-label">Tax (5%)</span>
                <span className="summary-value">Rs. {(totalPrice * 0.05).toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label summary-total">Total</span>
                <span className="summary-value summary-total">Rs. {(totalPrice * 1.05 + 150).toFixed(2)}</span>
              </div>
            </div>
            
            <button
              onClick={() => setIsPayModalOpen(true)}
              className="checkout-btn"
            >
              Proceed to Checkout
            </button>
            
            <div className="terms-text">
              <p>By placing your order, you agree to our <a href="#" className="terms-link">Terms of Service</a></p>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {isPayModalOpen && (
        <div className="payment-modal">
          <div className="modal-content">
            {/* Progress Steps */}
            <div className="progress-steps">
              <div className="progress-line"></div>
              {[1, 2, 3].map((step) => (
                <div key={step} className="step">
                  <div className={activeStep >= step ? "step-active" : "step-inactive"}>
                    {step}
                  </div>
                  <div className="step-label">
                    {step === 1 ? 'Shipping' : step === 2 ? 'Payment' : 'Confirm'}
                  </div>
                </div>
              ))}
            </div>

            {/* Step 1: Shipping */}
            {activeStep === 1 && (
              <div>
                <h3 className="section-title">
                  <FiTruck />
                  Delivery Information
                </h3>
                
                <div className="form-group">
                  <label className="form-label">Delivery Address</label>
                  <input
                    type="text"
                    placeholder="Enter your full address"
                    value={shippingDetails.address}
                    onChange={(e) => setShippingDetails({...shippingDetails, address: e.target.value})}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="123-456-7890"
                    value={shippingDetails.mobile}
                    onChange={(e) => setShippingDetails({...shippingDetails, mobile: formatMobile(e.target.value)})}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Delivery Notes (Optional)</label>
                  <textarea
                    placeholder="Any special delivery instructions?"
                    value={shippingDetails.notes}
                    onChange={(e) => setShippingDetails({...shippingDetails, notes: e.target.value})}
                    className="form-input"
                    rows="2"
                  ></textarea>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {activeStep === 2 && (
              <div>
                <h3 className="section-title">
                  <FiCreditCard />
                  Payment Method
                </h3>
                
                <div className="payment-methods">
                  <div
                    onClick={() => setPaymentMethod("card")}
                    className={`payment-method ${paymentMethod === "card" ? "payment-method-active" : ""}`}
                  >
                    <span style={{ marginRight: "8px" }}>💳</span> Card
                  </div>
                  <div
                    onClick={() => setPaymentMethod("cash")}
                    className={`payment-method ${paymentMethod === "cash" ? "payment-method-active" : ""}`}
                  >
                    <span style={{ marginRight: "8px" }}>💰</span> Cash on Delivery
                  </div>
                </div>
                
                {paymentMethod === "card" && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Card Number</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.cardNumber}
                        onChange={(e) => setCardDetails({...cardDetails, cardNumber: formatCardNumber(e.target.value)})}
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Name on Card</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                        className="form-input"
                      />
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div className="form-group">
                        <label className="form-label">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({...cardDetails, expiry: formatExpiry(e.target.value)})}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({...cardDetails, cvv: formatCVV(e.target.value)})}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {paymentMethod === "cash" && (
                  <div className="cash-notice">
                    <p>You'll pay with cash when your order arrives. Please have exact change ready.</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Confirmation */}
            {activeStep === 3 && (
              <div>
                <div className="confirmation-icon">
                  <FiCheckCircle />
                </div>
                <h3 className="section-title" style={{ textAlign: "center", justifyContent: "center" }}>
                  Review Your Order
                </h3>
                <p style={{ textAlign: "center", color: "#6c757d", marginBottom: "24px" }}>
                  Please confirm your details before placing the order
                </p>
                
                <div className="confirmation-details">
                  <div className="confirmation-row">
                    <span>Delivery to:</span>
                    <span style={{ fontWeight: "500" }}>{shippingDetails.address}</span>
                  </div>
                  <div className="confirmation-row">
                    <span>Contact:</span>
                    <span style={{ fontWeight: "500" }}>{shippingDetails.mobile}</span>
                  </div>
                  <div className="confirmation-row">
                    <span>Payment:</span>
                    <span style={{ fontWeight: "500" }}>{paymentMethod === "card" ? "Credit/Debit Card" : "Cash on Delivery"}</span>
                  </div>
                  <div className="confirmation-divider"></div>
                  <div className="confirmation-row">
                    <span>Total:</span>
                    <span style={{ fontWeight: "700", fontSize: "18px" }}>Rs. {(totalPrice * 1.05 + 150).toFixed(2)}</span>
                  </div>
                </div>
                
                {shippingDetails.notes && (
                  <div className="special-instructions">
                    <h4 className="instructions-label">Special Instructions:</h4>
                    <p className="instructions-text">{shippingDetails.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="modal-footer">
              <button
                onClick={() => {
                  if (activeStep === 1) {
                    setIsPayModalOpen(false);
                  } else {
                    handleBack();
                  }
                }}
                className="back-btn"
              >
                <FaChevronLeft style={{ marginRight: "8px" }} />
                {activeStep === 1 ? 'Cancel' : 'Back'}
              </button>
              
              {activeStep < 3 ? (
                <button
                  onClick={handleNext}
                  className="next-btn"
                >
                  Next
                  <FaChevronRight style={{ marginLeft: "8px" }} />
                </button>
              ) : (
                <button
                  onClick={handlePaymentConfirm}
                  disabled={isProcessing}
                  className="confirm-btn"
                >
                  {isProcessing ? (
                    <>
                      <svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="31.415, 31.415" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle style={{ marginRight: "8px" }} />
                      Confirm Order
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;