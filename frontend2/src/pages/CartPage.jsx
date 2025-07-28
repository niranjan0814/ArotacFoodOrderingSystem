import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft, Plus, Minus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Button } from "@/components/ui/button.jsx";
import { useToast } from "@/components/ui/use-toast";

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  const { isAuthenticated, logout } = useAuth(); // Added logout from useAuth
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const IMAGE_URL = API_URL;
  const token = localStorage.getItem('token');

  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity >= 1) {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleCheckout = async () => {
    if (!isAuthenticated || !token) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to proceed to checkout.",
      });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    setLoading(true);

    try {
      console.log('Cart before checkout:', JSON.stringify(cart, null, 2));

      const invalidItems = cart.filter(
        (item) =>
          !item._id ||
          !isValidObjectId(item._id) ||
          !item.quantity ||
          item.quantity < 1 ||
          !item.price ||
          item.price < 0
      );
      if (invalidItems.length > 0) {
        console.log('Invalid cart items:', JSON.stringify(invalidItems, null, 2));
        toast({
          variant: "destructive",
          title: "Invalid Cart",
          description: "Some items have invalid details. Please check and try again.",
        });
        setLoading(false);
        return;
      }

      const orderData = {
        items: cart.map((item) => ({
          food: item._id,
          quantity: item.quantity,
          price: item.price,
          orderType: 'takeaway',
        })),
        totalAmount: Number((getCartTotal() + getCartTotal() * 0.1).toFixed(2)),
        paymentMethod: 'pending',
      };

      console.log('Sending orderData:', JSON.stringify(orderData, null, 2));
      console.log('Authorization token:', token);

      const response = await axios.post(`${API_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        toast({
          title: "Order Created",
          description: "Proceeding to checkout.",
        });
        navigate('/checkout', { state: { orderId: response.data.data._id } });
      } else {
        toast({
          variant: "destructive",
          title: "Checkout Failed",
          description: response.data.message || "An unknown error occurred.",
        });
      }
    } catch (err) {
      console.error('Checkout error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        headers: err.response?.headers,
      });
      if (err.response?.status === 401) {
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
        });
        logout(); // Clear auth state and token
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const errorMessage = err.response?.data?.message || 'Failed to initiate checkout. Please try again.';
        toast({
          variant: "destructive",
          title: "Checkout Error",
          description: errorMessage,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
          <Link to="/" className="inline-flex items-center text-primary hover:underline">
            <ArrowLeft className="mr-2" size={16} />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {cart.map((item) => (
                <li
                  key={item._id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <img
  src={item.image || 'https://via.placeholder.com/64?text=Food+Image'}
  alt={item.name || 'Food Item'}
  className="w-16 h-16 object-cover rounded mr-4"
  onError={(e) => {
    e.target.src = 'https://via.placeholder.com/64?text=Food+Image';
  }}
/>
                    <div>
                      <h3 className="font-medium text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                    >
                      <Minus size={16} />
                    </Button>
                    <span className="mx-2 w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-800 font-medium">
                      Rs.{(item.price * item.quantity).toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item._id)}
                      className="text-gray-400 hover:text-red-500 ml-4"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-6 py-4 bg-gray-50">
              <Link to="/" className="inline-flex items-center text-primary hover:underline">
                <ArrowLeft className="mr-2" size={16} />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-800 font-medium">Rs.{getCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (10%)</span>
                <span className="text-gray-800 font-medium">Rs.{(getCartTotal() * 0.1).toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 mt-3 flex justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold">
                  Rs.{(getCartTotal() + getCartTotal() * 0.1).toFixed(2)}
                </span>
              </div>
            </div>
            <Button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Proceed to Checkout'}
            </Button>
            <Button
              variant="destructive"
              onClick={clearCart}
              className="w-full mt-4"
            >
              Cancel Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;