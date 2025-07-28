import React, { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client"; // Import Socket.IO client

// Define the Socket.IO URL explicitly for WebSocket connection
const SOCKET_URL = "ws://192.168.8.156:5000"; // Use wss:// for HTTPS, port 3001
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.protocol === "https:"
    ? "https://localhost:3001"
    : "http://192.168.8.156:5000");

function Activity() {
  const [activeTab, setActiveTab] = useState("completed");
  const [completedOrders, setCompletedOrders] = useState([]);
  const [failedOrders, setFailedOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]); // New state for active orders
  const [locations, setLocations] = useState({}); // Store real-time locations for active orders
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null); // State for Socket.IO connection

  // Initialize Socket.IO connection
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (!userData || !token) {
      setError("Please log in to view activities");
      setLoading(false);
      return;
    }

    // Initialize Socket.IO client
    const newSocket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket"], // Force WebSocket transport
      secure: true, // Use wss://
      rejectUnauthorized: false, // Ignore self-signed certificate errors (for development)
      auth: { token }, // Send token for authentication (if your server expects it)
    });

    // Handle connection events
    newSocket.on("connect", () => {
      console.log("Connected to Socket.IO server:", newSocket.id);
      setSocket(newSocket);

      // Fetch active orders and join their rooms
      fetchActivities(newSocket);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err.message);
      setError("Failed to connect to real-time updates: " + err.message);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket.IO disconnected:", reason);
    });

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, []);

  // Fetch activity data and active orders
  const fetchActivities = async (socketInstance) => {
    setLoading(true);
    setError(null);
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (!userData || !userData._id)
        throw new Error("No user data found, please log in.");

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found, please log in.");

      const deliveryPersonId = userData._id;

      // Fetch completed and failed orders
      const activityResponse = await axios.get(
        `${API_BASE_URL}/api/delivery-persons/${deliveryPersonId}/delivery-activities`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { completed = [], failed = [] } = activityResponse.data || {};
      setCompletedOrders(completed);
      setFailedOrders(failed);

      // Fetch active orders
      const activeOrdersResponse = await axios.get(
        `${API_BASE_URL}/api/delivery-persons/${deliveryPersonId}/assigned-orders`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const activeOrdersData = activeOrdersResponse.data || [];
      setActiveOrders(activeOrdersData);

      // Join rooms for active orders to receive location updates
      if (socketInstance && activeOrdersData.length > 0) {
        activeOrdersData.forEach((order) => {
          socketInstance.emit("joinOrder", order._id.toString());
          console.log(`Joined room for order ${order._id}`);
        });

        // Listen for location updates
        socketInstance.on("locationUpdate", ({ orderId, lat, lng }) => {
          console.log(`Received location update for order ${orderId}:`, {
            lat,
            lng,
          });
          setLocations((prev) => ({
            ...prev,
            [orderId]: { lat, lng, timestamp: new Date() },
          }));
        });
      }

      setUser(userData);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load activities"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingView />;
  if (error)
    return <ErrorView error={error} onRetry={() => fetchActivities(socket)} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 pt-10 p-4 md:p-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600">
          Delivery Activity
        </h1>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 pt-5">
          <StatCard
            label="Active Orders"
            value={activeOrders.length}
            color="bg-blue-100 text-blue-700"
          />
          <StatCard
            label="Completed Orders"
            value={completedOrders.length}
            color="bg-green-100 text-green-700"
          />
          <StatCard
            label="Failed Orders"
            value={failedOrders.length}
            color="bg-red-100 text-red-700"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === "active"
                ? "border-b-2 border-orange-500 text-orange-600"
                : "text-gray-500 hover:text-orange-500"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === "completed"
                ? "border-b-2 border-orange-500 text-orange-600"
                : "text-gray-500 hover:text-orange-500"
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab("failed")}
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === "failed"
                ? "border-b-2 border-orange-500 text-orange-600"
                : "text-gray-500 hover:text-orange-500"
            }`}
          >
            Failed
          </button>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-100">
          {activeTab === "active" ? (
            activeOrders.length > 0 ? (
              activeOrders.map((order) => (
                <ActiveOrderItem
                  key={order._id}
                  order={order}
                  location={locations[order._id.toString()]}
                />
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                No active orders at the moment
              </div>
            )
          ) : activeTab === "completed" ? (
            completedOrders.length > 0 ? (
              completedOrders.map((order) => (
                <OrderItem key={order._id} order={order} type="completed" />
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                No completed orders yet
              </div>
            )
          ) : failedOrders.length > 0 ? (
            failedOrders.map((order) => (
              <OrderItem key={order._id} order={order} type="failed" />
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No failed orders yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable Components
const LoadingView = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-lg font-medium text-gray-700">
        Loading activities...
      </p>
    </div>
  </div>
);

const ErrorView = ({ error, onRetry }) => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center p-6 bg-white rounded-xl shadow-md max-w-md mx-4">
      <svg
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
      <h3 className="mt-4 text-lg font-medium text-gray-900">
        Error Loading Activities
      </h3>
      <p className="mt-2 text-gray-600">{error}</p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"
      >
        Try Again
      </button>
    </div>
  </div>
);

const StatCard = ({ label, value, color }) => (
  <div className={`${color} rounded-xl shadow-sm p-4`}>
    <p className="text-sm font-medium">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

const OrderItem = ({ order, type }) => (
  <div className="p-4 border-b border-orange-50 hover:bg-amber-50 transition-colors">
    <div className="flex justify-between">
      <div>
        <p className="font-medium text-gray-800">
          #{order.orderId.toString().slice(-6)}
        </p>
        <p className="text-sm text-gray-600">{order.customerName}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-700">
          {type === "completed" ? "Delivered" : "Failed"} At
        </p>
        <p className="text-xs text-gray-500">
          {new Date(
            type === "completed" ? order.deliveredAt : order.failedAt
          ).toLocaleString()}
        </p>
      </div>
    </div>
    <div className="mt-2 text-sm text-gray-500">
      <p>{order.deliveryAddress}</p>
      {type === "failed" && (
        <p className="mt-1 text-red-600">Reason: {order.failureReason}</p>
      )}
      {type === "completed" && (
        <p className="mt-1 text-green-600">Fee: ₹{order.deliveryFee || 0}</p>
      )}
    </div>
  </div>
);

// New Component for Active Orders with Real-Time Location
const ActiveOrderItem = ({ order, location }) => (
  <div className="p-4 border-b border-orange-50 hover:bg-amber-50 transition-colors">
    <div className="flex justify-between">
      <div>
        <p className="font-medium text-gray-800">
          #{order._id.toString().slice(-6)}
        </p>
        <p className="text-sm text-gray-600">{order.customerName}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-blue-700">Status</p>
        <p className="text-xs text-gray-500">{order.status}</p>
      </div>
    </div>
    <div className="mt-2 text-sm text-gray-500">
      <p>{order.deliveryAddress}</p>
      {location ? (
        <p className="mt-1 text-blue-600">
          Current Location: Lat: {location.lat.toFixed(4)}, Lng:{" "}
          {location.lng.toFixed(4)} (Updated:{" "}
          {new Date(location.timestamp).toLocaleTimeString()})
        </p>
      ) : (
        <p className="mt-1 text-gray-600">Waiting for location update...</p>
      )}
    </div>
  </div>
);

export default Activity;
