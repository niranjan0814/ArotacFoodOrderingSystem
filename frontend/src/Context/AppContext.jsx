import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  // Configure axios
  axios.defaults.baseURL = "http://localhost:5000";

  // Add interceptor to include token in every request
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAuthState = async () => {
    try {
      const { data } = await axios.get("/api/authHome/is-auth");
      console.log('IsAuth Response:', data);
      if (data.success) {
        setIsLoggedIn(true);
        setUserData(data.user); // Updated to use data.user from isAuthenticated
      }
    } catch (error) {
      console.error("Auth check failed:", error.response?.data || error.message);
      setIsLoggedIn(false);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const getUserData = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        throw new Error("No user ID found");
      }
      const { data } = await axios.get(`/api/user/${userId}`);
      console.log('UserData Response:', data);
      if (data.success) {
        setUserData(data.userData);
      } else {
        toast.error(data.message);
        setUserData(null);
      }
    } catch (error) {
      console.error("Failed to get user data:", error.response?.data || error.message);
      setUserData(null);
    }
  };

  const updateUserData = async (payload) => {
    try {
      const { data } = await axios.put("/api/authHome/update-user", payload);
      if (data.success) {
        await getUserData();
        toast.success(data.message);
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
      return false;
    }
  };

  const changePassword = async (payload) => {
    try {
      const { data } = await axios.post("/api/authHome/change-password", payload);
      if (data.success) {
        toast.success(data.message);
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Password change failed");
      return false;
    }
  };

  const logout = async () => {
    try {
      await axios.post("/api/authHome/logout");
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      setIsLoggedIn(false);
      setUserData(null);
    } catch (error) {
      console.error("Logout failed:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    getAuthState();
  }, []);

  const value = {
    isLoggedIn,
    setIsLoggedIn,
    userData,
    loading,
    getUserData,
    updateUserData,
    changePassword,
    logout,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};