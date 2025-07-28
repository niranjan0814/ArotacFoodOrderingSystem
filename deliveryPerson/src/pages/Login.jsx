import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { toast } from "react-toastify";
import { FiTruck, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/delivery-persons/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      window.dispatchEvent(new Event("force-login-update"));

      toast.success("Login successful!");
      setTimeout(() => navigate("/dashboard"), 300);

    } catch (error) {
      const errorMessage = error.response?.data?.error || "Login failed";
      toast.error(errorMessage);
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF6EC] to-[#FFEFD9] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header with bubbly elements */}
        <div className="bg-[#FF8C00] p-8 text-white text-center relative overflow-hidden">
          {/* Bubbles */}
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-[#FFA726] rounded-full opacity-20"></div>
          <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-[#FFB74D] rounded-full opacity-15"></div>
          
          <FiTruck className="mx-auto text-4xl mb-4" />
          <h1 className="text-2xl font-bold">Your Delivery Hub</h1>
          <p className="text-orange-100 mt-2">Track & Succeed with Ease</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#1F1F1F] mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-[#666666]" />
                </div>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-3 border border-[#F0E6D2] rounded-xl focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1F1F1F] mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-[#666666]" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-3 border border-[#F0E6D2] rounded-xl focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#666666] hover:text-[#1F1F1F]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEye /> : <FiEyeOff />} {/* Corrected icon logic */}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-[#FF8C00] hover:text-[#E67F00] hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl shadow-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8C00] transition ${loading ? 'bg-[#FFA726]' : 'bg-[#FF8C00] hover:bg-[#E67F00]'}`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;