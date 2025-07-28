import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import axios from "axios";

const MenuPage = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        const foodResponse = await axios.get(`${API_URL}/food`, config);
        const fetchedFoods = Array.isArray(foodResponse.data.data)
          ? foodResponse.data.data
          : [];
        setFoodItems(fetchedFoods);
        setFilteredItems(fetchedFoods);

        // Extract unique categories from the fetched food items
        const uniqueCategories = [
          "all",
          ...new Set(fetchedFoods.map((item) => item.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);
      } catch (err) {
        setError("Failed to load menu data. Please try again.");
        console.error(err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  useEffect(() => {
    let filtered = [...foodItems];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item &&
          ((item.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (item.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by selected category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item?.category === selectedCategory);
    }

    // Filter by price range
    if (minPrice !== "" || maxPrice !== "") {
      const min = minPrice !== "" ? parseFloat(minPrice) : 0;
      const max = maxPrice !== "" ? parseFloat(maxPrice) : Infinity;
      if (!isNaN(min) && !isNaN(max) && min <= max) {
        filtered = filtered.filter(
          (item) => item.price >= min && item.price <= max
        );
      }
    }

    setFilteredItems(filtered);
  }, [selectedCategory, searchQuery, minPrice, maxPrice, foodItems]);

  // Reset price filter
  const resetPriceFilter = () => {
    setMinPrice("");
    setMaxPrice("");
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading menu...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Banner */}
      <div className="relative mb-10 rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=400&q=80"
          alt="Delicious food"
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white">
          <h1 className="text-4xl font-bold mb-2">AROTAC</h1>
          <p className="text-xl">Delicious food delivered to your door</p>
        </div>
      </div>

      {/* Search and Price Filter Row */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-6">
        {/* Search Bar (Left) */}
        <div className="relative w-full sm:w-112">
          <label htmlFor="search" className="sr-only">Search food items</label>
          <input
            id="search"
            type="text"
            placeholder="Search by name or description..."
            className="w-full px-5 py-3 pl-12 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-700 placeholder-gray-400 transition-all duration-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>

        {/* Price Filter (Right) */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex gap-3">
            <div>
              <label htmlFor="minPrice" className="sr-only">Minimum Price</label>
              <input
                id="minPrice"
                type="number"
                placeholder="Min Price"
                className="w-32 px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-700 placeholder-gray-400 transition-all duration-200"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label htmlFor="maxPrice" className="sr-only">Maximum Price</label>
              <input
                id="maxPrice"
                type="number"
                placeholder="Max Price"
                className="w-32 px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-700 placeholder-gray-400 transition-all duration-200"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          {(minPrice !== "" || maxPrice !== "") && (
            <button
              onClick={resetPriceFilter}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
              aria-label="Reset price filter"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Category Filters */}
      <div className="mb-8 flex flex-wrap justify-center gap-3">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedCategory === category
                ? "bg-primary text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Food Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <Link
              to={`/food/${item._id}`}
              key={item._id}
              className="food-card bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
            >
             <img
    src={item.image || "https://via.placeholder.com/300x200"}
    alt={item.name || "Food Item"}
    className="w-full h-48 object-cover"
  />
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-1 text-gray-800">{item.name || "Unnamed Item"}</h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {item.description || "No description available"}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-primary font-bold">Rs.{(item.price || 0).toFixed(2)}</span>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                    {item.category || "Uncategorized"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">No food items found.</p>
          <p className="text-gray-500 mt-2">Try a different search term, category, or price range.</p>
        </div>
      )}
    </div>
  );
};

export default MenuPage;