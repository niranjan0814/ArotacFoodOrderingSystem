import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Orders from "./pages/Orders.jsx";
import DeliverOrder from "./pages/DeliverOrder.jsx";
import Activity from "./pages/Activity.jsx";
import Account from "./pages/Account.jsx";
import Navbar from "./components/Navbar.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ForgotPassword from "./pages/ForgotPassword.jsx";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const syncLoginStatus = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };

    // On login/logout across tabs
    window.addEventListener("storage", syncLoginStatus);

    // On manual dispatch (e.g., from Login page)
    window.addEventListener("force-login-update", syncLoginStatus);

    return () => {
      window.removeEventListener("storage", syncLoginStatus);
      window.removeEventListener("force-login-update", syncLoginStatus);
    };
  }, []);

  const PrivateRoute = ({ children }) => {
    return isLoggedIn ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword/>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/orders/:deliveryPersonId" element={<PrivateRoute><Orders /></PrivateRoute>} />
            <Route path="/delivery/orders/:orderId/track" element={<PrivateRoute><DeliverOrder /></PrivateRoute>} />
            <Route path="/activity" element={<PrivateRoute><Activity /></PrivateRoute>} />
            <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
          </Routes>
        </div>

        {isLoggedIn && <Navbar />}
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Router>
  );
}

export default App;