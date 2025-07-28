import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, ChevronLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const FoodDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedFood, setSelectedFood] = useState(null);
  const [categoryFoods, setCategoryFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const IMAGE_URL = `${API_URL}`;

  useEffect(() => {
    const fetchFoodDetails = async () => {
      try {
        setLoading(true);
        const { data: foodRes } = await axios.get(`${API_URL}/food/${id}`);
        const foodData = foodRes.data;
        setSelectedFood(foodData);

        const { data: allFoods } = await axios.get(`${API_URL}/food`);
        const filtered = allFoods.data
          .filter((item) => item.category === foodData.category && item._id !== id)
          .slice(0, 4);
        setCategoryFoods(filtered);
      } catch (err) {
        setError('Failed to load food details');
      } finally {
        setLoading(false);
      }
    };

    fetchFoodDetails();
  }, [id]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const incrementQuantity = () => {
    if (selectedFood && quantity >= (selectedFood.quantityAvailable ?? 0)) {
      showToast('Cannot exceed available quantity');
      return;
    }
    setQuantity((prev) => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handleAddToCart = () => {
    if (selectedFood) {
      addToCart(selectedFood, quantity, 'takeaway'); // Defaulted to 'takeaway'
      showToast('Added to cart!:',{ ...selectedFood, quantity });
    }
  };
  const handleViewCart = () => {
    navigate("/cart");
  };

  if (loading)
    return <div className="text-center py-12 text-lg">Loading food details...</div>;
  if (error || !selectedFood)
    return (
      <div className="text-center py-12 text-red-600">
        {error || 'Food not found'}
      </div>
    );

  const isAvailable = (selectedFood.quantityAvailable ?? 0) >= 5;

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg z-50 shadow-md">
          {toastMessage}
        </div>
      )}

      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 mb-6">
        <ChevronLeft size={20} />
        <span className="ml-1">Back to Menu</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="rounded-lg overflow-hidden shadow-md">
          <img
  src={selectedFood.image || 'https://via.placeholder.com/600x400.png?text=Food+Image'}
  alt={selectedFood.name || 'Food Item'}
  className="w-full h-64 md:h-96 object-cover"
  onError={(e) => {
    e.target.src = 'https://via.placeholder.com/600x400.png?text=Food+Image';
  }}
/>
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">{selectedFood.name}</h1>
          <p className="text-2xl text-primary font-bold mb-2">
            Rs.{selectedFood.price.toFixed(2)}
          </p>
          <p className="text-gray-700 mb-4">{selectedFood.description}</p>
          {isAvailable && (
            <p className="text-gray-700 mb-6">
              <span className="font-semibold"></span>{' '}
              
            </p>
          )}

          {isAvailable ? (
            // increasement
                      //button bug

            <>  
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Quantity</h3>
                <div className="flex items-center">
                  <button
                    onClick={decrementQuantity}
                    className="w-10 h-10 bg-gray-200 rounded-full flex justify-center items-center"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="mx-4 text-xl font-semibold">{quantity}</span>
                  <button
                    onClick={incrementQuantity}
                    className="w-10 h-10 bg-gray-200 rounded-full flex justify-center items-center"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex justify-center items-center mb-6"
              >
                <ShoppingCart size={20} className="mr-2" />
                Add to Cart - Rs.{(selectedFood.price * quantity).toFixed(2)}
              </button>

              <button
                onClick={handleViewCart}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex justify-center items-center"
              >
                <ShoppingCart size={20} className="mr-2" />
                View Cart
              </button>
            </>
          ) : (
            <p className="text-red-600 font-semibold text-lg">Item Not Available</p>
          )}
        </div>
      </div>

      {categoryFoods.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">You may also like</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {categoryFoods.map((food) => (
              <div key={food._id} className="shadow-md rounded-lg overflow-hidden">
               <img
  src={food.image || 'https://via.placeholder.com/600x400.png?text=Food+Image'}
  alt={food.name || 'Food Item'}
  className="w-full h-40 object-cover"
  onError={(e) => {
    e.target.src = 'https://via.placeholder.com/600x400.png?text=Food+Image';
  }}
/>
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{food.name}</h3>
                  <p className="text-primary font-bold">Rs.{food.price.toFixed(2)}</p>
                  <button
                    onClick={() => navigate(`/food/${food._id}`)}
                    className="mt-2 w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodDetailsPage;
