import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.protocol === "https:"
    ? "https://localhost:3001"
    : "http://192.168.8.156:5000");
const POLLING_INTERVAL = 30000; // seconds

function Account() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    profilePicture: "",
    status: "offline",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showPopup, setShowPopup] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchUserData = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (!userData || !userData._id)
        throw new Error("No user data found, please log in.");
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found, please log in.");

      const response = await axios.get(
        `${API_BASE_URL}/api/delivery-persons/${userData._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUserData = response.data || userData;
      setUser(updatedUserData);
      setFormData({
        name: updatedUserData.name || "",
        email: updatedUserData.email || "",
        profilePicture: updatedUserData.profilePicture || "",
        status: updatedUserData.status || "offline",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.message ||
          "Failed to load account data",
      });
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const uploadProfilePicture = async (file) => {
    if (!file) return formData.profilePicture;

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", import.meta.env.VITE_CLOUDINARY_PRESET);
    data.append("cloud_name", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/image/upload`,
        data
      );
      const originalUrl = response.data.secure_url;
      const autoFormatUrl = originalUrl.replace(
        /\/upload\//,
        "/upload/f_auto/"
      );
      return autoFormatUrl;
    } catch (error) {
      throw new Error("Failed to upload image to Cloudinary");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");

      const profilePictureUrl = await uploadProfilePicture(file);

      const updateData = {
        ...formData,
        profilePicture: profilePictureUrl,
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/delivery-persons/${userData._id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUserData = { ...userData, ...response.data };
      localStorage.setItem("user", JSON.stringify(updatedUserData));
      setUser(updatedUserData);
      setFormData((prev) => ({ ...prev, profilePicture: profilePictureUrl }));
      setMessage({
        type: "success",
        text: "Profile picture updated successfully!",
      });
      setShowPopup(true);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.message ||
          "Failed to update profile picture",
      });
      setShowPopup(true);
    } finally {
      setIsUploading(false);
    }
  };

  const validateEmail = (email) => {
    const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const hasMinLength = email.length >= 5;
    const noInvalidChars =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

    if (!isValidFormat)
      return "Please enter a valid email address (e.g., user@domain.com).";
    if (!hasMinLength) return "Email must be at least 5 characters long.";
    if (!noInvalidChars)
      return "Email can only contain letters, numbers, and common special characters (._%+-).";
    return "";
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const emailError = validateEmail(formData.email);
    if (emailError) {
      setMessage({ type: "error", text: emailError });
      setShowPopup(true);
      return;
    }

    try {
      setIsUploading(true);
      const userData = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");

      const updateData = {
        name: formData.name,
        email: formData.email,
        status: formData.status,
        profilePicture: formData.profilePicture,
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/delivery-persons/${userData._id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUserData = { ...userData, ...response.data };
      localStorage.setItem("user", JSON.stringify(updatedUserData));
      setUser(updatedUserData);

      // Determine what changed
      const nameChanged = formData.name !== userData.name;
      const emailChanged = formData.email !== userData.email;
      let successMessage = "";
      if (nameChanged && emailChanged) {
        successMessage = "Name and Email updated successfully!";
      } else if (nameChanged) {
        successMessage = "Name updated successfully!";
      } else if (emailChanged) {
        successMessage = "Email updated successfully!";
      } else {
        successMessage = "No changes detected.";
      }

      setMessage({ type: "success", text: successMessage });
      setShowPopup(true);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.message ||
          "Failed to update profile",
      });
      setShowPopup(true);
    } finally {
      setIsUploading(false);
    }
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!minLength) return "Password must be at least 8 characters long.";
    if (!hasUpperCase)
      return "Password must contain at least one uppercase letter.";
    if (!hasLowerCase)
      return "Password must contain at least one lowercase letter.";
    if (!hasNumber) return "Password must contain at least one number.";
    if (!hasSpecialChar)
      return "Password must contain at least one special character (e.g., !@#$%).";
    return "";
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({
        type: "error",
        text: "New password and confirmation do not match.",
      });
      setShowPopup(true);
      return;
    }

    const passwordError = validatePassword(passwordData.newPassword);
    if (passwordError) {
      setMessage({ type: "error", text: passwordError });
      setShowPopup(true);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const userData = JSON.parse(localStorage.getItem("user"));

      await axios.post(
        `${API_BASE_URL}/api/delivery-persons/${userData._id}/changepassword`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage({ type: "success", text: "Password updated successfully!" });
      setShowPopup(true);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.message ||
          "Failed to update password",
      });
      setShowPopup(true);
    }
  };

  const handleStatusToggle = async () => {
    try {
      const currentStatus = formData.status;
      if (currentStatus === "busy" || currentStatus === "on_break") {
        setMessage({
          type: "error",
          text:
            currentStatus === "busy"
              ? "Cannot change status while busy with an order."
              : "End your break to change status.",
        });
        setShowPopup(true);
        return;
      }

      const newStatus = currentStatus === "available" ? "offline" : "available";
      const userData = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");

      const response = await axios.put(
        `${API_BASE_URL}/api/delivery-persons/${userData._id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUserData = { ...userData, status: newStatus };
      localStorage.setItem("user", JSON.stringify(updatedUserData));
      setUser(updatedUserData);
      setFormData((prev) => ({ ...prev, status: newStatus }));
      setMessage({ type: "success", text: `Status updated to ${newStatus}!` });
      setShowPopup(true);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.message ||
          "Failed to update status",
      });
      setShowPopup(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const closePopup = () => {
    setShowPopup(false);
    setMessage({ type: "", text: "" });
  };

  useEffect(() => {
    fetchUserData();

    // Set up polling
    const intervalId = setInterval(fetchUserData, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);

  if (loading) return <LoadingView />;
  if (!user) return <ErrorView error={message.text} onRetry={fetchUserData} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 pt-10 pb-20 px-4 md:px-8">
      {/* Notification Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={closePopup}
          />
          <div
            className={`relative z-10 w-full max-w-md p-6 rounded-2xl shadow-xl ${
              message.type === "success"
                ? "bg-gradient-to-br from-green-400 to-emerald-500"
                : "bg-gradient-to-br from-red-400 to-pink-500"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 p-2 rounded-full bg-white/20">
                {message.type === "success" ? (
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {message.type === "success" ? "Success!" : "Error"}
                </h3>
                <p className="text-white/90">{message.text}</p>
              </div>
              <button
                onClick={closePopup}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <svg
                  className="w-6 h-6 text-white"
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
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600">
            Delivery Person Account
          </h1>
          <p className="text-orange-600 mt-2">
            Manage your account and availability
          </p>
        </header>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-100">
          {/* Profile Section */}
          <section className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start mb-8">
              {/* Profile Picture */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-orange-200 shadow-md">
                  {formData.profilePicture ? (
                    <img
                      src={formData.profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-3xl font-bold">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-orange-500 text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-orange-600 transition-colors">
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
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*"
                    disabled={isUploading}
                  />
                </label>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-800">
                  {user.name}
                </h2>
                <p className="text-orange-600">{user.email}</p>

                {/* Status Indicator */}
                <div className="mt-3 flex items-center justify-center md:justify-start gap-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      formData.status === "available"
                        ? "bg-green-100 text-green-800"
                        : formData.status === "busy"
                        ? "bg-yellow-100 text-yellow-800"
                        : formData.status === "on_break"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mr-2 ${
                        formData.status === "available"
                          ? "bg-green-500"
                          : formData.status === "busy"
                          ? "bg-yellow-500"
                          : formData.status === "on_break"
                          ? "bg-blue-500"
                          : "bg-gray-500"
                      }`}
                    ></span>
                    {formData.status === "available"
                      ? "Available"
                      : formData.status === "busy"
                      ? "Busy"
                      : formData.status === "on_break"
                      ? "On Break"
                      : "Offline"}
                  </span>

                  <button
                    onClick={handleStatusToggle}
                    disabled={
                      formData.status === "busy" ||
                      formData.status === "on_break"
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.status === "available"
                        ? "bg-green-500"
                        : formData.status === "busy"
                        ? "bg-yellow-500 cursor-not-allowed"
                        : formData.status === "on_break"
                        ? "bg-blue-500 cursor-not-allowed"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.status === "available"
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                  isUploading
                    ? "bg-gray-400"
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
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
                    Updating...
                  </span>
                ) : (
                  "Update"
                )}
              </button>
            </form>
          </section>

          {/* Divider */}
          <div className="border-t border-orange-100"></div>

          {/* Password Section */}
          <section className="p-6 md:p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Change Password
            </h3>
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                Change Password
              </button>
            </form>
          </section>

          {/* Divider */}
          <div className="border-t border-orange-100"></div>

          {/* Vehicle Info Section */}
          <section className="p-6 md:p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Vehicle Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-orange-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-orange-800 mb-1">
                  Vehicle Type
                </label>
                <p className="text-gray-900 font-medium">
                  {user.vehicleType || "Not specified"}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-orange-800 mb-1">
                  Vehicle Number
                </label>
                <p className="text-gray-900 font-medium">
                  {user.vehicleNumber || "Not specified"}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-orange-800 mb-1">
                  Phone Number
                </label>
                <p className="text-gray-900 font-medium">
                  {user.phone || "Not specified"}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-orange-800 mb-1">
                  Capacity
                </label>
                <p className="text-gray-900 font-medium">
                  {user.vehicleCapacity
                    ? `${user.vehicleCapacity} kg`
                    : "Not specified"}
                </p>
              </div>
            </div>
          </section>

          {/* Logout Button */}
          <div className="p-6 md:p-8 border-t border-orange-100">
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
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
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const LoadingView = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50 pt-20">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-lg font-medium text-gray-700">
        Loading your profile...
      </p>
    </div>
  </div>
);

const ErrorView = ({ error, onRetry }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50 pt-20">
    <div className="max-w-md p-6 bg-white rounded-xl shadow-lg text-center">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
        <svg
          className="h-6 w-6 text-red-600"
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
      </div>
      <h3 className="mt-3 text-lg font-medium text-gray-900">
        Error loading profile
      </h3>
      <p className="mt-2 text-sm text-gray-500">{error}</p>
      <div className="mt-5">
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-orange-600 text-white rounded-md font-medium hover:bg-orange-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
);

export default Account;
