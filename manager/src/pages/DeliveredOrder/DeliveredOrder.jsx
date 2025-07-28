import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import DatePicker from "react-date-picker";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.protocol === "https:"
    ? "https://localhost:3001"
    : "http://localhost:5000");

function DeliveredOrder() {
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const pdfRef = useRef();

  const fetchDeliveredOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found, please log in.");

      const response = await axios.get(`${API_BASE_URL}/api/delivered-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const orders = response.data || [];
      setDeliveredOrders(orders);
      setFilteredOrders(orders);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to load delivered orders"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveredOrders();
  }, []);

  useEffect(() => {
    let filtered = [...deliveredOrders];
    
    if (selectedDate) {
      const selected = new Date(selectedDate);
      const offsetMs = selected.getTimezoneOffset() * 60 * 1000;
      const selectedUTC = new Date(selected.getTime() - offsetMs);
      selectedUTC.setUTCHours(0, 0, 0, 0);

      filtered = filtered.filter((order) => {
        const deliveredAt = new Date(order.deliveredAt);
        const deliveredAtUTC = new Date(Date.UTC(deliveredAt.getUTCFullYear(), deliveredAt.getUTCMonth(), deliveredAt.getUTCDate()));
        return deliveredAtUTC.getTime() === selectedUTC.getTime();
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderId.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.deliveryAddress.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  }, [selectedDate, deliveredOrders, searchQuery]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const clearFilters = () => {
    setSelectedDate(null);
    setSearchQuery("");
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(40);
      doc.text("Delivered Orders Report", 105, 15, { align: "center" });
      
      // Date
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 25, { align: "center" });

      // Table data
      const tableData = filteredOrders.map(order => [
        order.orderId,
        order.customerName,
        order.deliveryAddress,
        new Date(order.deliveredAt).toLocaleDateString(),
        `LKR ${order.totalPrice?.toFixed(2) || '0.00'}`,
        order.assignedDeliveryPerson?.name || 'Unassigned'
      ]);

      // Table headers
      const headers = [
        "Order ID",
        "Customer",
        "Address",
        "Delivered Date",
        "Total",
        "Delivery Person"
      ];

      // Generate the table
      doc.autoTable({
        head: [headers],
        body: tableData,
        startY: 30,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: 'linebreak'
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 'auto' },
          4: { cellWidth: 'auto', halign: 'right' },
          5: { cellWidth: 'auto' }
        }
      });

      // Summary section
      const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      const firstDelivery = filteredOrders.length > 0 
        ? new Date(Math.min(...filteredOrders.map(o => new Date(o.deliveredAt)))).toLocaleDateString()
        : 'N/A';
      const lastDelivery = filteredOrders.length > 0
        ? new Date(Math.max(...filteredOrders.map(o => new Date(o.deliveredAt)))).toLocaleDateString()
        : 'N/A';

      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text("Summary Statistics", 15, doc.lastAutoTable.finalY + 15);

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        body: [
          ["Total Orders", filteredOrders.length],
          ["First Delivery", firstDelivery],
          ["Last Delivery", lastDelivery],
          ["Total Revenue", `LKR ${totalRevenue.toFixed(2)}`]
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'right' }
        }
      });

      // Save the PDF
      doc.save(`delivered_orders_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorView error={error} onRetry={fetchDeliveredOrders} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 py-10 px-0 sm:pl-10 lg:pl-20 transition-all duration-300 overflow-x-hidden">
      <div className="w-5xl mx-5 space-y-8 px-0 sm:px-2" ref={pdfRef}>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start justify-start gap-6 bg-white rounded-xl p-6 sm:p-8 shadow-lg border border-gray-200/70 ml-[-50px]">
          <div className="flex-1">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Delivered Orders</h1>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 shadow-inner">
                  {filteredOrders.length} Successful
                </span>
              </div>
              <p className="text-sm text-gray-600 font-medium">Track and manage successfully delivered orders</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 px-4 sm:px-6 py-3 sm:py-4 rounded-xl border border-green-200 shadow-inner">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Total Delivered</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-700 mt-1">{filteredOrders.length}</p>
          </div>
        </div>

        {/* Control Panel */}
        <div className="flex flex-col sm:flex-row items-start justify-start gap-6 bg-white rounded-2xl shadow-lg border border-gray-200/70 p-4 sm:p-6 sticky top-0 z-10 ml-[-55px]">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 items-start">
            <div className="relative w-full lg:w-[500px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search orders by ID, customer, or address..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 text-sm shadow-sm hover:border-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full lg:w-[280px]">
                <DatePicker
                  onChange={handleDateChange}
                  value={selectedDate}
                  className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm shadow-sm hover:border-gray-400"
                  calendarClassName="border border-gray-300 rounded-xl shadow-xl bg-white mt-2"
                  calendarIcon={<svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  clearIcon={<svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                />
              </div>
              <button
                onClick={clearFilters}
                className="px-4 sm:px-5 py-3 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
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
            <div className="bg-white p-6 sm:p-10 rounded-r-2xl shadow-lg border border-gray-200/70">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 sm:h-20 sm:w-20 bg-green-50 rounded-full flex items-center justify-center shadow-inner">
                  <svg className="h-8 w-8 sm:h-10 sm:w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">No Delivered Orders Found</h3>
                  <p className="mt-2 text-gray-500">Try adjusting your search or filter criteria to find what you're looking for</p>
                </div>
              </div>
              <button
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#4f46e5',
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
                onClick={clearFilters}
                className="mt-6 sm:mt-8 inline-flex items-center px-5 sm:px-6 py-3 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg"
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
  <div className="min-h-screen flex items-start pt-10 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 px-0 sm:pl-20 lg:pl-72 transition-all duration-300 overflow-x-hidden">
    <div className="p-6 sm:p-10 bg-white rounded-r-2xl shadow-xl border border-gray-200/70 w-full px-4 sm:px-6">
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="relative">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-green-50 flex items-center justify-center shadow-inner">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-gray-800">Loading Dashboard</p>
          <p className="mt-2 text-sm text-gray-500 font-medium">Fetching delivered orders data...</p>
        </div>
      </div>
    </div>
  </div>
);

const ErrorView = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-start pt-10 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 px-0 sm:pl-20 lg:pl-72 transition-all duration-300 overflow-x-hidden">
    <div className="p-6 sm:p-10 bg-white rounded-r-2xl shadow-xl border border-gray-200/70 w-full px-4 sm:px-6">
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-red-100 flex items-center justify-center shadow-inner">
          <svg className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Error Loading Data</h3>
          <p className="mt-2 text-sm text-gray-600 font-medium">{error}</p>
        </div>
      </div>
      <button
        onClick={onRetry}
        className="mt-6 sm:mt-8 inline-flex items-center px-5 sm:px-6 py-3 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg"
      >
        Retry Loading
      </button>
    </div>
  </div>
);

const OrderItem = ({ order }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200/70 overflow-hidden transition-all duration-300 ml-[-50px] ${expanded ? 'ring-2 ring-green-500' : 'hover:shadow-xl hover:border-green-300'}`}>
      <div 
        className="p-4 sm:p-6 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="font-bold text-lg sm:text-xl text-gray-900">#{order.orderId}</span>
                <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 shadow-inner">
                  Delivered
                </span>
                <span 
                className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 shadow-inner">
                  {new Date(order.deliveredAt).toLocaleDateString()}
                  
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-5">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200/70">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Customer</p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">{order.customerName}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200/70">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Delivery Person</p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">{order.assignedDeliveryPerson?.name || "Unassigned"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200/70">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Delivered At</p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">{new Date(order.deliveredAt).toLocaleTimeString()}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200/70">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Status</p>
                  <p className="mt-1 text-sm font-semibold text-green-600">Successfully Delivered</p>
                </div>
              </div>
            </div>
          </div>
          <button 
          style={{
                  width: '10%',
                  height:'10%',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#4f46e5',
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
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-white transition-all duration-300 shadow-sm self-start"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            <svg 
              className={`w-4 h-4 sm:w-5 sm:h-5 transform transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} 
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
        <div className="px-4 sm:px-6 pb-6 sm:pb-8 border-t border-gray-200/70 bg-gray-50/70 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-4 sm:mt-5">
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/70 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Delivery Details
              </h4>
              <div className="space-y-3 sm:space-y-4 text-sm">
                <div className="flex gap-3">
                  <span className="font-medium text-gray-800 min-w-[90px]">Address:</span>
                  <span className="text-gray-600">{order.deliveryAddress}</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-medium text-gray-800 min-w-[90px]">Contact:</span>
                  <span className="text-gray-600">{order.customerPhone || 'N/A'}</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-medium text-gray-800 min-w-[90px]">Fee:</span>
                  <span className="text-gray-600">LKR {order.deliveryFee?.toFixed(2) || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/70 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Order Information
              </h4>
              <div className="space-y-3 sm:space-y-4 text-sm">
                <div className="flex gap-3">
                  <span className="font-medium text-gray-800 min-w-[90px]">Total:</span>
                  <span className="text-gray-600">LKR {order.totalPrice?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-medium text-gray-800 min-w-[90px]">Delivered by:</span>
                  <span className="text-gray-600">{order.assignedDeliveryPerson?.name || 'System'}</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-medium text-gray-800 min-w-[90px]">Notes:</span>
                  <span className="text-gray-600">{order.notes || 'No additional notes'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4">
            <button className="px-4 sm:px-6 py-2.5 sm:py-3.5 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View Receipt
            </button>
            <button
            style={{
                  width: '20%',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#4f46e5',
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
            className="px-4 sm:px-6 py-2.5 sm:py-3.5 bg-white text-white rounded-xl hover:bg-gray-50 transition-all duration-300 text-sm font-semibold shadow-sm border border-gray-300 hover:border-gray-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>

              Contact Customer
            </button>
            <button 
            style={{
                  width: '20%',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#4f46e5',
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
            className="px-4 sm:px-6 py-2.5 sm:py-3.5 bg-white text-white rounded-xl hover:bg-gray-50 transition-all duration-300 text-sm font-semibold shadow-sm border border-gray-300 hover:border-gray-400 flex items-center gap-2">
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

export default DeliveredOrder;