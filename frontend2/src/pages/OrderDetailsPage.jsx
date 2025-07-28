import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const OrderDetailsPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`${API_URL}/orders/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        console.log('Order data:', response.data);
        setOrder(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load order details');
        if (!token && err.response?.status === 401) {
          setError('Please log in to view order details or this order may be a guest order.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link to="/profile" className="text-primary hover:text-primary/80 font-medium">
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  // Determine orderType from the first item (assuming all items have the same orderType)
  const orderType = order.items[0]?.orderType || 'unknown';
  const displayTableNumber = order.tableNumber || order.guestDetails?.tableNumber;


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Order #{order._id}</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Order Details</h2>
            <p className="text-gray-600">
             {/* status */}
              <span className="font-medium">Status:</span>{' '}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  order.status === 'delivered'
                    ? 'bg-green-100 text-green-800'
                    : order.status === 'processing'
                    ? 'bg-blue-100 text-blue-800'
                    : order.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Date:</span>{' '}
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Total:</span> Rs.{order.totalAmount.toFixed(2)}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Payment Method:</span>{' '}
              {order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Order Type:</span>{' '}
              {orderType.charAt(0).toUpperCase() + orderType.slice(1)}
            </p>
            {orderType === 'dine-in' && (
              <p className="text-gray-600">
                <span className="font-medium">Table Number:</span>{' '}
                {displayTableNumber || 'Not provided'}
              </p>
            )}
            {orderType === 'takeaway' && (
              <p className="text-gray-600">
                <span className="font-medium">Delivery Address:</span>{' '}
                {order.deliveryAddress || order.guestDetails?.address || 'Not provided'}
              </p>
            )}
            {order.guestDetails && (
              <>
                <p className="text-gray-600">
                  <span className="font-medium">Guest Name:</span>{' '}
                  {order.guestDetails.name || 'Not provided'}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Guest Phone:</span>{' '}
                  {order.guestDetails.phone || 'Not provided'}
                </p>
              </>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Items</h2>
            <ul className="space-y-3">
              {order.items.map((item, index) => (
                <li key={index} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium text-gray-800">
                      {item.quantity}x {item.food.name}
                    </p>
                    <p className="text-sm text-gray-500">Rs.{item.price.toFixed(2)} each</p>
                  </div>
                  <span className="text-gray-700 font-medium">
                    Rs.{(item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Link
            to="/profile"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Back to Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;