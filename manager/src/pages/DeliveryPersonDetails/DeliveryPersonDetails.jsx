import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import { FaSpinner, FaArrowLeft, FaMotorcycle, FaCar, FaBiking, FaPhone, FaStar, FaBoxOpen, FaUser, FaEdit, FaTrash } from "react-icons/fa";

const DeliveryPersonDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deliveryPerson, setDeliveryPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [editableData, setEditableData] = useState({
    vehicleNumber: "",
    vehicleType: "bike",
  });

  useEffect(() => {
    const fetchDeliveryPerson = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("You are not authorized. Please log in.");
          toast.error("Please log in to view delivery person details.");
          setLoading(false);
          navigate("/login");
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/delivery-persons/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setDeliveryPerson(response.data);
        setEditableData({
          vehicleNumber: response.data.vehicleNumber || "",
          vehicleType: response.data.vehicleType || "bike",
        });
        setLoading(false);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          setError("Unauthorized access. Please log in again.");
          toast.error("Session expired. Please log in again.");
          navigate("/login");
        } else {
          setError("Failed to fetch delivery person details. Please try again later.");
          toast.error("Failed to fetch delivery person details!");
        }
        setLoading(false);
      }
    };

    fetchDeliveryPerson();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableData({ ...editableData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to update delivery person details.");
        navigate("/login");
        setUpdating(false);
        return;
      }

      await axios.put(
        `http://localhost:5000/api/delivery-persons/${id}`,
        editableData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Delivery person updated successfully!");
      navigate("/view/deliveryPerson");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        toast.error("Session expired. Please log in again.");
        navigate("/login");
      } else {
        toast.error("Failed to update delivery person!");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this delivery person?")) {
      return;
    }

    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to delete delivery person.");
        navigate("/login");
        setDeleting(false);
        return;
      }

      await axios.delete(`http://localhost:5000/api/delivery-persons/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Delivery person deleted successfully!");
      navigate("/view/deliveryPerson");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        toast.error("Session expired. Please log in again.");
        navigate("/login");
      } else {
        toast.error("Failed to delete delivery person!");
      }
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="relative">
            <FaSpinner className="animate-spin text-5xl text-indigo-600 mx-auto" />
            <div className="absolute inset-0 bg-white/30 rounded-full blur-md"></div>
          </div>
          <p className="text-lg font-medium text-gray-700 animate-pulse">Loading delivery details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100 transform hover:scale-[1.01] transition-transform duration-300">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Occurred</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/delivery-persons")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-300 flex items-center justify-center mx-auto shadow-md hover:shadow-lg"
          >
            <FaArrowLeft className="mr-2" />
            Back to Delivery Persons
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/delivery-persons")}
              className="mr-4 p-3 rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors duration-200 text-indigo-600 hover:text-indigo-700"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Delivery Person Details</h1>
              <p className="text-gray-500">Manage and view delivery personnel information</p>
            </div>
          </div>
          <div className="flex space-x-3">
            
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
          {/* Profile Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-90"></div>
            <div className="relative z-10 p-6 md:p-8 text-white">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-center">
                  {editableData.vehicleType === "bike" ? (
                    <FaMotorcycle className="text-4xl" />
                  ) : editableData.vehicleType === "car" ? (
                    <FaCar className="text-4xl" />
                  ) : (
                    <FaBiking className="text-4xl" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold">{deliveryPerson.name || "N/A"}</h2>
                      <p className="text-indigo-100">{deliveryPerson.email || "N/A"}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                      deliveryPerson.status === "active" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {deliveryPerson.status || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Personal Information */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                    <FaUser className="text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center text-gray-500 mb-1">
                      <FaPhone className="mr-2 text-sm" />
                      <span className="text-sm font-medium">Phone</span>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 text-gray-700">
                      {deliveryPerson.phone || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center text-gray-500 mb-1">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm font-medium">Location</span>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 text-gray-700">
                      {deliveryPerson.location || "Not specified"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 p-2 rounded-lg mr-3">
                    <FaStar className="text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Performance Metrics</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-xs border border-gray-100 hover:shadow-sm transition-shadow">
                    <div className="flex items-center">
                      <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                        <FaBoxOpen className="text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{deliveryPerson.totalDeliveries || "0"}</div>
                        <div className="text-xs text-gray-500">Total Deliveries</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-xs border border-gray-100 hover:shadow-sm transition-shadow">
                    <div className="flex items-center">
                      <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                        <FaStar className="text-yellow-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{deliveryPerson.rating || "N/A"}</div>
                        <div className="text-xs text-gray-500">Average Rating</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-xs border border-gray-100 hover:shadow-sm transition-shadow">
                    <div className="flex items-center">
                      <div className="bg-red-100 p-2 rounded-lg mr-3">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{deliveryPerson.failedDeliveries || "0"}</div>
                        <div className="text-xs text-gray-500">Failed</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    {editableData.vehicleType === "bike" ? (
                      <FaMotorcycle className="text-blue-600" />
                    ) : editableData.vehicleType === "car" ? (
                      <FaCar className="text-blue-600" />
                    ) : (
                      <FaBiking className="text-blue-600" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Vehicle Information</h3>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Vehicle Number</label>
                    <input
                      type="text"
                      name="vehicleNumber"
                      value={editableData.vehicleNumber}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter vehicle number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Vehicle Type</label>
                    <select
                      name="vehicleType"
                      value={editableData.vehicleType}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="bike">Bike</option>
                      <option value="car">Car</option>
                      <option value="scooter">Scooter</option>
                    </select>
                  </div>
                </form>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleDelete}
                disabled={updating || deleting}
                className={`px-6 py-3 rounded-lg flex items-center justify-center text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg ${
                  (updating || deleting) ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {deleting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash className="mr-2" />
                    Delete
                  </>
                )}
              </button>
              <button
                onClick={handleSubmit}
                disabled={updating || deleting}
                className={`px-6 py-3 rounded-lg flex items-center justify-center text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg ${
                  (updating || deleting) ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {updating ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaEdit className="mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPersonDetails;