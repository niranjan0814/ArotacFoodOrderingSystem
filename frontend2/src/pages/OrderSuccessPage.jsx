import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="text-green-600" size={32} />
        </div>
        <h1 className="text-3xl font-bold mb-4">Order Placed Successfully!</h1>
        <p className="text-gray-700 mb-6">
          Thank you for your order. Your order ID is <strong>{orderId || 'N/A'}</strong>.
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default OrderSuccessPage;