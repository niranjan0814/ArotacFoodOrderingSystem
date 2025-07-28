import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import { FaEdit, FaSave, FaTimes, FaCamera } from "react-icons/fa";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Profile.css';

const Profile = () => {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    address: "",
    telephone: "",
    profilePhoto: "",
  });
  const [editProfile, setEditProfile] = useState({ ...profile });
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordFields, setPasswordFields] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");
        
        if (!userId || !token) {
          throw new Error("User not authenticated");
        }

        const response = await fetch(`http://localhost:5000/api/user/${userId}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await response.json();
        
        const profileData = {
          fullName: userData.userData.name || "",
          email: userData.userData.email || "",
          address: userData.userData.address || "",
          telephone: userData.userData.phoneNumber || "",
          profilePhoto: userData.userData.profilePhoto || "",
        };

        setProfile(profileData);
        setEditProfile(profileData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setEditProfile({ ...profile });
    setErrors({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditProfile({ ...profile });
    setErrors({});
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!editProfile.fullName.trim()) newErrors.fullName = "Full name is required.";
    if (!editProfile.address.trim()) newErrors.address = "Address is required.";
    if (!editProfile.telephone.trim()) {
      newErrors.telephone = "Telephone is required.";
    } else if (!/^\d+$/.test(editProfile.telephone)) {
      newErrors.telephone = "Telephone must be numeric.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsUploading(true);
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      
      const formData = new FormData();
      formData.append("name", editProfile.fullName.trim());
      formData.append("address", editProfile.address.trim());
      formData.append("phoneNumber", editProfile.telephone.trim());
      
      if (editProfile.avatarFile) {
        formData.append("profilePhoto", editProfile.avatarFile);
      }

      const response = await fetch(`http://localhost:5000/api/user/${userId}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const { user } = await response.json();
      
      setProfile({
        fullName: user.name,
        email: user.email,
        address: user.address,
        telephone: user.phoneNumber,
        profilePhoto: user.profilePhoto || "",
      });
      
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, GIF)");
      return;
    }

    if (file.size > maxSize) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setEditProfile(prev => ({
        ...prev,
        profilePhoto: event.target.result,
        avatarFile: file,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordFields((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!passwordFields.oldPassword.trim()) {
      newErrors.oldPassword = "Old password is required";
    }
    
    if (!passwordFields.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (passwordFields.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }
    
    if (passwordFields.newPassword !== passwordFields.confirmNewPassword) {
      newErrors.confirmNewPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors);
      return;
    }

    try {
      setIsUploading(true);
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5000/api/user/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          oldPassword: passwordFields.oldPassword,
          newPassword: passwordFields.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to change password");
      }

      setPasswordFields({ 
        oldPassword: "", 
        newPassword: "", 
        confirmNewPassword: "" 
      });
      
      setPasswordErrors({});
      toast.success("Password changed successfully!");
    } catch (err) {
      console.error("Password change error:", err);
      toast.error(err.message || "Failed to change password");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading profile...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="error-container">
          <p>Error: {error}</p>
          <Link to="/login" className="error-link">
            Please login to view your profile
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="profile-page">
        <div className="profile-container">
          <section className="profile-section">
            <header className="profile-header">
              <h2>My Profile</h2>
              {!isEditing ? (
                <button 
                  onClick={handleEdit} 
                  className="btn-edit"
                  disabled={isUploading}
                >
                  <FaEdit /> Edit Profile
                </button>
              ) : (
                <div className="profile-action-buttons">
                  <button
                    onClick={handleCancel}
                    className="btn-cancel"
                    disabled={isUploading}
                  >
                    <FaTimes /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-save"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <span className="spinner"></span>
                    ) : (
                      <>
                        <FaSave /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </header>

            <div className="profile-body">
              <div className="avatar-block">
                <div className="avatar-container">
                  <img
                    src={isEditing ? editProfile.profilePhoto : (profile.profilePhoto || "https://via.placeholder.com/150")}
                    alt="Avatar"
                    className="avatar-image"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/150";
                    }}
                  />
                  {isEditing && (
                    <>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="avatar-input"
                        disabled={isUploading}
                        style={{ display: 'none' }}
                      />
                      <label 
                        htmlFor="avatar-upload" 
                        className="avatar-edit-overlay"
                      >
                        <FaCamera className="camera-icon" />
                        <span>Change Photo</span>
                      </label>
                    </>
                  )}
                </div>
              </div>

              <div className="fields-block">
                <div className="form-group">
                  <label>Full Name</label>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={editProfile.fullName}
                        onChange={(e) =>
                          setEditProfile({ ...editProfile, fullName: e.target.value })
                        }
                        className={`input-field ${errors.fullName ? 'error' : ''}`}
                        disabled={isUploading}
                      />
                      {errors.fullName && <p className="error-text">{errors.fullName}</p>}
                    </>
                  ) : (
                    <p className="field-text">{profile.fullName}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <p className="field-text">{profile.email}</p>
                </div>

                <div className="form-group">
                  <label>Address</label>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={editProfile.address}
                        onChange={(e) =>
                          setEditProfile({ ...editProfile, address: e.target.value })
                        }
                        className={`input-field ${errors.address ? 'error' : ''}`}
                        disabled={isUploading}
                      />
                      {errors.address && <p className="error-text">{errors.address}</p>}
                    </>
                  ) : (
                    <p className="field-text">{profile.address}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={editProfile.telephone}
                        onChange={(e) =>
                          setEditProfile({ ...editProfile, telephone: e.target.value })
                        }
                        className={`input-field ${errors.telephone ? 'error' : ''}`}
                        disabled={isUploading}
                      />
                      {errors.telephone && <p className="error-text">{errors.telephone}</p>}
                    </>
                  ) : (
                    <p className="field-text">{profile.telephone}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="password-section">
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordSubmit} className="password-form">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={passwordFields.oldPassword}
                  onChange={handlePasswordChange}
                  className={`input-field ${passwordErrors.oldPassword ? 'error' : ''}`}
                  disabled={isUploading}
                />
                {passwordErrors.oldPassword && (
                  <p className="error-text">{passwordErrors.oldPassword}</p>
                )}
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordFields.newPassword}
                  onChange={handlePasswordChange}
                  className={`input-field ${passwordErrors.newPassword ? 'error' : ''}`}
                  disabled={isUploading}
                />
                {passwordErrors.newPassword && (
                  <p className="error-text">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmNewPassword"
                  value={passwordFields.confirmNewPassword}
                  onChange={handlePasswordChange}
                  className={`input-field ${passwordErrors.confirmNewPassword ? 'error' : ''}`}
                  disabled={isUploading}
                />
                {passwordErrors.confirmNewPassword && (
                  <p className="error-text">{passwordErrors.confirmNewPassword}</p>
                )}
              </div>

              <button
                type="submit"
                className="btn-update"
                disabled={isUploading}
              >
                {isUploading ? (
                  <span className="spinner"></span>
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
};

export default Profile;