import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster.jsx";
import { TooltipProvider } from "@/components/ui/tooltip.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from './components/Navbar';
import MenuPage from './pages/MenuPage';
import FoodDetailsPage from './pages/FoodDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import Admin from './pages/AdminPanel';
import OrderSuccessPage from './pages/OrderSuccessPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import NotFound from './pages/NotFound';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster />
            <Router>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<MenuPage />} />
                    <Route path="/food/:id" element={<FoodDetailsPage />} />
                    <Route
                      path="/cart"
                      element={
                        <ProtectedRoute>
                          <CartPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute>
                          <CheckoutPage />
                        </ProtectedRoute>
                      }
                    />
                     <Route
                      path="/PaymentPage"
                      element={
                        <ProtectedRoute>
                          <PaymentPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/order-success"
                      element={
                        <ProtectedRoute>
                          <OrderSuccessPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route
                      path="/order/:id"
                      element={
                        <ProtectedRoute>
                          <OrderDetailsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <footer className="bg-gray-800 text-white py-8">
                  <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div>
                        <h3 className="text-lg font-bold mb-4">AROTAC</h3>
                        <p className="text-gray-300">
                          Delicious food delivered to your door. Order online for pickup or delivery.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                          <li>
                            <Link to="/" className="text-gray-300 hover:text-white">
                              Menu
                            </Link>
                          </li>
                          <li>
                            <Link to="/cart" className="text-gray-300 hover:text-white">
                              Cart
                            </Link>
                          </li>
                          <li>
                            <Link to="/profile" className="text-gray-300 hover:text-white">
                              Profile
                            </Link>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-4">Contact Us</h3>
                        <p className="text-gray-300">
                          123 Main Street<br />
                          City, State 12345<br />
                          Phone: (123) 456-7890<br />
                          Email: info@AROTAC.com
                        </p>
                      </div>
                    </div>
                    <div className="mt-8 pt-4 border-t border-gray-700 text-center text-gray-400">
                      <p>© {new Date().getFullYear()} AROTAC. All rights reserved.</p>
                    </div>
                  </div>
                </footer>
              </div>
            </Router>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;