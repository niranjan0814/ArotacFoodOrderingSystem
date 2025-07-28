import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import {
  FaSpinner,
  FaUserPlus,
  FaMotorcycle,
  FaCar,
  FaBicycle,
  FaSearch,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { MdDeliveryDining, MdCancel } from "react-icons/md";
import { RiStarFill, RiStarHalfFill, RiStarLine } from "react-icons/ri";

const DeliveryPersonList = () => {
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    vehicleNumber: "",
    vehicleType: "bike",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showPopup, setShowPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeliveryPersons();
  }, []);

  const fetchDeliveryPersons = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/delivery-persons");
      setDeliveryPersons(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch delivery persons. Please check your network or server status and try again later.");
      toast.error("Failed to fetch delivery persons!");
      setLoading(false);
    }
  };

  const validateForm = async () => {
    const errors = {};
    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^0[0-9]{9}$/;
    const vehicleNumberRegex = /^[A-Z]{2,3}-?[0-9]{4}$|^[0-9]{2,3}-?[0-9]{4}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!formData.name) errors.name = "Name is required";
    else if (formData.name.length < 3) errors.name = "Name must be at least 3 characters long";
    else if (formData.name.length > 50) errors.name = "Name cannot exceed 50 characters";
    else if (!nameRegex.test(formData.name)) errors.name = "Name can only contain letters and spaces";

    if (!formData.email) errors.email = "Email is required";
    else if (formData.email.length < 5) errors.email = "Email must be at least 5 characters long";
    else if (formData.email.length > 100) errors.email = "Email cannot exceed 100 characters";
    else if (!emailRegex.test(formData.email)) errors.email = "Invalid email format";
    else if (deliveryPersons.some((person) => person.email === formData.email))
      errors.email = "Email is already in use";

    if (!formData.phone) errors.phone = "Phone number is required";
    else if (!phoneRegex.test(formData.phone)) errors.phone = "Phone number must be 10 digits starting with 0";
    else if (deliveryPersons.some((person) => person.phone === formData.phone))
      errors.phone = "Phone number is already in use";

    if (!formData.vehicleNumber) errors.vehicleNumber = "Vehicle number is required";
    else if (formData.vehicleNumber.length < 5) errors.vehicleNumber = "Vehicle number must be at least 5 characters long";
    else if (formData.vehicleNumber.length > 15) errors.vehicleNumber = "Vehicle number cannot exceed 15 characters";
    else if (!vehicleNumberRegex.test(formData.vehicleNumber))
      errors.vehicleNumber = "Invalid vehicle number format (e.g., ABC-1234 or 12-1234)";
    else if (deliveryPersons.some((person) => person.vehicleNumber === formData.vehicleNumber))
      errors.vehicleNumber = "Vehicle number is already in use";

    if (!formData.password) errors.password = "Password is required";
    else if (formData.password.length < 8) errors.password = "Password must be at least 8 characters long";
    else if (!passwordRegex.test(formData.password))
      errors.password = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character";

    if (!formData.confirmPassword) errors.confirmPassword = "Confirm password is required";
    else if (formData.confirmPassword !== formData.password) errors.confirmPassword = "Passwords do not match";

    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormErrors({ ...formErrors, [name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setFormErrors({});

    const errors = await validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/delivery-persons/add", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        vehicleNumber: formData.vehicleNumber,
        vehicleType: formData.vehicleType,
        password: formData.password,
      });
      setMessage({ type: "success", text: "Delivery person added successfully!" });
      setShowPopup(true);
      setShowAddForm(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        vehicleNumber: "",
        vehicleType: "bike",
        password: "",
        confirmPassword: "",
      });
      fetchDeliveryPersons();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to add delivery person.",
      });
      setShowPopup(true);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this delivery person?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to delete delivery person.");
        navigate("/login");
        return;
      }

      await axios.delete(`http://localhost:5000/api/delivery-persons/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Delivery person deleted successfully!");
      fetchDeliveryPersons();
    } catch (err) {
      if (err.response && err.response.status === 401) {
        toast.error("Session expired. Please log in again.");
        navigate("/login");
      } else {
        toast.error("Failed to delete delivery person!");
      }
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setMessage({ type: "", text: "" });
  };

  const filteredDeliveryPersons = deliveryPersons.filter((person) => {
    const matchesSearch =
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.phone.includes(searchTerm) ||
      person.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "available" && person.status === "available") ||
      (activeTab === "busy" && person.status === "busy");
    return matchesSearch && matchesTab;
  });

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const sortedDeliveryPersons = [...filteredDeliveryPersons].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const getVehicleIcon = (type) => {
    switch (type) {
      case "bike":
        return <FaMotorcycle className="text-indigo-600" />;
      case "car":
        return <FaCar className="text-blue-600" />;
      case "scooter":
        return <FaBicycle className="text-green-600" />;
      default:
        return <FaMotorcycle className="text-gray-600" />;
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) stars.push(<RiStarFill key={i} className="text-yellow-400" />);
      else if (i === fullStars + 1 && hasHalfStar)
        stars.push(<RiStarHalfFill key={i} className="text-yellow-400" />);
      else stars.push(<RiStarLine key={i} className="text-yellow-400" />);
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-indigo-600 mx-auto mb-4" />
          <p className="text-lg text-gray-700">Loading delivery team...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-md p-8 bg-white rounded-xl shadow-lg text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{error}</h3>
          <button
            onClick={fetchDeliveryPersons}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
              <MdDeliveryDining className="text-indigo-600 mr-3 text-3xl sm:text-4xl" />
              Delivery Team Management
            </h1>
            <p className="mt-2 text-sm text-gray-600">Manage your delivery personnel and their details</p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              <FaUserPlus className="mr-2" />
              {showAddForm ? "Hide Form" : "Add Delivery Person"}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Delivery Persons</p>
                <p className="text-2xl font-semibold text-gray-900">{deliveryPersons.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600">
                <MdDeliveryDining className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Available Now</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {deliveryPersons.filter((p) => p.status === "available").length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <FaCheck className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">On Delivery</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {deliveryPersons.filter((p) => p.status === "busy").length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                <FaMotorcycle className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Average Rating</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {deliveryPersons.length > 0
                    ? (deliveryPersons.reduce((sum, p) => sum + (p.rating || 0), 0) / deliveryPersons.length).toFixed(1)
                    : "0.0"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <RiStarFill className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="w-full sm:w-64">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search delivery persons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 text-sm font-medium rounded-full ${
                  activeTab === "all" ? "bg-indigo-100 text-indigo-800" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                All ({deliveryPersons.length})
              </button>
              <button
                onClick={() => setActiveTab("available")}
                className={`px-3 py-1.5 text-sm font-medium rounded-full ${
                  activeTab === "available" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                Available ({deliveryPersons.filter((p) => p.status === "available").length})
              </button>
              <button
                onClick={() => setActiveTab("busy")}
                className={`px-3 py-1.5 text-sm font-medium rounded-full ${
                  activeTab === "busy" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                On Delivery ({deliveryPersons.filter((p) => p.status === "busy").length})
              </button>
            </div>
          </div>
        </div>

        {/* Notification Popup */}
        {showPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closePopup} />
            <div
              className={`relative z-10 w-full max-w-md p-6 rounded-2xl shadow-xl ${
                message.type === "success" ? "bg-gradient-to-br from-green-400 to-emerald-500" : "bg-gradient-to-br from-red-400 to-pink-500"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 p-2 rounded-full bg-white/20">
                  {message.type === "success" ? <FaCheck className="w-8 h-8 text-white" /> : <FaTimes className="w-8 h-8 text-white" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{message.type === "success" ? "Success!" : "Error"}</h3>
                  <p className="text-white/90">{message.text}</p>
                </div>
                <button
                  onClick={closePopup}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <MdCancel className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Delivery Person Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Add New Delivery Person</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <MdCancel className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-white border ${
                      formErrors.name ? "border-red-500" : "border-gray-300"
                    } rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800`}
                    placeholder="John Doe"
                  />
                  {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-white border ${
                      formErrors.email ? "border-red-500" : "border-gray-300"
                    } rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800`}
                    placeholder="john@example.com"
                  />
                  {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-white border ${
                      formErrors.phone ? "border-red-500" : "border-gray-300"
                    } rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800`}
                    placeholder="0712345678"
                  />
                  {formErrors.phone && <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-white border ${
                      formErrors.vehicleNumber ? "border-red-500" : "border-gray-300"
                    } rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800`}
                    placeholder="ABC-1234"
                  />
                  {formErrors.vehicleNumber && <p className="mt-1 text-sm text-red-600">{formErrors.vehicleNumber}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                  >
                    <option value="bike">Motor Bike</option>
                    <option value="car">Car</option>
                    <option value="scooter">Scooter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-white border ${
                      formErrors.password ? "border-red-500" : "border-gray-300"
                    } rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800`}
                    placeholder="••••••••"
                  />
                  {formErrors.password && <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-white border ${
                      formErrors.confirmPassword ? "border-red-500" : "border-gray-300"
                    } rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800`}
                    placeholder="••••••••"
                  />
                  {formErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>}
                </div>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
                >
                  <FaUserPlus className="mr-2" />
                  Add Delivery Person
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delivery Persons Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Delivery Team Members
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {filteredDeliveryPersons.length} {filteredDeliveryPersons.length === 1 ? "person" : "persons"}
              </span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("name")}
                  >
                    <div className="flex items-center">
                      Name
                      {sortConfig.key === "name" && <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("status")}
                  >
                    <div className="flex items-center">
                      Status
                      {sortConfig.key === "status" && <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("rating")}
                  >
                    <div className="flex items-center">
                      Rating
                      {sortConfig.key === "rating" && <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("totalDeliveries")}
                  >
                    <div className="flex items-center">
                      Deliveries
                      {sortConfig.key === "totalDeliveries" && (
                        <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedDeliveryPersons.length > 0 ? (
                  sortedDeliveryPersons.map((person) => (
                    <tr key={person._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium">{person.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              <Link
                                to={`/delivery-persons/${person._id}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                {person.name}
                              </Link>
                            </div>
                            <div className="text-sm text-gray-500">{person.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{person.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">{getVehicleIcon(person.vehicleType)}</div>
                          <div className="ml-2">
                            <div className="text-sm font-medium text-gray-900 capitalize">{person.vehicleType}</div>
                            <div className="text-sm text-gray-500 font-mono">{person.vehicleNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            person.status === "available"
                              ? "bg-green-100 text-green-800"
                              : person.status === "busy"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {person.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex mr-2">{renderStars(person.rating || 0)}</div>
                          <span className="text-sm text-gray-500">{(person.rating || 0).toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{person.totalDeliveries || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link
                            to={`/delivery-persons/${person._id}`}
                            className="text-blue-600 hover:text-blue-900 p-1.5 rounded-full hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <FaEdit className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(person._id)}
                            className="text-red-600 hover:text-red-900 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <FaTrash className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-lg font-medium">No delivery persons found</p>
                        <p className="text-sm mt-1">Try adjusting your search or add a new delivery person</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPersonList;