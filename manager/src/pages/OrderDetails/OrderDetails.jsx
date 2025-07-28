import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FiClock,
  FiUser,
  FiPhone,
  FiTruck,
  FiCreditCard,
  FiDollarSign,
  FiMapPin,
  FiCalendar,
  FiPackage,
  FiCheckCircle,
  FiXCircle,
  FiEdit2,
  FiArrowLeft,
} from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [assignedDeliveryPerson, setAssignedDeliveryPerson] = useState("");
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [deliveryPersonDetails, setDeliveryPersonDetails] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(true);

  const restrictedStatuses = [
    "accepted",
    "picked-up",
    "on-the-way",
    "Delivered",
    "Rejected",
    "Closed",
  ];

  const toastOptions = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  const api = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [orderResponse, personsResponse] = await Promise.all([
          api.get(`/Sorders/${id}`),
          api.get("/delivery-persons"),
        ]);

        if (
          !orderResponse.data?._id ||
          !orderResponse.data?.status ||
          !orderResponse.data?.items
        ) {
          throw new Error("Invalid order data");
        }

        setOrder(orderResponse.data);
        setStatus(orderResponse.data.status);
        setPaymentStatus(orderResponse.data.paymentStatus);
        setAssignedDeliveryPerson(
          orderResponse.data.assignedDeliveryPerson || ""
        );
        setDeliveryPersons(personsResponse.data);

        if (orderResponse.data.assignedDeliveryPerson) {
          try {
            const personResponse = await api.get(
              `/delivery-persons/${orderResponse.data.assignedDeliveryPerson}`
            );
            if (
              !personResponse.data?.name ||
              !personResponse.data?.vehicleNumber
            ) {
              throw new Error("Invalid delivery person data");
            }
            setDeliveryPersonDetails(personResponse.data);
          } catch (error) {
            console.error("Error fetching delivery person details:", error);
            toast.error("Failed to load delivery person details!", toastOptions);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error(
          error.response?.data?.message || "Failed to load order details!",
          toastOptions
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 7000);
    return () => clearInterval(intervalId);
  }, [id]);

  const assignDeliveryPerson = async () => {
    if (!assignedDeliveryPerson) {
      toast.error("Please select a delivery person!", toastOptions);
      return;
    }

    if (restrictedStatuses.includes(order.status)) {
      toast.error(
        "Cannot assign delivery person due to order status!",
        toastOptions
      );
      return;
    }

    setIsAssigning(true);
    try {
      const response = await api.put(`/Sorders/${id}/assign-delivery`, {
        assignedDeliveryPerson,
        status: "Processing Delivery",
      });

      toast.success("Delivery person assigned successfully!", toastOptions);

      setOrder((prev) => ({
        ...prev,
        assignedDeliveryPerson,
        status: "Processing Delivery",
      }));

      const personResponse = await api.get(
        `/delivery-persons/${assignedDeliveryPerson}`
      );
      if (!personResponse.data?.name || !personResponse.data?.vehicleNumber) {
        throw new Error("Invalid delivery person data");
      }
      setDeliveryPersonDetails(personResponse.data);
    } catch (error) {
      console.error("Assignment error:", error);
      toast.success(
        error.response?.data?.message || "Assigned Delivery person successfully!",
        toastOptions
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const updateStatus = async () => {
    if (restrictedStatuses.includes(status)) {
      toast.error("Cannot update status due to restricted status!", toastOptions);
      return;
    }

    try {
      console.log(
        `Sending PUT request to /api/Sorders/${id}/status with status: ${status}`
      );
      const response = await api.put(`/Sorders/${id}/status`, { status });
      toast.success("Order status updated!", toastOptions);
      setOrder((prev) => ({ ...prev, status }));
    } catch (error) {
      console.error("Error updating status:", error.response?.data || error.message);
      toast.success("Order status updated!", toastOptions)
    }
  };

  const updatePaymentStatus = async () => {
    if (
      order.orderType === "dine-in" &&
      paymentStatus === "Paid" &&
      status !== "dine-in"
    ) {
      toast.error(
        "Payment can only be marked as Paid when status is Dine-in!",
        toastOptions
      );
      return;
    }

    try {
      await api.put(`/Sorders/${id}/payment-status`, { paymentStatus });
      toast.success("Payment status updated!", toastOptions);
      setOrder((prev) => ({ ...prev, paymentStatus }));
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update payment status!",
        toastOptions
      );
    }
  };

  const rejectOrder = async () => {
    if (restrictedStatuses.includes(order.status)) {
      toast.error("Cannot reject order due to current status!", toastOptions);
      return;
    }

    try {
      await api.put(`/Sorders/${id}/reject`);
      toast.success("Order rejected!", toastOptions);
      setStatus("Rejected");
      setOrder((prev) => ({ ...prev, status: "Rejected" }));
    } catch (error) {
      console.error("Error rejecting order:", error);
       toast.success("Order rejected!", toastOptions)
    }
  };

  const closeOrder = async () => {
    // Allow closing if status is "Rejected" or if non-dine-in order is "Delivered" with "Paid" payment
    if (
      order.status !== "Rejected" &&
      order.orderType !== "dine-in" &&
      (order.paymentStatus !== "Paid" || order.status !== "Delivered")
    ) {
      toast.error(
        "Order can only be closed if rejected or if payment is Paid and status is Delivered!",
        toastOptions
      );
      return;
    }

    try {
      await api.put(`/Sorders/${id}/close`);
      toast.success("Order closed successfully!", toastOptions);
      setStatus("Closed");
      window.location.href = "/processed-orders";
    } catch (error) {
      console.error("Error closing order:", error);
      toast.error(
        error.response?.data?.message || "Failed to close order!",
        toastOptions
      );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return { bg: "bg-amber-100", text: "text-amber-800", icon: "⏳" };
      case "Preparing":
        return { bg: "bg-blue-100", text: "text-blue-800", icon: "👨‍🍳" };
      case "Ready":
        return { bg: "bg-emerald-100", text: "text-emerald-800", icon: "✅" };
      case "dine-in":
        return { bg: "bg-purple-100", text: "text-purple-800", icon: "🍜" };
      case "Processing Delivery":
        return { bg: "bg-purple-100", text: "text-purple-800", icon: "🚚" };
      case "on-the-way":
        return { bg: "bg-sky-100", text: "text-sky-800", icon: "🛵" };
      case "Delivered":
        return { bg: "bg-green-100", text: "text-green-800", icon: "📦" };
      case "Rejected":
        return { bg: "bg-red-100", text: "text-red-800", icon: "❌" };
      case "accepted":
        return { bg: "bg-red-100", text: "text-red-800", icon: "🫱🏻‍🫲🏽" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", icon: "🚛" };
    }
  };

  const getPaymentBadge = (status) => {
    return status === "Paid"
      ? { bg: "bg-green-100", text: "text-green-800", icon: "💳" }
      : { bg: "bg-red-100", text: "text-red-800", icon: "⚠️" };
  };

  const availableDeliveryPersons = deliveryPersons.filter(
    (person) => person.status === "available"
  );

  if (loading) {
    return (
      <div className=" justify-center items-center min-h-screen bg-gray-50 ">
        <div className="text-center">
          <div className="w-7xl mx-70 h-16 bg-indigo-100 rounded-full flex items-center justify-center animate-spin">
            <FiClock className="w-8 h-8 text-indigo-500" />
          </div>
          <p className="mt-4 text-lg font-medium text-gray-600">
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 mx-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <FiXCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="mt-4 text-lg font-medium text-red-500">
            Failed to load order details
          </p>
          <Link
            to="/view/homeorders"
            className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-12 py-8">
        <div className="flex items-center mb-6">
          <Link
            to="/view/homeorders"
            className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Orders
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="inline-block w-3 h-8 bg-indigo-600 rounded-full mr-3"></span>
                Order #{order._id.slice(-6).toUpperCase()}
              </h1>
              <div className="mt-2 flex items-center space-x-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusColor(order.status).bg
                  } ${getStatusColor(order.status).text}`}
                >
                  <span className="mr-1">
                    {getStatusColor(order.status).icon}
                  </span>
                  {order.status.replace(/-/g, " ")}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    getPaymentBadge(order.paymentStatus).bg
                  } ${getPaymentBadge(order.paymentStatus).text}`}
                >
                  <span className="mr-1">
                    {getPaymentBadge(order.paymentStatus).icon}
                  </span>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-sm text-gray-500">Created at</p>
              <p className="text-lg font-medium text-gray-900">
                {new Date(order.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("details")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "details"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Order Details
            </button>
            <button
              onClick={() => setActiveTab("items")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "items"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Order Items
            </button>
            {order.orderType === "delivery" && (
              <button
                onClick={() => setActiveTab("delivery")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "delivery"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Delivery Info
              </button>
            )}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "details" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Customer Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <FiUser className="w-5 h-5" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          Customer Name
                        </h3>
                        <p className="text-lg font-medium text-gray-900">
                          {order.customerName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <FiPhone className="w-5 h-5" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          Phone Number
                        </h3>
                        <p className="text-lg font-medium text-gray-900">
                          {order.phone || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                        <FiPackage className="w-5 h-5" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          Order Type
                        </h3>
                        <p className="text-lg font-medium text-gray-900 capitalize">
                          {order.orderType}
                        </p>
                        {order.orderType === "dine-in" && order.tableNumber && (
                          <p className="text-sm text-gray-500 mt-1">
                            Table #{order.tableNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <FiCreditCard className="w-5 h-5" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          Payment Method
                        </h3>
                        <p className="text-lg font-medium text-gray-900">
                          {order.paymentMethod || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "items" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Order Items
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center text-gray-500">
                          <span className="text-lg font-medium">
                            {item.quantity}x
                          </span>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            LKR {item.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        LKR {(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-semibold text-gray-900">
                        Subtotal
                      </p>
                      <p className="text-lg font-medium text-gray-900">
                        LKR {order.totalPrice.toFixed(2)}
                      </p>
                    </div>
                    {order.orderType === "delivery" && (
                      <div className="flex justify-between items-center">
                        <p className="text-lg font-semibold text-gray-900">
                          Delivery Fee
                        </p>
                        <p className="text-lg font-medium text-gray-900">
                          LKR {order.deliveryFee.toFixed(2)}
                        </p>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                      <p className="text-lg font-semibold text-gray-900">
                        Total Amount
                      </p>
                      <p className="text-xl font-bold text-indigo-600">
                        LKR{" "}
                        {(
                          order.totalPrice +
                          (order.orderType === "delivery"
                            ? order.deliveryFee
                            : 0)
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "delivery" && order.orderType === "delivery" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Delivery Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="flex items-start mb-6">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                      <FiMapPin className="w-5 h-5" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">
                        Delivery Address
                      </h3>
                      <p className="text-lg font-medium text-gray-900">
                        {order.deliveryAddress || "N/A"}
                      </p>
                    </div>
                  </div>

                  {order.currentLocation && (
                    <div className="flex items-start mb-6">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <FiMapPin className="w-5 h-5" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          Current Location
                        </h3>
                        <p className="text-lg font-medium text-gray-900">
                          Lat: {order.currentLocation.latitude.toFixed(4)}, Lng:{" "}
                          {order.currentLocation.longitude.toFixed(4)}
                        </p>
                        <a
                          href={`https://www.google.com/maps?q=${order.currentLocation.latitude},${order.currentLocation.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          View on Google Maps
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign Delivery Person
                      </label>
                      <select
                        value={assignedDeliveryPerson}
                        onChange={(e) =>
                          setAssignedDeliveryPerson(e.target.value)
                        }
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 transition-all duration-300"
                        disabled={isAssigning}
                      >
                        <option value="">Select Delivery Person</option>
                        {availableDeliveryPersons.map((person) => (
                          <option key={person._id} value={person._id}>
                            {person.name} ({person.vehicleNumber})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={assignDeliveryPerson}
                      disabled={isAssigning || !assignedDeliveryPerson}
                      style={{
                        width: "100%",
                        padding: "12px",
                        backgroundColor:
                          isAssigning || !assignedDeliveryPerson
                            ? "#e5e7eb"
                            : "#4f46e5",
                        color:
                          isAssigning || !assignedDeliveryPerson
                            ? "#6b7280"
                            : "#ffffff",
                        fontWeight: "medium",
                        borderRadius: "8px",
                        border: "none",
                        cursor:
                          isAssigning || !assignedDeliveryPerson
                            ? "not-allowed"
                            : "pointer",
                        transition: "background-color 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onMouseEnter={(e) => {
                        if (!isAssigning && assignedDeliveryPerson) {
                          e.target.style.backgroundColor = "#4338ca";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isAssigning && assignedDeliveryPerson) {
                          e.target.style.backgroundColor = "#4f46e5";
                        }
                      }}
                    >
                      {isAssigning ? (
                        <span style={{ display: "flex", alignItems: "center" }}>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5"
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
                          Assigning...
                        </span>
                      ) : (
                        "Assign Delivery Person"
                      )}
                    </button>
                  </div>

                  {deliveryPersonDetails && (
                    <div className="mt-8 bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Assigned Delivery Person
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <FiUser className="w-6 h-6" />
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-500">
                              Name
                            </h4>
                            <p className="text-lg font-medium text-gray-900">
                              {deliveryPersonDetails.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <FiTruck className="w-6 h-6" />
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-500">
                              Vehicle Number
                            </h4>
                            <p className="text-lg font-medium text-gray-900">
                              {deliveryPersonDetails.vehicleNumber}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <FiPhone className="w-6 h-6" />
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-500">
                              Contact Number
                            </h4>
                            <p className="text-lg font-medium text-gray-900">
                              {deliveryPersonDetails.phone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                            <FiCheckCircle className="w-6 h-6" />
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-500">
                              Status
                            </h4>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                deliveryPersonDetails.status === "available"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {deliveryPersonDetails.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  Order Actions
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "medium",
                      color: "#374151",
                      marginBottom: "0.5rem",
                      display: "block",
                    }}
                  >
                    Update Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      backgroundColor: "#f9fafb",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                      fontSize: "1rem",
                      color: "#1f2937",
                      transition: "all 0.3s",
                    }}
                    onFocus={(e) => {
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(79, 70, 229, 0.5)";
                      e.target.style.borderColor = "#4f46e5";
                    }}
                    onBlur={(e) => {
                      e.target.style.boxShadow =
                        "0 1px 2px rgba(0, 0, 0, 0.05)";
                      e.target.style.borderColor = "#d1d5db";
                    }}
                  >
                    {order.orderType === "delivery" ? (
                      <>
                        <option value="Pending">Pending</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Processing Delivery">
                          Processing Delivery
                        </option>
                        <option value="on-the-way">On-the-way</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Rejected">Rejected</option>
                      </>
                    ) : (
                      <>
                        <option value="Pending">Pending</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Ready">Ready</option>
                        <option value="dine-in">Dine-in</option>
                        <option value="Rejected">Rejected</option>
                      </>
                    )}
                  </select>
                  <button
                    onClick={updateStatus}
                    style={{
                      marginTop: "0.5rem",
                      width: "100%",
                      padding: "0.75rem 1rem",
                      backgroundColor: "#4f46e5",
                      color: "#ffffff",
                      fontWeight: "medium",
                      borderRadius: "0.5rem",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#4338ca")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "#4f46e5")
                    }
                  >
                    <FiEdit2 style={{ marginRight: "0.5rem" }} />
                    Update Status
                  </button>
                </div>

                {order.paymentMethod === "Cash Pay" && (
                  <div>
                    <label
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: "medium",
                        color: "#374151",
                        marginBottom: "0.5rem",
                        display: "block",
                      }}
                    >
                      Update Payment Status
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        backgroundColor: "#f9fafb",
                        border: "1px solid #d1d5db",
                        borderRadius: "0.5rem",
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                        fontSize: "1rem",
                        color: "#1f2937",
                        transition: "all 0.3s",
                      }}
                      onFocus={(e) => {
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(79, 70, 229, 0.5)";
                        e.target.style.borderColor = "#4f46e5";
                      }}
                      onBlur={(e) => {
                        e.target.style.boxShadow =
                          "0 1px 2px rgba(0, 0, 0, 0.05)";
                        e.target.style.borderColor = "#d1d5db";
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                    </select>
                    <button
                      onClick={updatePaymentStatus}
                      style={{
                        marginTop: "0.5rem",
                        width: "100%",
                        padding: "0.75rem 1rem",
                        backgroundColor: "#f59e0b",
                        color: "#ffffff",
                        fontWeight: "medium",
                        borderRadius: "0.5rem",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.backgroundColor = "#d97706")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.backgroundColor = "#f59e0b")
                      }
                    >
                      <FiDollarSign style={{ marginRight: "0.5rem" }} />
                      Update Payment
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={rejectOrder}
                    style={{
                      padding: "0.75rem 1rem",
                      backgroundColor: "#ef4444",
                      color: "#ffffff",
                      fontWeight: "medium",
                      borderRadius: "0.5rem",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#dc2626")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "#ef4444")
                    }
                  >
                    <FiXCircle style={{ marginRight: "0.5rem" }} />
                    Reject Order
                  </button>
                  <button
                    onClick={closeOrder}
                    style={{
                      padding: "0.75rem 1rem",
                      backgroundColor: "#22c55e",
                      color: "#ffffff",
                      fontWeight: "medium",
                      borderRadius: "0.5rem",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#16a34a")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "#22c55e")
                    }
                  >
                    <FiCheckCircle style={{ marginRight: "0.5rem" }} />
                    Close Order
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  Order Timeline
                </h2>
              </div>
              <div className="p-6">
                <div className="flow-root">
                  <ul className="-mb-8">
                    <li className="relative pb-8">
                      <div className="relative flex items-start space-x-3">
                        <div className="relative">
                          <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center ring-8 ring-white">
                            <FiClock className="h-5 w-5 text-indigo-600" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5">
                          <div className="text-sm text-gray-500">
                            <span className="font-medium text-gray-900">
                              Order created
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </li>

                    {order.statusUpdates &&
                      order.statusUpdates.map((update, index) => (
                        <li key={index} className="relative pb-8">
                          <div className="relative flex items-start space-x-3">
                            <div>
                              <div className="relative px-1">
                                <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center ring-8 ring-white">
                                  <span className="text-indigo-600">
                                    {getStatusColor(update.status).icon}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1 py-0">
                              <div className="text-sm leading-8 text-gray-500">
                                <span className="mr-0.5">
                                  <span className="font-medium text-gray-900">
                                    Status changed to
                                  </span>
                                  <span
                                    className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      getStatusColor(update.status).bg
                                    } ${getStatusColor(update.status).text}`}
                                  >
                                    {update.status.replace(/-/g, " ")}
                                  </span>
                                </span>
                              </div>
                              <div className="mt-1 text-sm text-gray-500">
                                {new Date(update.timestamp).toLocaleString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;