import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import DeliveryMap from "../components/DeliveryMap";
import io from "socket.io-client";
import MessagingModal from "../components/MessagingModal.jsx";
import MessageOptionsModal from "../components/MessageOptionsModal.jsx";
import { FiPhoneCall } from "react-icons/fi"; // Added for the Call button

const API_BASE_URL =
  window.location.protocol === "https:"
    ? "https://localhost:3001"
    : "http://192.168.8.156:5000";

const DeliverOrder = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState("accepted");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [recipientType, setRecipientType] = useState(null);

  const deliveryPersonId = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))._id
    : "";

  const statusFlow = ["accepted", "picked_up", "on_the_way", "delivered"];

  // WebSocket setup
  useEffect(() => {
    const token = localStorage.getItem("token");
    socketRef.current = io(API_BASE_URL, {
      auth: { token },
      path: "/socket.io",
      transports: ["websocket"],
      secure: window.location.protocol === "https:",
    });

    socketRef.current.on("connect", () => {
      console.log("Connected to WebSocket in DeliverOrder");
      socketRef.current.emit("joinOrder", orderId);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("WebSocket connection error in DeliverOrder:", error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [orderId]);

  // Fetch order details and track location
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/dorders/track/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const fetchedOrder = response.data;
        console.log("Fetched Order:", fetchedOrder);
        setOrder(fetchedOrder);
        setCurrentStatus(fetchedOrder.status || "accepted");

        // Set fallback location
        setCurrentLocation({
          lat: fetchedOrder.currentLocation?.latitude || 6.9271,
          lng: fetchedOrder.currentLocation?.longitude || 79.8612,
        });
      } catch (error) {
        console.error("Fetch error:", error);
        alert("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Live location tracking
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(newLocation);
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit("locationUpdate", {
              orderId,
              lat: newLocation.lat,
              lng: newLocation.lng,
            });
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setCurrentLocation({
            lat: 6.9271,
            lng: 79.8612,
          });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      console.error("Geolocation not supported");
      setCurrentLocation({
        lat: 6.9271,
        lng: 79.8612,
      });
    }
  }, [orderId]);

  const handleBackNavigation = () => {
    if (deliveryPersonId) {
      navigate(`/orders/${deliveryPersonId}`);
    } else {
      navigate("/dashboard");
    }
  };

  const handleDashboardNavigation = () => {
    navigate("/dashboard");
  };

  const updateStatus = async (newStatus, reason = "") => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem("token");
      let response;

      if (newStatus === "failed") {
        response = await axios.post(
          `${API_BASE_URL}/api/delivery-persons/orders/${orderId}/fail`,
          { reason },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setCurrentStatus("Failed");
        setOrder((prev) => ({
          ...prev,
          status: "Failed",
          failureReason: reason,
        }));
      } else if (newStatus === "delivered") {
        response = await axios.post(
          `${API_BASE_URL}/api/delivery-persons/orders/${orderId}/complete-delivery`,
          { orderId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setCurrentStatus("delivered");
        setOrder((prev) => ({ ...prev, status: "delivered" }));
      } else {
        response = await axios.put(
          `${API_BASE_URL}/api/orders/${orderId}/accept`,
          { status: newStatus },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setCurrentStatus(newStatus);
        setOrder((prev) => ({ ...prev, status: newStatus }));
      }

      if (newStatus === "delivered" || newStatus === "failed") {
        await axios.put(
          `${API_BASE_URL}/api/delivery-persons/${deliveryPersonId}/status`,
          { status: "available" },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (newStatus === "delivered") {
          setShowSuccessModal(true);
        } else {
          setShowFailureModal(false);
          handleDashboardNavigation();
        }
      }
    } catch (error) {
      console.error("Update error:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmitFailure = () => {
    if (!failureReason.trim() || failureReason.trim().length < 10) {
      alert("Please provide a valid reason (minimum 10 characters)");
      return;
    }
    updateStatus("failed", failureReason);
  };

  // Handle option selection for messaging
  const handleOptionSelect = (type) => {
    setRecipientType(type);
    setIsOptionsOpen(false);
    setIsMessagingOpen(true);
  };

  // Handle back navigation in MessagingModal
  const handleBackToOptions = () => {
    setIsMessagingOpen(false);
    setIsOptionsOpen(true);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-orange-50 to-amber-50 pb-24">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">
            Loading order details...
          </p>
        </div>
      </div>
    );

  if (!order)
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-orange-50 to-amber-50 pb-24">
        <div className="text-center p-6 bg-white rounded-xl shadow-md border border-orange-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-bold text-gray-800 mt-4">
            No Order Found
          </h2>
          <p className="text-gray-600 mt-2">
            We couldn't find an order with that ID.
          </p>
          <button
            onClick={handleBackNavigation}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );

  const destination = {
    longitude: order.deliveryLocation?.coordinates?.[0] || 80.2215,
    latitude: order.deliveryLocation?.coordinates?.[1] || 9.729583,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-6 pt-10 pb-18 relative">
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 border border-orange-100 shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-3">
                Delivery Completed!
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Order #{order._id} has been successfully delivered to{" "}
                  {order.customerName}.
                </p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 border border-transparent rounded-lg hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                  onClick={handleDashboardNavigation}
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showFailureModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 border border-orange-100 shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-3">
                Delivery Failed
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-3">
                  Please provide the reason for the failed delivery (minimum 10
                  characters):
                </p>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={4}
                  placeholder="Enter reason for failed delivery..."
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                />
              </div>
              <div className="mt-4 flex justify-center space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  onClick={() => setShowFailureModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-500 border border-transparent rounded-lg hover:from-red-600 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={handleSubmitFailure}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={handleBackNavigation}
              className="mr-4 p-2 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Delivery Tracking
              </h1>
              <p className="text-orange-700">Order #{order._id}</p>
            </div>
          </div>
          <div className="mt-2 md:mt-0">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentStatus === "delivered"
                  ? "bg-green-100 text-green-800"
                  : currentStatus === "accepted"
                  ? "bg-blue-100 text-blue-800"
                  : currentStatus === "picked_up"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {currentStatus.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg mr-4 text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Customer Details
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex">
                  <span className="text-gray-600 w-24">Name:</span>
                  <span className="font-medium">{order.customerName}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 w-24">Phone:</span>
                  <span className="font-medium mr-2">{order.phone}</span>
                  <button
                    className="flex items-center text-indigo-600 hover:text-indigo-800 focus:outline-none"
                    onClick={() =>
                      (window.location.href = `tel:${order.phone}`)
                    }
                  >
                    <FiPhoneCall className="mr-1" />
                    Call
                  </button>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-24">Email:</span>
                  <span className="font-medium">
                    {order.customerEmail || "Not provided"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg mr-4 text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Delivery Information
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex">
                  <span className="text-gray-600 w-24">Address:</span>
                  <span className="font-medium">{order.deliveryAddress}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-24">Type:</span>
                  <span className="font-medium capitalize">
                    {order.orderType}
                  </span>
                </div>
                {order.orderType === "delivery" && (
                  <div className="flex">
                    <span className="text-gray-600 w-24">Fee:</span>
                    <span className="font-medium">
                      LKR {order.deliveryFee?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                )}
                {order.deliveryNotes && (
                  <div>
                    <span className="text-gray-600 w-24">Notes:</span>
                    <p className="mt-1 bg-amber-50 p-3 rounded-lg">
                      {order.deliveryNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg mr-4 text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Order Items
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {order.items?.map((item, index) => (
                  <div key={index} className="py-3 flex justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      LKR {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    LKR {order.totalPrice?.toFixed(2) || "0.00"}
                  </span>
                </div>
                {order.orderType === "delivery" && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee:</span>
                    <span className="font-medium">
                      LKR {order.deliveryFee?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2">
                  <span>Total:</span>
                  <span>
                    LKR{" "}
                    {(
                      (order.totalPrice || 0) + (order.deliveryFee || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-100">
              <div className="p-4 border-b border-orange-100">
                <h2 className="text-xl font-semibold text-gray-800">
                  Delivery Route
                </h2>
              </div>
              <div className="h-80">
                {currentLocation ? (
                  <DeliveryMap
                    currentLocation={currentLocation}
                    destination={destination}
                    orderId={orderId}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-600">Loading map...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Update Status
              </h2>
              <div className="space-y-3">
                {currentStatus === "accepted" && (
                  <button
                    onClick={() => updateStatus("picked_up")}
                    className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isUpdating ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Confirm Pick Up
                      </>
                    )}
                  </button>
                )}

                {currentStatus === "picked_up" && (
                  <button
                    onClick={() => updateStatus("on_the_way")}
                    className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                      isUpdating ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Mark as On the Way
                      </>
                    )}
                  </button>
                )}

                {currentStatus === "on_the_way" && (
                  <>
                    <button
                      onClick={() => updateStatus("delivered")}
                      className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                        isUpdating ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Confirm Delivery
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowFailureModal(true)}
                      className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                        isUpdating ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                      disabled={isUpdating}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Failed Delivery
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Delivery Progress
              </h2>
              <div className="space-y-4">
                {statusFlow.map((status, index) => (
                  <div key={status} className="flex items-start">
                    <div
                      className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                        statusFlow.indexOf(currentStatus) >= index
                          ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {statusFlow.indexOf(currentStatus) > index ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="ml-3">
                      <h3
                        className={`text-sm font-medium ${
                          statusFlow.indexOf(currentStatus) >= index
                            ? "text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        {status.replace(/_/g, " ").toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {statusFlow.indexOf(currentStatus) > index
                          ? "Completed"
                          : statusFlow.indexOf(currentStatus) === index
                          ? "In progress"
                          : "Pending"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="fixed bottom-20 right-4 bg-amber-500 rounded-full p-3 cursor-pointer shadow-lg z-50"
        onClick={() => setIsOptionsOpen(true)}
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
      </div>

      <MessageOptionsModal
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        onSelect={handleOptionSelect}
      />

      <MessagingModal
        isOpen={isMessagingOpen}
        onClose={() => setIsMessagingOpen(false)}
        socket={socketRef.current}
        user={JSON.parse(localStorage.getItem("user"))}
        recipientType={recipientType}
        orderId={orderId}
        onBack={handleBackToOptions}
      />
    </div>
  );
};

export default DeliverOrder;
