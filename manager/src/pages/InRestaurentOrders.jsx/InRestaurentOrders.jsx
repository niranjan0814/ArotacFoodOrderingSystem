import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const InRestaurantOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({
    paymentStatus: "",
    orderStatus: "",
    orderType: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { paymentStatus, orderStatus } = filters;
        const params = new URLSearchParams();

        if (paymentStatus) params.append("paymentStatus", paymentStatus);
        if (orderStatus) params.append("orderStatus", orderStatus);

        const url = `http://localhost:5000/api/Sorders?${params.toString()}`;
        const response = await axios.get(url);
        setOrders(response.data);
      } catch (error) {
        console.error("Error fetching in-restaurant orders:", error);
        toast.error("Failed to load in-restaurant orders!");
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling every second
    const intervalId = setInterval(fetchData, 1000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      paymentStatus: "",
      orderStatus: "",
      orderType: "",
    });
  };

  const filteredOrders = orders.filter(order => {
    return (
      (!filters.paymentStatus || order.paymentStatus === filters.paymentStatus) &&
      (!filters.orderStatus || order.status === filters.orderStatus) &&
      (
        (order.orderType === "dine-in" || order.orderType === "takeaway") &&
        (!filters.orderType || order.orderType === filters.orderType)
      )
    );
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      "Pending": { bg: "bg-amber-100", text: "text-amber-800", icon: "⏳" },
      "Preparing": { bg: "bg-blue-100", text: "text-blue-800", icon: "👨‍🍳" },
      "Dine-in": { bg: "bg-green-100", text: "text-green-800", icon: "🍽️" },
      "Takeaway": { bg: "bg-yellow-100", text: "text-yellow-800", icon: "🥡" },
      "Completed": { bg: "bg-purple-100", text: "text-purple-800", icon: "✅" },
      "Rejected": { bg: "bg-red-100", text: "text-red-800", icon: "❌" },
      "Ready": { bg: "bg-red-100", text: "text-red-800", icon: "✨" },
      "default": { bg: "bg-gray-100", text: "text-gray-800", icon: "🚛" }
    };
    return statusMap[status] || statusMap.default;
  };

  const getPaymentBadge = (status) => {
    return status === "Paid"
      ? { bg: "bg-green-100", text: "text-green-800", icon: "💳" }
      : { bg: "bg-red-100", text: "text-red-800", icon: "⚠️" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-6xl mx-3 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">In-Restaurant Orders</h1>
            
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Link
              to="/order/add"
              className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-indigo-800 to-purple-800 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:from-indigo-900 hover:to-purple-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              <svg className="w-5 h-5 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Order
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{filteredOrders.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Dine-in Orders</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredOrders.filter(o => o.orderType === "dine-in").length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Takeaway Orders</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredOrders.filter(o => o.orderType === "takeaway").length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Payments</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredOrders.filter(o => o.paymentStatus === "Pending").length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-100 text-red-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <div className="relative">
                <select
                  name="paymentStatus"
                  value={filters.paymentStatus}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2.5 pr-8 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-700 appearance-none"
                >
                  <option value="">All Payment Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
              <div className="relative">
                <select
                  name="orderStatus"
                  value={filters.orderStatus}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2.5 pr-8 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-700 appearance-none"
                >
                  <option value="">All Order Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Dine-in">Dine-in</option>
                  <option value="Takeaway">Takeaway</option>
                  <option value="Completed">Completed</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
              <div className="relative">
                <select
                  name="orderType"
                  value={filters.orderType}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2.5 pr-8 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-700 appearance-none"
                >
                  <option value="">All Types</option>
                  <option value="dine-in">Dine-in</option>
                  <option value="takeaway">Takeaway</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#4f46e5', // Indigo-600
                  color: '#ffffff',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                }}
                className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {filters.orderType === "dine-in" 
                ? "Dine-in Orders" 
                : filters.orderType === "takeaway" 
                ? "Takeaway Orders" 
                : "In-Restaurant Orders"}
            </h2>
            <div className="mt-2 sm:mt-0 flex items-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {filteredOrders.length} orders
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table/Info
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              #{order._id.slice(-4).toUpperCase()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(order.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.orderType === "dine-in" 
                            ? "bg-purple-100 text-purple-800" 
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {order.orderType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.orderType === "dine-in" && order.tableNumber ? (
                          <div className="text-sm font-medium text-gray-900">
                            Table #{order.tableNumber}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 italic">
                            {order.notes || "No notes"}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(order.status).bg} ${getStatusBadge(order.status).text}`}>
                            <span className="mr-1">{getStatusBadge(order.status).icon}</span>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">{order.paymentMethod}</div>
                        <div className="mt-1">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentBadge(order.paymentStatus).bg} ${getPaymentBadge(order.paymentStatus).text}`}>
                            <span className="mr-1">{getPaymentBadge(order.paymentStatus).icon}</span>
                            {order.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/orders/${order._id}`}
                          className="text-indigo-600 hover:text-indigo-900 font-medium flex items-center justify-end"
                        >
                          View Details
                          <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg font-medium">No orders found</p>
                        <p className="text-sm mt-1">Try adjusting your filters or create a new order</p>
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

export default InRestaurantOrders;