import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE_URL =
  window.location.protocol === "https:"
    ? "https://localhost:3001"
    : "http://192.168.8.156:5000";

const Orders = () => {
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [status, setStatus] = useState("offline"); // Add status state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { deliveryPersonId } = useParams();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);

  // Function to filter orders
  const filterOrders = (orders) => {
    return orders.filter(
      (order) =>
        order.status !== "delivered" &&
        order.status.toLowerCase() !== "rejected" &&
        order.status.toLowerCase() !== "failed"
    );
  };

  // Fetch assigned orders and delivery person status
  const fetchAssignedOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard data to get the status
      const dashboardResponse = await axios.get(
        `${API_BASE_URL}/api/delivery-persons/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setStatus(dashboardResponse.data.status || "offline");

      // Fetch assigned orders
      const ordersResponse = await axios.get(
        `${API_BASE_URL}/api/delivery-persons/${deliveryPersonId}/assigned-orders`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const filteredOrders = filterOrders(ordersResponse.data);
      setAssignedOrders(filteredOrders);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(
        "Failed to fetch assigned orders or status. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  // Background polling function
  const pollOrders = async () => {
    try {
      const [dashboardResponse, ordersResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/delivery-persons/dashboard`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        axios.get(
          `${API_BASE_URL}/api/delivery-persons/${deliveryPersonId}/assigned-orders`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        ),
      ]);

      const newStatus = dashboardResponse.data.status || "offline";
      const filteredOrders = filterOrders(ordersResponse.data);

      // Update status
      setStatus(newStatus);

      // Only update orders state if there are meaningful changes
      setAssignedOrders((prevOrders) => {
        const prevOrderIds = prevOrders.map((order) => order._id);
        const newOrderIds = filteredOrders.map((order) => order._id);

        if (
          prevOrderIds.length !== newOrderIds.length ||
          !prevOrderIds.every((id) => newOrderIds.includes(id))
        ) {
          return filteredOrders;
        }

        const updatedOrders = prevOrders.map((prevOrder) => {
          const newOrder = filteredOrders.find((o) => o._id === prevOrder._id);
          return newOrder || prevOrder;
        });

        return JSON.stringify(updatedOrders) !== JSON.stringify(prevOrders)
          ? updatedOrders
          : prevOrders;
      });
    } catch (error) {
      console.error("Error polling orders:", error);
    }
  };

  // Effect for initial fetch, polling, and scroll management
  useEffect(() => {
    fetchAssignedOrders();

    const pollingInterval = setInterval(pollOrders, 5000);
    return () => clearInterval(pollingInterval);
  }, [deliveryPersonId]);

  useEffect(() => {
    // Restore scroll position after state update
    if (scrollContainerRef.current && !loading) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollTop;
    }
  }, [assignedOrders, loading]);

  const handleAcceptOrder = async (orderId) => {
    // Validation: Disable accept if status is "busy" or "offline"
    if (status === "busy" || status === "offline") {
      alert("Cannot accept order: You are currently busy or offline.");
      return;
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/dorders/${orderId}/accept`,
        { status: "accepted" },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.status === 200) {
        setAssignedOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === orderId ? { ...order, status: "accepted" } : order
          )
        );
      } else {
        throw new Error(response.data.message || "Failed to accept order");
      }
    } catch (error) {
      console.error("Order acceptance error:", error);
      alert(error.response?.data?.message || error.message);
    }
  };

  const handleInTransit = async (orderId) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/dorders/${orderId}/accept`,
        { status: "on_the_way" },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.status === 200) {
        navigate(`/delivery/orders/${orderId}/track`, { replace: true });
      } else {
        throw new Error(
          response.data.message || "Failed to mark order as in-transit"
        );
      }
    } catch (error) {
      console.error("In-transit error:", error);
      alert(error.response?.data?.message || error.message);
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/dorders/${orderId}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setAssignedOrders((prevOrders) =>
        prevOrders.filter((order) => order._id !== orderId)
      );

      alert("Order rejected successfully!");
    } catch (error) {
      console.error("Error rejecting order:", error);
      alert("Failed to reject order. Please try again.");
    }
  };

  const refreshOrders = async () => {
    await fetchAssignedOrders();
  };

  const handleGoBack = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 pt-10 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="flex items-center mb-4 sm:mb-0">
            <button
              onClick={handleGoBack}
              className="mr-4 p-2 rounded-full hover:bg-orange-100 transition-colors"
              aria-label="Go back"
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
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-600">
                Active Orders
              </h1>
              <p className="text-amber-700 mt-1">
                Manage your delivery assignments
              </p>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={refreshOrders}
            className={`flex items-center px-5 py-3 rounded-xl shadow-md transition-all ${
              loading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg"
            }`}
            disabled={loading}
          >
            {loading ? (
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
                Refreshing...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                Refresh Orders
              </>
            )}
          </button>
        </div>

        {/* Loading State */}
        {loading && !error && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <div
            ref={scrollContainerRef}
            style={{ overflowY: "auto", maxHeight: "calc(100vh - 200px)" }}
          >
            {Array.isArray(assignedOrders) && assignedOrders.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {assignedOrders.map((order) => {
                  const isAcceptDisabled =
                    status === "busy" || status === "offline";

                  return (
                    <div
                      key={order._id}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-100 hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1"
                    >
                      <div className="p-6">
                        {/* Order Header */}
                        <div className="flex justify-between items-start">
                          <div className="min-w-0">
                            <h2 className="text-xl font-bold text-gray-800 mb-1 truncate">
                              Order #{order._id.slice(-6).toUpperCase()}
                            </h2>
                            <span
                              className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                                order.status === "accepted"
                                  ? "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800"
                                  : order.status === "pending"
                                  ? "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800"
                                  : order.status === "on_the_way"
                                  ? "bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {order.status.replace(/_/g, " ").toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500">
                              LKR {order.totalPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Order Details */}
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center">
                            <div className="p-1.5 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg text-white mr-3">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                ></path>
                              </svg>
                            </div>
                            <p className="text-gray-700 truncate">
                              {order.customerName}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <div className="p-1.5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg text-white mr-3">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                ></path>
                              </svg>
                            </div>
                            <p className="text-gray-700 truncate">
                              {order.phone}
                            </p>
                          </div>
                          <div className="flex items-start">
                            <div className="p-1.5 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg text-white mr-3 mt-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                ></path>
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                ></path>
                              </svg>
                            </div>
                            <p className="text-gray-700">
                              <span className="font-medium">Address:</span>{" "}
                              <span className="truncate">
                                {order.deliveryAddress}
                              </span>
                            </p>
                          </div>
                          <div className="flex items-center">
                            <div className="p-1.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg text-white mr-3">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                ></path>
                              </svg>
                            </div>
                            <p className="text-gray-700">
                              <span className="font-medium">Type:</span>{" "}
                              {order.orderType}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 flex flex-wrap gap-3">
                          {order.status !== "accepted" &&
                            order.status !== "on_the_way" && (
                              <>
                                <button
                                  onClick={() => handleAcceptOrder(order._id)}
                                  disabled={isAcceptDisabled}
                                  className={`flex-1 min-w-[120px] flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-md ${
                                    isAcceptDisabled
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  <svg
                                    className="w-5 h-5 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M5 13l4 4L19 7"
                                    ></path>
                                  </svg>
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleRejectOrder(order._id)}
                                  className="flex-1 min-w-[120px] flex items-center justify-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all shadow-md"
                                >
                                  <svg
                                    className="w-5 h-5 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M6 18L18 6M6 6l12 12"
                                    ></path>
                                  </svg>
                                  Reject
                                </button>
                              </>
                            )}

                          {order.status === "accepted" && (
                            <button
                              onClick={() => handleInTransit(order._id)}
                              className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md"
                            >
                              <svg
                                className="w-5 h-5 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                                ></path>
                              </svg>
                              Start Delivery
                            </button>
                          )}

                          {order.status === "on_the_way" && (
                            <button
                              onClick={() =>
                                navigate(
                                  `/delivery/orders/${order._id}/track`,
                                  { replace: true }
                                )
                              }
                              className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md"
                            >
                              <svg
                                className="w-5 h-5 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                ></path>
                              </svg>
                              Track Delivery
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-orange-100">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center mb-3">
                  <svg
                    className="w-8 h-8 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    ></path>
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No active orders
                </h3>
                <p className="mt-2 text-gray-600">
                  {assignedOrders.length === 0
                    ? "You currently have no pending or accepted orders."
                    : "All your orders have been completed or rejected."}
                </p>
                <button
                  onClick={handleGoBack}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-orange-600 rounded-xl hover:bg-orange-100 transition-colors shadow-sm"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
