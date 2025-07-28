import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Feedback.css";

const Feedback = ({ foodId, onClose }) => {
  const [foodItem, setFoodItem] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [newFeedback, setNewFeedback] = useState({ rating: 5, comment: "", name: "" });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("feedback");
  const [nameError, setNameError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFoodDetailsAndFeedback = async () => {
      try {
        const [foodResponse, feedbackResponse] = await Promise.all([
          fetch(`http://localhost:5000/api/menu/${foodId}`),
          fetch(`http://localhost:5000/api/feedback/${foodId}`)
        ]);

        if (!foodResponse.ok) throw new Error("Failed to fetch food item details");
        if (!feedbackResponse.ok) throw new Error("Failed to fetch feedback");

        const [foodData, feedbackData] = await Promise.all([
          foodResponse.json(),
          feedbackResponse.json()
        ]);

        setFoodItem(foodData);
        setFeedbacks(Array.isArray(feedbackData) ? feedbackData : []);
      } catch (err) {
        console.error("Error in Feedback.jsx:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFoodDetailsAndFeedback();
  }, [foodId]);

  const validateName = (name) => {
    const regex = /^[a-zA-Z\s]*$/;
    if (!regex.test(name)) {
      setNameError("Name should only contain letters and spaces");
      return false;
    }
    setNameError("");
    return true;
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    
    // Validate name before submission
    if (!validateName(newFeedback.name)) {
      return;
    }

    // Check if feedback already has 5 images
    const feedbackWithImages = feedbacks.filter(fb => fb.imageUrl).length;
    if (feedbackWithImages >= 5 && image) {
      setToast({ message: "Maximum of 5 images already uploaded for this food item", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const formData = new FormData();
    formData.append("foodId", foodId);
    formData.append("rating", newFeedback.rating);
    formData.append("comment", newFeedback.comment);
    formData.append("name", newFeedback.name);
    if (image) formData.append("image", image);

    try {
      const response = await fetch(`http://localhost:5000/api/feedback`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }
      const updatedFeedback = await response.json();
      setFeedbacks((prev) => [...prev, updatedFeedback]);
      setNewFeedback({ rating: 5, comment: "", name: "" });
      setImage(null);
      setImagePreview(null);
      setToast({ message: "Feedback submitted successfully!", type: "success" });
      setTimeout(() => setToast(null), 3000);
      setActiveTab("feedback");
    } catch (err) {
      setToast({ message: err.message, type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleStarClick = (rating) => {
    setNewFeedback({ ...newFeedback, rating });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setToast({ message: "Only JPG, PNG, GIF, or WEBP images are allowed", type: "error" });
        setTimeout(() => setToast(null), 3000);
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: "Image size should be less than 5MB", type: "error" });
        setTimeout(() => setToast(null), 3000);
        return;
      }

      // Check if feedback already has 5 images
      const feedbackWithImages = feedbacks.filter(fb => fb.imageUrl).length;
      if (feedbackWithImages >= 5) {
        setToast({ message: "Maximum of 5 images already uploaded for this food item", type: "error" });
        setTimeout(() => setToast(null), 3000);
        return;
      }

      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="feedback-overlay">
        <div className="feedback-popup loading">
          <div className="spinner"></div>
          <p>Loading feedback...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feedback-overlay">
        <div className="feedback-popup error">
          <button className="close-button" onClick={onClose}>
            ×
          </button>
          <div className="error-message">
            <svg viewBox="0 0 24 24" className="error-icon">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <h3>Error Loading Feedback</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-overlay">
      <div className="feedback-popup">
        <button className="close-button" onClick={onClose}>
          <svg viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        {foodItem && (
          <>
            <div className="food-header">
              <div className="food-image-container">
                <img src={foodItem.imageUrl} alt={foodItem.name} className="food-image" />
              </div>
              <div className="food-info">
                <h2>{foodItem.name}</h2>
                <p className="food-price">Rs. {foodItem.price.toFixed(2)}</p>
                <p className="food-description">{foodItem.description}</p>
              </div>
            </div>

            <div className="feedback-tabs">
              <button
                className={`tab-button ${activeTab === "feedback" ? "active" : ""}`}
                onClick={() => setActiveTab("feedback")}
              >
                Customer Reviews
                <span className="badge">{feedbacks.length}</span>
              </button>
              <button
                className={`tab-button ${activeTab === "form" ? "active" : ""}`}
                onClick={() => setActiveTab("form")}
              >
                Write a Review
              </button>
            </div>

            <div className="tab-content">
              {activeTab === "feedback" ? (
                <div className="feedback-section">
                  {feedbacks.length > 0 ? (
                    <div className="feedback-list">
                      {feedbacks.map((feedback) => (
                        <div key={feedback?._id || Math.random()} className="feedback-card">
                          <div className="feedback-header">
                            <div className="user-info">
                              <div className="user-avatar">
                                {feedback?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <p className="user-name">{feedback?.name || 'Anonymous'}</p>
                                <div className="feedback-rating">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i} className={i < (feedback?.rating || 0) ? "filled" : ""}>
                                      ★
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="feedback-date">
                              {feedback?.createdAt ? formatDate(feedback.createdAt) : 'Unknown date'}
                            </span>
                          </div>
                          <p className="feedback-comment">{feedback?.comment || 'No comment provided'}</p>
                          {feedback?.imageUrl && (
                            <div className="feedback-image-container">
                              <img
                                src={feedback.imageUrl}
                                alt="Feedback"
                                className="feedback-image"
                              />
                            </div>
                          )}
                          {feedback?.reply && (
                            <div className="admin-reply">
                              <div className="reply-header">
                                <svg viewBox="0 0 24 24" className="reply-icon">
                                  <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
                                </svg>
                                <span>Restaurant Response</span>
                              </div>
                              <p>{feedback.reply}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <svg viewBox="0 0 24 24" className="empty-icon">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z" />
                      </svg>
                      <h3>No Reviews Yet</h3>
                      <p>Be the first to share your thoughts about this dish!</p>
                      <button
                        className="primary-button"
                        onClick={() => setActiveTab("form")}
                      >
                        Write a Review
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="feedback-form-container">
                  <h3>Share Your Experience</h3>
                  <form onSubmit={handleSubmitFeedback} className="feedback-form">
                    <div className="form-group">
                      <label htmlFor="name">Your Name</label>
                      <input
                        id="name"
                        type="text"
                        value={newFeedback.name}
                        onChange={(e) => {
                          setNewFeedback({ ...newFeedback, name: e.target.value });
                          validateName(e.target.value);
                        }}
                        placeholder="Enter your name"
                        required
                      />
                      {nameError && <div className="error-message">{nameError}</div>}
                    </div>

                    <div className="form-group">
                      <label>Your Rating</label>
                      <div className="star-rating">
                        {[5, 4, 3, 2, 1].map((star) => (
                          <React.Fragment key={star}>
                            <input
                              type="radio"
                              id={`star-${star}`}
                              name="rating"
                              value={star}
                              checked={newFeedback.rating === star}
                              onChange={() => handleStarClick(star)}
                            />
                            <label htmlFor={`star-${star}`}>
                              <svg viewBox="0 0 24 24" className="star-svg">
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                              </svg>
                            </label>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="comment">Your Review</label>
                      <textarea
                        id="comment"
                        value={newFeedback.comment}
                        onChange={(e) =>
                          setNewFeedback({ ...newFeedback, comment: e.target.value })
                        }
                        placeholder="Share details of your experience..."
                        rows="4"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="image">Add Photo (Optional)</label>
                      <div className="image-upload">
                        <label htmlFor="image" className="upload-label">
                          {imagePreview ? (
                            <div className="image-preview">
                              <img src={imagePreview} alt="Preview" />
                              <button
                                type="button"
                                className="remove-image"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setImage(null);
                                  setImagePreview(null);
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div className="upload-placeholder">
                              <svg viewBox="0 0 24 24" className="upload-icon">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                              </svg>
                              <span>Add Photo</span>
                              <div className="image-limit">
                                {feedbacks.filter(fb => fb.imageUrl).length}/5 images uploaded
                              </div>
                            </div>
                          )}
                        </label>
                        <input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden-input"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="submit-button"
                      disabled={!!nameError}
                    >
                      Submit Review
                    </button>
                  </form>
                </div>
              )}
            </div>
          </>
        )}

        {toast && (
          <div className={`toast ${toast.type}`}>
            <svg viewBox="0 0 24 24" className="toast-icon">
              {toast.type === "success" ? (
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              ) : (
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              )}
            </svg>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feedback;