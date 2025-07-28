import React from "react";
import "./ConfirmationPopup.css"; 

function ConfirmationPopup({ message, onConfirm, onCancel }) {
  return (
    <div className="confirmation-popup-overlay">
      <div className="confirmation-popup-content">
        <p>{message}</p>
        <div className="confirmation-popup-buttons">
          <button onClick={onConfirm} className="confirm-button">
            Yes, Sure
          </button>
          <button onClick={onCancel} className="cancel-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationPopup;