import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API_URL = "http://192.168.8.156:5000/api/messages";

const MessagingModal = ({
  isOpen,
  onClose,
  user = {},
  recipientType,
  onBack,
  onUnreadCountChange,
}) => {
  // State management
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const pollingRef = useRef(null);

  // Scroll position handler
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const threshold = 100;
      setIsNearBottom(scrollHeight - (scrollTop + clientHeight) < threshold);
    }
  };

  // Fetch messages with scroll preservation
  const fetchMessages = async () => {
    if (!isOpen || !user._id) return;

    const managerId = "67ea2f9c419fbe0545017f0f"; // Hardcoded manager ID
    const deliveryPersonId = user._id; // Delivery person's ID from user object

    try {
      const response = await axios.get(`${API_URL}/conversation`, {
        params: { managerId, deliveryPersonId },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      const fetchedMessages = response.data
        .map((msg) => ({ ...msg, timestamp: new Date(msg.timestamp) }))
        .sort((a, b) => a.timestamp - b.timestamp);

      setMessages((prev) => {
        const merged = [...prev, ...fetchedMessages]
          .filter(
            (msg, idx, self) => idx === self.findIndex((m) => m._id === msg._id)
          )
          .sort((a, b) => a.timestamp - b.timestamp);
        return JSON.stringify(prev) !== JSON.stringify(merged) ? merged : prev;
      });

      // Auto-scroll logic
      if (isNearBottom && messagesContainerRef.current) {
        requestAnimationFrame(() => {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        });
      }

      // Unread messages handling
      const unread = fetchedMessages.filter(
        (msg) => msg.recipientId === deliveryPersonId && !msg.read
      ).length;
      if (unread > 0) {
        await axios.post(
          `${API_URL}/mark-read`,
          {
            userId: deliveryPersonId,
            senderId: managerId,
            recipientType: "deliveryPerson",
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }
        );
        setUnreadCount(0);
        onUnreadCountChange?.(0);
      } else {
        setUnreadCount(unread);
        onUnreadCountChange?.(unread);
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.error || error.message || "Network error";
      toast.error(`Failed to load messages: ${errorMsg}`);
    }
  };

  // Polling effect
  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      pollingRef.current = setInterval(fetchMessages, 3000);
      return () => clearInterval(pollingRef.current);
    }
  }, [isOpen, user._id, isNearBottom]);

  // Message sending
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending || !user._id) return;

    setIsSending(true);
    const managerId = "67ea2f9c419fbe0545017f0f"; // Hardcoded manager ID
    const deliveryPersonId = user._id; // Delivery person's ID

    try {
      const response = await axios.post(
        `${API_URL}/send`,
        {
          senderId: deliveryPersonId,
          senderName: user.name || "Delivery Person",
          senderType: "deliveryPerson",
          recipientId: managerId,
          content: newMessage,
          recipientType: "manager",
          read: false,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      setMessages((prev) =>
        [
          ...prev,
          {
            ...response.data,
            timestamp: new Date(response.data.timestamp),
          },
        ].sort((a, b) => a.timestamp - b.timestamp)
      );

      setNewMessage("");
      requestAnimationFrame(() => {
        messagesContainerRef.current.scrollTop =
          messagesContainerRef.current.scrollHeight;
      });
    } catch (error) {
      toast.error(
        `Failed to send message: ${
          error.response?.data?.error || error.message
        }`
      );
    } finally {
      setIsSending(false);
    }
  };

  // Group messages by date
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
        label = msgDate.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(msg);
      return groups;
    }, {});
  };

  // Render grouped messages
  const renderMessages = () => {
    const grouped = groupMessagesByDate(messages);
    const dates = Object.keys(grouped).sort((a, b) => {
      if (a === "Today") return 1;
      if (b === "Today") return -1;
      if (a === "Yesterday") return 1;
      if (b === "Yesterday") return -1;
      return (
        new Date(b.split("/").reverse().join("-")) -
        new Date(a.split("/").reverse().join("-"))
      );
    });

    return dates.map((date) => (
      <div key={date}>
        <div className="text-center my-2">
          <span className="inline-block bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
            {date}
          </span>
        </div>
        {grouped[date].map((msg) => (
          <div
            key={msg._id}
            className={`mb-4 ${msg.senderId === user._id ? "pl-10" : "pr-10"}`}
          >
            <div
              className={`flex ${
                msg.senderId === user._id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs rounded-2xl px-4 py-2 ${
                  msg.senderId === user._id
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
              >
                {msg.senderId !== user._id && (
                  <p className="text-xs font-semibold text-amber-600 mb-1">
                    {msg.senderName}
                  </p>
                )}
                <p className="text-sm">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.senderId === user._id
                      ? "text-amber-100"
                      : "text-gray-500"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="text-white/90 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-white">
                {recipientType === "manager"
                  ? "Manager Chat"
                  : "Customer Support"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/90 hover:text-white p-1 rounded-full hover:bg-white/10"
            >
              <svg
                className="w-6 h-6"
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
          <div className="mt-2 flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-green-300 animate-pulse" />
            <p className="text-xs text-white/80 font-medium">Active now</p>
          </div>
        </div>

        <div
          className="h-80 overflow-y-auto p-4 bg-gradient-to-b from-white to-gray-50"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700">
                No messages yet
              </h3>
              <p className="text-gray-500 mt-1 max-w-xs">
                Start the conversation by sending your first message
              </p>
            </div>
          ) : (
            renderMessages()
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                messagesContainerRef.current.scrollTop =
                  messagesContainerRef.current.scrollHeight;
                setIsNearBottom(true);
              }}
              className="p-2 text-gray-500 hover:text-amber-600 rounded-full hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M19 13l-7 7-7-7m14-8l-7 7-7-7"
                />
              </svg>
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 p-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 placeholder-gray-400"
            />
            <button
              onClick={handleSendMessage}
              disabled={isSending || !newMessage.trim()}
              className={`p-3 rounded-full ${
                isSending || !newMessage.trim()
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700"
              }`}
            >
              {isSending ? (
                <svg
                  className="w-5 h-5 animate-spin"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
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
