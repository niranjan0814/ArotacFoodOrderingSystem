import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MessagingModal from "./MessagingModal";
import { 
  FiMessageSquare, 
  FiPhone, 
  FiTruck,
  FiSearch,
  FiCheckCircle,
  FiClock,
  FiWifiOff,
  FiPhoneCall,
  FiArrowLeft
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const MessageOptionsModal = ({ socket, user }) => {
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  const API_BASE_URL = "http://localhost:5000";

  useEffect(() => {
    const fetchDeliveryPersons = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/api/delivery-persons`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDeliveryPersons(response.data);
      } catch (err) {
        setError("Failed to load delivery persons");
        console.error("Error fetching delivery persons:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeliveryPersons();
  }, []);

  const filteredPersons = deliveryPersons.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.phone.includes(searchTerm) ||
    person.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (deliveryPerson) => {
    setSelectedRecipient({ id: deliveryPerson._id, name: deliveryPerson.name });
    setIsMessagingOpen(true);
  };

  const handleCloseMessaging = () => {
    setIsMessagingOpen(false);
    setSelectedRecipient(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { color: "bg-emerald-100 text-emerald-800", icon: <FiCheckCircle className="text-emerald-500" /> },
      busy: { color: "bg-amber-100 text-amber-800", icon: <FiClock className="text-amber-500" /> },
      offline: { color: "bg-rose-100 text-rose-800", icon: <FiWifiOff className="text-rose-500" /> }
    };
    
    return statusConfig[status] || { color: "bg-gray-100 text-gray-800", icon: null };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      {/* Header */}
      <div className="w-4xl mx-12 items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full bg-white shadow-sm hover:bg-slate-100 transition-colors"
        >
          <FiArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Select Delivery Person</h1>
      </div>

      {/* Search Bar */}
      <div className="mb-8 max-w-2xl mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, phone or vehicle..."
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl shadow-sm border-0 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-rose-800">{error}</p>
            </div>
          </div>
        </div>
      ) : filteredPersons.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto h-32 w-32 text-slate-300 mb-4">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-slate-700">No delivery persons found</h3>
          <p className="mt-2 text-slate-500">
            {searchTerm ? "Try adjusting your search query" : "No delivery persons available"}
          </p>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          <AnimatePresence>
            {filteredPersons.map((person) => {
              const status = getStatusBadge(person.status);
              return (
                <motion.div
                  key={person._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-slate-100"
                >
                  <div className="p-5">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                          {person.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-800 truncate">{person.name}</h3>
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center text-sm text-slate-600">
                            <FiPhone className="mr-2 flex-shrink-0 text-slate-400" />
                            <a 
                              href={`tel:${person.phone}`} 
                              className="hover:text-cyan-600 hover:underline truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {person.phone}
                            </a>
                          </div>
                          <div className="flex items-center text-sm text-slate-600">
                            <FiTruck className="mr-2 flex-shrink-0 text-slate-400" />
                            <span className="truncate">{person.vehicleNumber}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.icon && <span className="mr-1">{status.icon}</span>}
                        {person.status.charAt(0).toUpperCase() + person.status.slice(1)}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${person.phone}`;
                          }}
                        >
                          <FiPhoneCall className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 rounded-full bg-cyan-100 text-cyan-600 hover:bg-cyan-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(person);
                          }}
                        >
                          <FiMessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {isMessagingOpen && selectedRecipient && (
        <MessagingModal
          isOpen={isMessagingOpen}
          onClose={handleCloseMessaging}
          recipient={selectedRecipient}
          onBack={() => setIsMessagingOpen(false)}
          socket={socket}
          user={user}
        />
      )}
    </div>
  );
};

export default MessageOptionsModal;