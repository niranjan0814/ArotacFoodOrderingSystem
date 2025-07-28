import React from "react";

const MessageOptionsModal = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        backgroundColor: "rgba(243, 244, 246, 0.8)", // Light gray tint
        backdropFilter: "blur(6px)", // Reduced blur
        WebkitBackdropFilter: "blur(6px)", // Reduced blur for Safari
      }}
    >
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-xs p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Select Recipient</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onSelect("manager")}
            className="w-full bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-all"
          >
            Contact with Manager
          </button>
          <button
            onClick={() => onSelect("customer")}
            className="w-full bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-all"
          >
            Contact with Customer
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageOptionsModal;