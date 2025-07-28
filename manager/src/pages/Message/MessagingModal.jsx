import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import axios from "axios";

const API_URL = "http://localhost:5000/api/messages";

const MessagingModal = ({ isOpen, onClose, recipient = {}, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const pollingRef = useRef(null);
  
  const recipientType = "deliveryPerson";
  const managerId = "67ea2f9c419fbe0545017f0f";
  const senderType = "manager";

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const threshold = 100;
      setIsNearBottom(scrollHeight - (scrollTop + clientHeight) < threshold);
    }
  };

  const fetchMessages = async () => {
    const deliveryPersonId = recipient._id || recipient.id || "";
    
    console.log("Fetching messages - Raw Props:", { managerId, deliveryPerson: recipient });
    console.log("Fetching messages - Extracted IDs:", { managerId, deliveryPersonId });

    if (!isOpen || !deliveryPersonId) {
      console.log("Fetch aborted: Missing deliveryPersonId. Ensure recipient prop is passed.");
      console.log("Current state:", { isOpen, managerId, deliveryPersonId });
      return;
    }

    try {
      console.log("Sending fetch request to:", `${API_URL}/conversation`, { 
        params: { 
          managerId, 
          deliveryPersonId 
        } 
      });
      const response = await axios.get(`${API_URL}/conversation`, {
        params: {
          managerId,
          deliveryPersonId,
        },
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      console.log("Fetch response received:", response.data);
      const fetchedMessages = response.data
        .map(msg => ({ ...msg, timestamp: new Date(msg.timestamp) }))
        .sort((a, b) => a.timestamp - b.timestamp);

      console.log("Fetched messages breakdown:", fetchedMessages.map(msg => ({
        _id: msg._id,
        senderId: msg.senderId,
        recipientId: msg.recipientId,
        content: msg.content,
        senderType: msg.senderType,
        recipientType: msg.recipientType,
      })));

      setMessages(prev => {
        const merged = [...prev, ...fetchedMessages]
          .filter((msg, idx, self) => idx === self.findIndex(m => m._id === msg._id))
          .sort((a, b) => a.timestamp - b.timestamp);
        return JSON.stringify(prev) !== JSON.stringify(merged) ? merged : prev;
      });

      const unread = fetchedMessages.filter(msg => msg.recipientId === managerId && !msg.read).length;
      if (unread > 0) {
        console.log("Marking unread messages as read for managerId:", managerId);
        await axios.post(`${API_URL}/mark-read`, {
          userId: managerId,
          senderId: deliveryPersonId,
          recipientType: "manager"  // Correct recipientType for marking messages as read
        }, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token") || ""}` }
        });
        setUnreadCount(0);
      } else {
        setUnreadCount(unread);
      }

      if (isNearBottom && messagesContainerRef.current) {
        requestAnimationFrame(() => {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        });
      }
    } catch (error) {
      console.error("Fetch error details:", {
        message: error.message,
        response: error.response?.data || "No response data",
        status: error.response?.status,
      });
      toast.error(`Failed to load messages: ${error.response?.data?.error || error.message || "Server error"}`);
    }
  };

  useEffect(() => {
    if (isOpen) {
      console.log("Modal opened - Initial props:", { managerId, deliveryPerson: recipient });
      fetchMessages();
      pollingRef.current = setInterval(fetchMessages, 3000);
      return () => clearInterval(pollingRef.current);
    }
  }, [isOpen, recipient._id, recipient.id, isNearBottom]);

  const handleSendMessage = async () => {
    const deliveryPersonId = recipient._id || recipient.id || "";
    
    console.log("Sending message - Raw Props:", { managerId, deliveryPerson: recipient });
    console.log("Sending message - Extracted IDs:", { managerId, deliveryPersonId });

    if (!newMessage.trim() || isSending || !deliveryPersonId) {
      console.log("Send aborted: Invalid input or state", { newMessage, isSending, managerId, deliveryPersonId });
      return;
    }

    setIsSending(true);
    const message = {
      senderId: managerId,
      senderName: "Manager",
      senderType,
      recipientId: deliveryPersonId,
      content: newMessage,
      recipientType,
      read: false
    };

    try {
      console.log("Sending message request to:", `${API_URL}/send`, { message });
      const response = await axios.post(`${API_URL}/send`, message, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token") || ""}` }
      });

      console.log("Send response received:", response.data);
      setMessages(prev => [...prev, {
        ...response.data,
        timestamp: new Date(response.data.timestamp)
      }].sort((a, b) => a.timestamp - b.timestamp));

      setNewMessage("");
      requestAnimationFrame(() => {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      });
    } catch (error) {
      console.error("Send error details:", {
        message: error.message,
        response: error.response?.data || "No response data",
        status: error.response?.status,
      });
      toast.error(`Failed to send message: ${error.response?.data?.error || error.message || "Server error"}`);
    } finally {
      setIsSending(false);
    }
  };

  const groupMessagesByDate = (messages) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    return messages.reduce((groups, msg) => {
      const msgDate = new Date(msg.timestamp);
      let label;

      if (msgDate.toDateString() === today.toDateString()) {
        label = "Today";
      } else if (msgDate.toDateString() === yesterday.toDateString()) {
        label = "Yesterday";
      } else {
        label = msgDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(msg);
      return groups;
    }, {});
  };

  const renderMessages = () => {
    const grouped = groupMessagesByDate(messages);
    const dates = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));

    return dates.map(date => (
      <div key={date} className="mb-4">
        <h3 className="text-center text-sm text-gray-500 py-1 bg-gray-100 rounded">
          {date}
        </h3>
        {grouped[date].map((msg, index) => (
          <div 
            key={msg._id || index} 
            className={`px-2 py-1 ${msg.senderId === managerId ? "text-right" : "text-left"}`}
          >
            <div 
              className={`inline-block p-3 rounded-lg max-w-xs ${
                msg.senderId === managerId 
                  ? "bg-blue-500 text-white rounded-br-none" 
                  : "bg-gray-200 text-gray-800 rounded-bl-none"
              }`}
            >
              {msg.senderId !== managerId && (
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  {msg.senderName}
                </p>
              )}
              <p>{msg.content}</p>
              <p className={`text-xs mt-1 ${
                msg.senderId === managerId ? "text-blue-100" : "text-gray-500"
              }`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-4 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {onBack && (
                <button style={{
                  width: '25%',
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
                  onClick={onClose} 
                  className="text-white/90 hover:text-white p-1 rounded-full hover:bg-white/10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h2 className="text-lg font-semibold">
                Chat with {recipient.name || "Delivery Person"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/90 hover:text-white p-1 rounded-full hover:bg-white/10"
              style={{
                  width: '20%',
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
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div
          className="h-64 overflow-y-auto p-4 bg-gray-50"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700">No messages yet</h3>
              <p className="text-gray-500 mt-1">Start the conversation</p>
            </div>
          ) : (
            renderMessages()
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 p-3 bg-white">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                setIsNearBottom(true);
              }}
              className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
              </svg>
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              disabled={isSending || !newMessage.trim()}
              className={`p-3 rounded-full ${
                isSending || !newMessage.trim()
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {isSending ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagingModal;