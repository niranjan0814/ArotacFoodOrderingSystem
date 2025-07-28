import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    phone: '',
  });
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const token = localStorage.getItem('token');

  // Validation functions
  const validateName = (name) => {
    if (!name.trim()) {
      return 'Name is required';
    }
    return '';
  };

  const validatePhone = (phone) => {
    if (phone && !/^\d{10}$/.test(phone)) {
      return 'Phone number must be exactly 10 digits';
    }
    return '';
  };

  useEffect(() => {
    if (!currentUser || !token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const userResponse = await axios.get(`${API_URL}/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = userResponse.data.user;
        setProfileData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
        });

        const ordersResponse = await axios.get(`${API_URL}/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrderHistory(ordersResponse.data.data || []);
      } catch (err) {
        setError('Failed to load profile data. Please try again.');
        console.error('Fetch error:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Validate on change
    if (name === 'name') {
      setFormErrors((prev) => ({ ...prev, name: validateName(value) }));
    } else if (name === 'phone') {
      setFormErrors((prev) => ({ ...prev, phone: validatePhone(value) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    const nameError = validateName(profileData.name);
    const phoneError = validatePhone(profileData.phone);

    setFormErrors({ name: nameError, phone: phoneError });

    if (nameError || phoneError) {
      toast.error('Please correct the errors in the form.');
      return;
    }

    try {
      const updateData = {
        name: profileData.name,
        phone: profileData.phone || null, // Always include phone, set to null if empty
        address: profileData.address,
      };

      const response = await axios.put(
        `${API_URL}/auth/user`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProfileData({
        ...profileData,
        name: response.data.user.name || profileData.name,
        phone: response.data.user.phone || profileData.phone,
        address: response.data.user.address || profileData.address,
      });
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Update failed:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      const errorMessage = err.response?.data?.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (!currentUser) return null;

  if (loading) return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;

  if (error) return <div className="container mx-auto px-4 py-8 text-center text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Profile Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-medium text-primary hover:text-primary/80"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {['name', 'phone', 'address'].map((field) => (
                    <div key={field}>
                      <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </label>
                      <input
                        type={field === 'phone' ? 'tel' : 'text'}
                        id={field}
                        name={field}
                        value={profileData[field]}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border ${
                          formErrors[field] ? 'border-red-500' : 'border-gray-300'
                        } rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                        required={field === 'name'}
                        pattern={field === 'phone' ? '\\d{10}' : undefined}
                        title={field === 'phone' ? 'Phone number must be exactly 10 digits' : undefined}
                      />
                      {formErrors[field] && (
                        <p className="mt-1 text-sm text-red-600">{formErrors[field]}</p>
                      )}
                    </div>
                  ))}

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormErrors({ name: '', phone: '' });
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formErrors.name || formErrors.phone}
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {Object.entries(profileData).map(([key, value]) => (
                  <div key={key}>
                    <h3 className="text-sm font-medium text-gray-500">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </h3>
                    <p className="mt-1">{value || 'Not provided'}</p>
                  </div>
                ))}

                <div className="pt-4 border-t">
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold mb-6">Order History</h2>

            {orderHistory.length > 0 ? (
              <div className="space-y-6">
                {orderHistory.map((order) => (
                  <div key={order._id} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                      <div>
                        <span className="font-medium">{order._id}</span>
                        <span className="text-gray-500 ml-3 text-sm">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${order.status}-100 text-${order.status}-800`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <span className="ml-4 font-medium">Rs. {order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="px-4 py-3">
                      <h4 className="font-medium text-sm text-gray-500 mb-2">Items</h4>
                      <ul className="space-y-2">
                        {order.items?.map((item, index) => (
                          <li key={index} className="flex justify-between text-sm">
                            <span>
                              {item.quantity}x {item.food?.name || 'Unknown Item'}
                            </span>
                            <span className="text-gray-600">
                              Rs. {(item.price * item.quantity).toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="px-4 py-3 bg-gray-50 border-t">
                      <button
                        onClick={() => navigate(`/order/${order._id}`)}
                        className="text-primary hover:text-primary/80 text-sm font-medium"
                      >
                        View Order Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-12 text-gray-500">
                You haven't placed any orders yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;