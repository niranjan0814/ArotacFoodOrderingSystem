import React, { useEffect, useState } from "react";
import axios from "axios";
import DatePicker from "react-date-picker";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.protocol === "https:"
    ? "https://localhost:3001"
    : "http://localhost:5000");

function FailedOrders() {
  const [failedOrders, setFailedOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchFailedOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found, please log in.");

      const response = await axios.get(`${API_BASE_URL}/api/failed-orders/fail`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const orders = response.data || [];
      setFailedOrders(orders);
      setFilteredOrders(orders);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to load failed orders"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailedOrders();
  }, []);

  useEffect(() => {
    let filtered = [...failedOrders];
    
    if (selectedDate) {
      const selected = new Date(selectedDate);
      const offsetMs = selected.getTimezoneOffset() * 60 * 1000;
      const selectedUTC = new Date(selected.getTime() - offsetMs);
      selectedUTC.setUTCHours(0, 0, 0, 0);

      filtered = filtered.filter((order) => {
        const failedAt = new Date(order.failedAt);
        const failedAtUTC = new Date(Date.UTC(failedAt.getUTCFullYear(), failedAt.getUTCMonth(), failedAt.getUTCDate()));
        return failedAtUTC.getTime() === selectedUTC.getTime();
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderId.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.deliveryAddress.toLowerCase().includes(query) ||
        order.failureReason.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  }, [selectedDate, failedOrders, searchQuery]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const clearFilters = () => {
    setSelectedDate(null);
    setSearchQuery("");
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorView error={error} onRetry={fetchFailedOrders} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 py-10 px-4 sm:px-8 transition-all duration-300">
      <div className="w-screen-3xl mx-7 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white rounded-2xl p-8 shadow-lg border border-gray-200/70">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Failed Orders</h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 shadow-inner">
                {filteredOrders.length} Issues
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600 font-medium">Monitor and manage delivery failures efficiently</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center bg-gradient-to-br from-red-50 to-red-100 px-6 py-4 rounded-xl border border-red-200 shadow-inner">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Require Attention</p>
              <p className="text-3xl font-bold text-red-700 mt-1">{filteredOrders.length}</p>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/70 p-6 sticky top-0 z-10">
          <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between">
            <div className="relative w-full lg:w-[500px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search orders by ID, customer, address or reason..."
                className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 text-sm shadow-sm hover:border-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative">
                <DatePicker
                  onChange={handleDateChange}
                  value={selectedDate}
                  className="w-full lg:w-[280px] border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm hover:border-gray-400"
                  calendarClassName="border border-gray-300 rounded-xl shadow-xl bg-white mt-2"
                  calendarIcon={<svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  clearIcon={<svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                />
              </div>
              <button
              
                onClick={clearFilters}
                className="px-5 py-3.5 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-5">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderItem key={order._id} order={order} />
            ))
          ) : (
            <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-200/70 text-center">
              <div className="mx-auto h-28 w-28 bg-indigo-50 rounded-full flex items-center justify-center shadow-inner">
                <svg className="h-14 w-14 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-6 text-2xl font-bold text-gray-900">No Failed Orders Found</h3>
              <p className="mt-3 text-gray-500 max-w-md mx-auto">Try adjusting your search or filter criteria to find what you're looking for</p>
              <button
                onClick={clearFilters}
                className="mt-8 inline-flex items-center px-6 py-3.5 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const LoadingView = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 px-4 sm:px-8 transition-all duration-300">
    <div className="text-center p-10 bg-white rounded-2xl shadow-xl border border-gray-200/70 max-w-md w-full">
      <div className="flex flex-col items-center gap-5 justify-center">
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center shadow-inner">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
        <div>
          <p className="text-xl font-bold text-gray-800">Loading Dashboard</p>
          <p className="mt-2 text-sm text-gray-500 font-medium">Fetching failed orders data...</p>
        </div>
      </div>
    </div>
  </div>
);

const ErrorView = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 px-4 sm:px-8 transition-all duration-300">
    <div className="text-center max-w-md p-10 bg-white rounded-2xl shadow-xl border border-gray-200/70 w-full">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 shadow-inner">
        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="mt-6 text-xl font-bold text-gray-900">Error Loading Data</h3>
      <p className="mt-3 text-sm text-gray-600 font-medium">{error}</p>
      <button
        onClick={onRetry}
        className="mt-8 inline-flex items-center px-6 py-3.5 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg"
      >
        Retry Loading
      </button>
    </div>
  </div>
);

const OrderItem = ({ order }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-200/70 overflow-hidden transition-all duration-300 ${expanded ? 'ring-2 ring-indigo-500' : 'hover:shadow-xl hover:border-indigo-300'}`}>
      <div 
        className="p-6 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-xl text-gray-900">#{order.orderId}</span>
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 shadow-inner">
                Failed Delivery
              </span>
              <span className="ml-auto sm:ml-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 shadow-inner">
                {new Date(order.failedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200/70">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Customer</p>
                <p className="mt-1 text-sm font-semibold text-gray-800">{order.customerName}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200/70">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Delivery Person</p>
                <p className="mt-1 text-sm font-semibold text-gray-800">{order.assignedDeliveryPerson?.name || "Unassigned"}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200/70">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Failed At</p>
                <p className="mt-1 text-sm font-semibold text-gray-800">{new Date(order.failedAt).toLocaleTimeString()}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200/70">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Status</p>
                <p className="mt-1 text-sm font-semibold text-red-600">Requires Action</p>
              </div>
            </div>
          </div>
          <button 
          className="px-5 py-3.5 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            <svg 
              className={`w-5 h-5 transform transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-8 border-t border-gray-200/70 bg-gray-50/70 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-5">
            <div className="bg-white p-5 rounded-xl border border-gray-200/70 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Delivery Details
              </h4>
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <span className="font-medium text-gray-800 min-w-[90px]">Address:</span>
                  <span className="text-gray-600">{order.deliveryAddress}</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-medium text-gray-800 min-w-[90px]">Contact:</span>
                  <span className="text-gray-600">{order.customerPhone || 'N/A'}</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-medium text-gray-800 min-w-[90px]">Attempts:</span>
                  <span className="text-gray-600">{order.attemptCount || '1'}</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200/70 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Failure Information
              </h4>
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <span className="font-medium text-gray-800 min-w-[90px]">Reason:</span>
                  <span className="text-red-600">{order.failureReason}</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-medium text-gray-800 min-w-[90px]">Reported by:</span>
                  <span className="text-gray-600">{order.reportedBy || 'System'}</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-medium text-gray-800 min-w-[90px]">Notes:</span>
                  <span className="text-gray-600">{order.notes || 'No additional notes'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <button 
            className="px-5 py-3.5 bg-gradient-to-br from-teal-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Reattempt Delivery
            </button>
            <button className="px-5 py-3.5 bg-gradient-to-br from-teal-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Contact Customer
            </button>
            <button className="px-5 py-3.5 bg-gradient-to-br from-teal-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              View Full Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FailedOrders;