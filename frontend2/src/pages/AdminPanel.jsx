import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPanel = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showLowInventory, setShowLowInventory] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    quantityAvailable: '',
    image: null,
  });
  const [message, setMessage] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const LOW_INVENTORY_THRESHOLD = 10;

  // Fetch food items
  const fetchFoods = async () => {
    try {
      const res = await axios.get(`${API_URL}/food`);
      console.log('Fetched foods:', res.data.data);
      setFoods(res.data?.data.map(food => ({
        ...food,
        quantityAvailable: food.quantityAvailable ?? 0
      })) || []);
    } catch (err) {
      console.error('Error fetching foods:', err);
      setError('Failed to load food items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file input
  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, description, price, category, quantityAvailable, image } = formData;

    if (!name || !description || !price || !category || quantityAvailable === '') {
      return setMessage('All fields are required!');
    }

    const qty = parseInt(quantityAvailable);
    if (isNaN(qty) || qty < 0) {
      return setMessage('Quantity available must be a non-negative number');
    }

    const uploadData = new FormData();
    uploadData.append('name', name);
    uploadData.append('description', description);
    uploadData.append('price', price);
    uploadData.append('category', category);
    uploadData.append('quantityAvailable', qty);
    if (image) uploadData.append('image', image);

    try {
      if (editingId) {
        const res = await axios.put(`${API_URL}/food/${editingId}`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('PUT response:', res.data.data);
        // Refresh the entire list to ensure latest data
        await fetchFoods();
        setMessage('Food item updated successfully!');
        setEditingId(null);
      } else {
        const res = await axios.post(`${API_URL}/food`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setFoods([{ ...res.data.data, quantityAvailable: res.data.data.quantityAvailable ?? 0 }, ...foods]);
        setMessage('Food item added successfully!');
      }

      setFormData({ name: '', description: '', price: '', category: '', quantityAvailable: '', image: null });
    } catch (error) {
      console.error('Error saving food:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save food item.';
      setMessage(errorMessage);
    }
  };

  // Delete item
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/food/${id}`);
      setFoods(foods.filter((food) => food._id !== id));
      setMessage('Food item deleted successfully!');
    } catch (error) {
      console.error('Error deleting food:', error);
      setMessage('Failed to delete food item.');
    }
  };

  // Edit mode
  const handleEdit = (food) => {
    setEditingId(food._id);
    setFormData({
      name: food.name,
      description: food.description,
      price: food.price.toString(),
      category: food.category,
      quantityAvailable: (food.quantityAvailable ?? 0).toString(),
      image: null,
    });
  };

  // Filter foods based on low inventory
  const displayedFoods = showLowInventory
    ? foods.filter((food) => food.quantityAvailable < LOW_INVENTORY_THRESHOLD)
    : foods;

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Restaurant Inventory Management</h1>

      {message && (
        <div className={`p-4 mb-4 rounded-lg ${message.includes('Failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Food Table */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Menu Items</h2>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showLowInventory}
              onChange={() => setShowLowInventory(!showLowInventory)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="text-gray-700">Show Low Inventory Only</span>
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-3 text-left">Image</th>
                <th className="border p-3 text-left">Name</th>
                <th className="border p-3 text-left">Description</th>
                <th className="border p-3 text-left">Price</th>
                <th className="border p-3 text-left">Category</th>
                <th className="border p-3 text-left">Available Qty</th>
                <th className="border p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedFoods.length > 0 ? (
                displayedFoods.map((food) => (
                  <tr key={food._id} className="hover:bg-gray-50">
                    <td className="border p-3">
                      {food.image ? (
                        <img
                          src={`${API_URL}${food.image}`}
                          alt={food.name}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => { e.target.src = '/images/fallback-image.jpg'; }}
                        />
                      ) : (
                        <img
                          src="/images/fallback-image.jpg"
                          alt="No image"
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                    </td>
                    <td className="border p-3">{food.name}</td>
                    <td className="border p-3">{food.description}</td>
                    <td className="border p-3">Rs.{food.price.toFixed(2)}</td>
                    <td className="border p-3">{food.category || 'N/A'}</td>
                    <td className={`border p-3 ${food.quantityAvailable < LOW_INVENTORY_THRESHOLD ? 'text-red-600 font-semibold' : ''}`}>
                      {food.quantityAvailable ?? 0}
                    </td>
                    <td className="border p-3 space-x-2">
                      <button
                        onClick={() => handleEdit(food)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleDelete(food._id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center p-4 text-gray-500">
                    {showLowInventory ? 'No items with low inventory.' : 'No menu items found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Update Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {editingId ? 'Update Menu Item' : 'Add New Menu Item'}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          encType="multipart/form-data"
        >
          <div>
            <label className="block mb-1 text-gray-700 font-medium">Item Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-700 font-medium">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-700 font-medium">Price (Rs)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-700 font-medium">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Category</option>
              <option value="Chinese">Chinese</option>
              <option value="Indian">Indian</option>
              <option value="Sri Lankan">Sri Lankan</option>
              <option value="Italian">Italian</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-700 font-medium">Available Quantity</label>
            <input
              type="number"
              name="quantityAvailable"
              value={formData.quantityAvailable}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-700 font-medium">Image (optional)</label>
            <input
              type="file"
              name="image"
              onChange={handleFileChange}
              className="border border-gray-300 p-2 w-full rounded"
              accept="image/jpeg,image/png"
            />
          </div>
          <div className="col-span-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition w-full md:w-auto"
            >
              {editingId ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;