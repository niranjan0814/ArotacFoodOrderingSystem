import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    setUser(userData);
    setActiveTab(location.pathname);
  }, [location.pathname]);

  const isActive = (path) => {
    return activeTab.startsWith(path) 
      ? "text-white bg-gradient-to-br from-orange-500 to-amber-500 shadow-md" 
      : "text-gray-600 hover:text-orange-600";
  };

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t border-gray-100 z-50 backdrop-blur-sm bg-opacity-90 h-16">
      <div className="max-w-4xl mx-auto px-6 py-1 flex justify-between items-center h-full">
        <Link 
          to="/dashboard" 
          className={`flex flex-col items-center px-4 py-3 rounded-xl transition-all duration-300 ${isActive("/dashboard")} h-full justify-center relative`}
        >
          <div className={`p-1.5 rounded-lg ${activeTab.startsWith("/dashboard") ? "bg-white/20" : "bg-orange-50"} z-10`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <span className="text-xs font-medium mt-1 z-10">Dashboard</span>
        </Link>

        <Link 
          to={`/orders/${user._id}`}
          className={`flex flex-col items-center px-4 py-3 rounded-xl transition-all duration-300 ${isActive("/orders")} h-full justify-center relative`}
        >
          <div className={`p-1.5 rounded-lg ${activeTab.startsWith("/orders") ? "bg-white/20" : "bg-orange-50"} z-10`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="text-xs font-medium mt-1 z-10">Orders</span>
        </Link>

        <Link 
          to="/activity" 
          className={`flex flex-col items-center px-4 py-3 rounded-xl transition-all duration-300 ${isActive("/activity")} h-full justify-center relative`}
        >
          <div className={`p-1.5 rounded-lg ${activeTab.startsWith("/activity") ? "bg-white/20" : "bg-orange-50"} z-10`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-xs font-medium mt-1 z-10">Activity</span>
        </Link>

        <Link 
          to="/account" 
          className={`flex flex-col items-center px-4 py-3 rounded-xl transition-all duration-300 ${isActive("/account")} h-full justify-center relative`}
        >
          <div className={`p-1.5 rounded-lg ${activeTab.startsWith("/account") ? "bg-white/20" : "bg-orange-50"} z-10`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-xs font-medium mt-1 z-10">Account</span>
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;