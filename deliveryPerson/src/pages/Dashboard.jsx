import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import DeliveryMap from "../components/DeliveryMap";
import io from "socket.io-client";
import MessagingModal from "../components/MessagingModal.jsx";
import MessageOptionsModal from "../components/MessageOptionsModal.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.protocol === "https:"
    ? "https://localhost:3001"
    : "http://192.168.8.156:5000");

function Dashboard() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("offline");
  const [earnings, setEarnings] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [nextDelivery, setNextDelivery] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [recipientType, setRecipientType] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const updateDeviceLocation = async (position) => {
    const { latitude, longitude } = position.coords;
    const newLocation = { lat: latitude, lng: longitude };
    console.log("Device Location:", newLocation);
    setCurrentLocation(newLocation);

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/api/delivery-persons/location`,
        {
          latitude,
          longitude,
          address: "Updated via device location",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Location updated in MongoDB:", { latitude, longitude });
    } catch (err) {
      console.error("Failed to update location in MongoDB:", err.message);
    }
  };

  const handleLocationError = (err) => {
    console.error("Geolocation error:", err.message);
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/api/delivery-persons/dashboard`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { data } = response;
      console.log("API Response:", data);

      setStatus(data.status || "offline");
      setEarnings(data.earningsToday || 0);
      setCompletedOrders(data.deliveries.completed || 0);
      setAlerts(data.alerts || []);

      if (data.location && !currentLocation) {
        setCurrentLocation({
          lat: data.location.latitude,
          lng: data.location.longitude,
        });
      }

      setNextDelivery(
        data.deliveries.nextDelivery
          ? formatOrder(data.deliveries.nextDelivery)
          : null
      );
      const formattedPendingOrders =
        data.deliveries.pendingOrders.map(formatOrder);
      console.log("Formatted Pending Orders:", formattedPendingOrders);
      setPendingOrders(formattedPendingOrders);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to load data"
      );
      setMessage({
        type: "error",
        text:
          err.response?.data?.message || err.message || "Failed to load data",
      });
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const formatOrder = (order) => {
    const formattedOrder = {
      id: order.id,
      customerName: order.customerName,
      distance: order.distance || "N/A",
      time: order.time || "N/A",
      address: order.address,
      deliveryBy: order.deliveryBy || "ASAP",
      latitude: order.location?.latitude || order.latitude,
      longitude: order.location?.longitude || order.longitude,
      status: order.status,
    };
    console.log("Formatted Order:", formattedOrder);
    return formattedOrder;
  };

  const initializeGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        updateDeviceLocation,
        handleLocationError,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user"));
        setUser(userData);

        initializeGeolocation();
        await fetchDashboardData();

        const interval = setInterval(() => {
          fetchDashboardData();
        }, 5000);

        const token = localStorage.getItem("token");
        socketRef.current = io(API_BASE_URL, {
          auth: { token },
          reconnection: true,
        });

        socketRef.current.on("locationUpdate", (data) => {
          if (data.deliveryPersonId === userData._id) {
            const newLocation = {
              lat: data.location.coordinates[1],
              lng: data.location.coordinates[0],
            };
            console.log("Location updated via socket:", newLocation);
            setCurrentLocation(newLocation);
          }
        });

        return () => clearInterval(interval);
      } catch (err) {
        setError(
          err.response?.data?.message || err.message || "Failed to load data"
        );
        setMessage({
          type: "error",
          text:
            err.response?.data?.message || err.message || "Failed to load data",
        });
        setShowPopup(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const handleDeliveryAction = async (action, orderId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/api/dorders/${orderId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchDashboardData();
      setMessage({ type: "success", text: `Order ${action}ed successfully!` });
      setShowPopup(true);
    } catch (err) {
      setMessage({
        type: "error",
        text: `Failed to ${action} order: ${err.message}`,
      });
      setShowPopup(true);
    }
  };

  const handleOptionSelect = (type) => {
    setRecipientType(type);
    setIsOptionsOpen(false);
    setIsMessagingOpen(true);
  };

  const handleBackToOptions = () => {
    setIsMessagingOpen(false);
    setIsOptionsOpen(true);
  };

  if (loading) return <LoadingView />;
  if (error) {
    if (error === "Invalid or expired token") {
      return (
        <ErrorView
          error={error}
          onLogin={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }}
        />
      );
    }
    return <ErrorView error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-6 pb-34 relative">
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowPopup(false)}
          />
          <div
            className={`relative z-10 w-full max-w-md p-6 rounded-2xl shadow-xl ${
              message.type === "success"
                ? "bg-gradient-to-br from-green-400 to-emerald-500"
                : "bg-gradient-to-br from-red-400 to-pink-500"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 p-2 rounded-full bg-white/20">
                {message.type === "success" ? (
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {message.type === "success" ? "Success!" : "Error"}
                </h3>
                <p className="text-white/90">{message.text}</p>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-600">
            Your Delivery Hub
          </h1>
          <p className="mt-2 text-amber-700">Track & Succeed with Ease</p>
        </div>

        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <UserProfileCard user={user} status={status} />
              <StatsSection
                earnings={earnings}
                completedOrders={completedOrders}
                pendingOrders={pendingOrders}
              />
            </div>

            <div className="lg:col-span-3 space-y-6">
              {nextDelivery && nextDelivery.status === "accepted" ? (
                <DeliveryRouteMap
                  currentLocation={
                    currentLocation || {
                      lat: user.currentLocation?.latitude || 6.9271,
                      lng: user.currentLocation?.longitude || 79.8612,
                    }
                  }
                  destination={{
                    latitude: nextDelivery.latitude || 6.9271,
                    longitude: nextDelivery.longitude || 79.8612,
                  }}
                  orderId={nextDelivery.id}
                />
              ) : (
                <MapSection
                  currentLocation={
                    currentLocation || {
                      lat: user.currentLocation?.latitude || 6.9271,
                      lng: user.currentLocation?.longitude || 79.8612,
                    }
                  }
                  user={user}
                  pendingOrders={pendingOrders}
                />
              )}

              {nextDelivery ? (
                <NextDeliveryCard
                  nextDelivery={nextDelivery}
                  handleDeliveryAction={handleDeliveryAction}
                  status={status}
                />
              ) : (
                <NoDeliveriesCard />
              )}

              <PendingOrdersSection pendingOrders={pendingOrders} />
            </div>
          </div>
        )}

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
          user={user}
          recipientType={recipientType}
          onBack={handleBackToOptions}
        />
      </div>
    </div>
  );
}

const UserProfileCard = ({ user, status }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100 transform transition-all hover:scale-[1.01]">
    <div className="flex items-center space-x-4">
      <div className="relative">
        {user.profilePicture ? (
          <img
            src={user.profilePicture}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
            onError={(e) => (e.target.src = "https://via.placeholder.com/150")}
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md">
            {user.name.charAt(0)}
          </div>
        )}
        <StatusIndicator
          status={status}
          className="absolute -bottom-1 -right-1"
        />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-800">Welcome {user.name}</h2>
        <p className="text-sm text-amber-600">{user.vehicleType}</p>
        <p className="text-xs text-gray-500">{user.vehicleNumber}</p>
      </div>
    </div>
  </div>
);

const StatsSection = ({ earnings, completedOrders, pendingOrders }) => (
  <div className="space-y-4">
    <StatCard
      label="Today's Earnings"
      value={`LKR ${earnings}`}
      icon="💰"
      gradient="from-green-400 to-emerald-500"
    />
    <StatCard
      label="Completed"
      value={completedOrders}
      icon="✅"
      gradient="from-blue-400 to-cyan-500"
    />
    <StatCard
      label="Pending"
      value={pendingOrders.length}
      icon="⏳"
      gradient="from-amber-400 to-orange-500"
    />
  </div>
);

const MapSection = ({ currentLocation, user, pendingOrders }) => {
  console.log("MapSection - currentLocation:", currentLocation);
  console.log("MapSection - pendingOrders:", pendingOrders);

  const destination =
    pendingOrders.length > 0
      ? {
          latitude: pendingOrders[0].latitude || 9.729583,
          longitude: pendingOrders[0].longitude || 80.2215,
        }
      : {
          latitude: 9.729583,
          longitude: 80.2215,
        };

  const hasFallbackRoute =
    destination.latitude === 9.729583 && destination.longitude === 80.2215;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-100"></div>
  );
};

const DeliveryRouteMap = ({ currentLocation, destination, orderId }) => {
  console.log("DeliveryRouteMap - currentLocation:", currentLocation);
  console.log("DeliveryRouteMap - destination:", destination);
  console.log("DeliveryRouteMap - orderId:", orderId);
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-100">
      <div className="p-4 border-b border-orange-100">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          Delivery Route
        </h3>
      </div>
      <div className="h-80 md:h-96">
        {currentLocation && destination ? (
          <DeliveryMap
            currentLocation={currentLocation}
            destination={destination}
            orderId={orderId}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Waiting for location data...</p>
          </div>
        )}
      </div>
    </div>
  );
};

const NextDeliveryCard = ({ nextDelivery, handleDeliveryAction, status }) => {
  const isAcceptDisabled = status === "busy" || status === "offline";

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-lg overflow-hidden text-white">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold mb-1">Next Delivery</h3>
            <p className="text-amber-100 text-sm">
              {isAcceptDisabled
                ? "Cannot accept: You are currently busy or offline"
                : "Priority Order"}
            </p>
          </div>
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
            {nextDelivery.distance} • {nextDelivery.time}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center">
            <div className="bg-white/20 p-2 rounded-lg mr-3">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold">{nextDelivery.customerName}</p>
              <p className="text-amber-100 text-sm">
                Deliver by: {nextDelivery.deliveryBy}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="bg-white/20 p-2 rounded-lg mr-3">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <p className="text-sm">{nextDelivery.address}</p>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={() => handleDeliveryAction("accept", nextDelivery.id)}
            disabled={isAcceptDisabled}
            className={`flex-1 bg-white text-amber-600 px-4 py-3 rounded-lg font-bold flex items-center justify-center transition-all ${
              isAcceptDisabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-50"
            }`}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Accept Delivery
          </button>
          <button
            onClick={() => handleDeliveryAction("reject", nextDelivery.id)}
            className="flex-1 bg-transparent border-2 border-white text-white px-4 py-3 rounded-lg font-bold hover:bg-white/10 transition-all"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

const NoDeliveriesCard = () => (
  <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100 text-center">
    <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-3">
      <svg
        className="w-8 h-8 text-amber-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-700">
      No upcoming deliveries
    </h3>
    <p className="text-gray-500 mt-1">
      You'll be notified when new orders arrive
    </p>
  </div>
);

const PendingOrdersSection = ({ pendingOrders }) => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-100">
    <div className="p-4 border-b border-orange-100 flex justify-between items-center">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
        <svg
          className="w-5 h-5 mr-2 text-amber-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        Pending Orders ({pendingOrders.length})
      </h3>
      <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
        {pendingOrders.length} waiting
      </span>
    </div>

    {pendingOrders.length > 0 ? (
      <div className="divide-y divide-orange-100">
        {pendingOrders.map((order) => (
          <div
            key={order.id}
            className="p-4 hover:bg-amber-50 transition-colors"
          >
            <div className="flex justify-between">
              <div>
                <p className="font-medium text-gray-800">
                  #{order.id.slice(-6)}
                </p>
                <p className="text-sm text-gray-600">{order.customerName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{order.distance}</p>
                <p className="text-xs text-amber-600">{order.deliveryBy}</p>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="truncate max-w-[160px]">{order.address}</span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    (window.location.href = `/delivery/orders/${order.id}/track`)
                  }
                  className="text-xs bg-amber-500 text-white px-3 py-1 rounded-full hover:bg-amber-600 transition-colors"
                >
                  Start Delivery
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="p-6 text-center text-gray-500">
        <p>No pending orders available</p>
      </div>
    )}
  </div>
);

const LoadingView = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-lg font-medium text-gray-700">
        Loading dashboard...
      </p>
    </div>
  </div>
);

const ErrorView = ({ error, onRetry, onLogin }) => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center p-6 bg-white rounded-xl shadow-md max-w-md mx-4">
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
      <h3 className="mt-4 text-lg font-medium text-gray-900">
        Error Loading Dashboard
      </h3>
      <p className="mt-2 text-gray-600">{error}</p>
      {onLogin ? (
        <button
          onClick={onLogin}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="-ml-1 mr-2 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
          Log In
        </button>
      ) : (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="-ml-1 mr-2 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Try Again
        </button>
      )}
    </div>
  </div>
);

const StatusIndicator = ({ status, className = "" }) => {
  const statusColors = {
    online: "bg-green-500",
    busy: "bg-yellow-500",
    offline: "bg-gray-400",
    available: "bg-blue-500",
  };

  const statusText = {
    online: "Available for deliveries",
    busy: "Currently on delivery",
    offline: "Offline",
    available: "Ready for orders",
  };

  return (
    <div className={`relative group ${className}`}>
      <div
        className={`h-4 w-4 rounded-full border-2 border-white ${statusColors[status]}`}
      ></div>
      <div className="absolute z-10 left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
        {statusText[status]}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-800"></div>
      </div>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  icon,
  gradient = "from-amber-400 to-orange-500",
}) => (
  <div className="bg-white rounded-xl shadow-sm p-4 border border-orange-100">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
      {icon && (
        <div
          className={`bg-gradient-to-br ${gradient} p-2 rounded-lg text-white`}
        >
          {icon}
        </div>
      )}
    </div>
  </div>
);

export default Dashboard;
