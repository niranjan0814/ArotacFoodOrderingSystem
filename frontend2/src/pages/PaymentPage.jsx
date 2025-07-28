
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

const PaymentPage = () => {
  const { getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formattedValue = value
        .replace(/\s/g, '')
        .replace(/\D/g, '')
        .replace(/(.{4})/g, '$1 ')
        .trim();
      
      setCardDetails(prev => ({
        ...prev,
        [name]: formattedValue.substring(0, 19) // Limit to 16 digits + 3 spaces
      }));
    } 
    // Format expiry date
    else if (name === 'expiryDate') {
      const formattedValue = value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/g, '$1/$2')
        .substring(0, 5);
      
      setCardDetails(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    }
    // Format CVV
    else if (name === 'cvv') {
      setCardDetails(prev => ({
        ...prev,
        [name]: value.replace(/\D/g, '').substring(0, 3)
      }));
    } 
    else {
      setCardDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when field is being typed
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!cardDetails.cardNumber.trim() || cardDetails.cardNumber.replace(/\s/g, '').length < 16) {
      newErrors.cardNumber = 'Valid card number is required';
    }
    
    if (!cardDetails.cardName.trim()) {
      newErrors.cardName = 'Name on card is required';
    }
    
    if (!cardDetails.expiryDate.trim() || !cardDetails.expiryDate.includes('/')) {
      newErrors.expiryDate = 'Valid expiry date is required (MM/YY)';
    } else {
      const [month, year] = cardDetails.expiryDate.split('/');
      const currentYear = new Date().getFullYear() % 100; // Get last 2 digits
      const currentMonth = new Date().getMonth() + 1; // Jan is 0
      
      if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        newErrors.expiryDate = 'Card has expired';
      }
    }
    
    if (!cardDetails.cvv.trim() || cardDetails.cvv.length < 3) {
      newErrors.cvv = 'Valid CVV is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsProcessing(true);
      
      // Simulate payment processing
      setTimeout(() => {
        // In a real app, this would make an API call to process payment
        console.log('Payment processed:', { ...cardDetails });
        
        setIsProcessing(false);
        setPaymentSuccess(true);
        
        // Clear cart and redirect after successful payment
        setTimeout(() => {
          clearCart();
          navigate('/');
        }, 3000);
      }, 2000);
    }
  };
  
  const totalAmount = getCartTotal() + (getCartTotal() * 0.1);
  
  if (paymentSuccess) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your order has been placed successfully. You will be redirected to the menu page shortly.
          </p>
          <p className="text-gray-500 mb-4">
            Order amount: Rs. {totalAmount.toFixed(2)}
          </p>
          <button
            onClick={() => {
              clearCart();
              navigate('/');
            }}
            className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Payment</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Form */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold mb-6">Credit Card Information</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6 p-4 bg-blue-50 rounded-lg flex items-center">
                <CreditCard className="text-blue-500 mr-3" />
                <p className="text-blue-800 text-sm">
                  All transactions are secure and encrypted.
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="cardNumber" className="block text-gray-700 font-medium mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.cardNumber}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
              </div>
              
              <div className="mb-4">
                <label htmlFor="cardName" className="block text-gray-700 font-medium mb-2">
                  Name on Card
                </label>
                <input
                  type="text"
                  id="cardName"
                  name="cardName"
                  placeholder="Devid Smith"
                  value={cardDetails.cardName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.cardName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.cardName && <p className="text-red-500 text-sm mt-1">{errors.cardName}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="expiryDate" className="block text-gray-700 font-medium mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    id="expiryDate"
                    name="expiryDate"
                    placeholder="MM/YY"
                    value={cardDetails.expiryDate}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>}
                </div>
                <div>
                  <label htmlFor="cvv" className="block text-gray-700 font-medium mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    id="cvv"
                    name="cvv"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.cvv ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.cvv && <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>}
                </div>
              </div>
              
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={isProcessing}
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    `Pay LKR ${totalAmount.toFixed(2)}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-800 font-medium">LKR{getCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600"> Service charge Fee</span>
                <span className="text-gray-800 font-medium">LKR 0.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-800 font-medium">LKR {(getCartTotal() * 0.1).toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-lg font-bold">
                  LKR {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                By continuing with the payment, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
