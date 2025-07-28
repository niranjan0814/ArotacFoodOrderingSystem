import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { getItemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary">
            AROTAC
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-primary">
              Menu
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="text-gray-700 hover:text-primary">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-primary"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary">
                  Login
                </Link>
                <Link to="/signup" className="text-gray-700 hover:text-primary">
                  Sign Up
                </Link>
              </>
            )}

            <Link to="/cart" className="relative">
              <ShoppingCart className="text-gray-700 hover:text-primary" />
              {getItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {getItemCount()}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Navigation Icons */}
          <div className="flex md:hidden items-center space-x-4">
            <Link to="/cart" className="relative">
              <ShoppingCart className="text-gray-700" />
              {getItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {getItemCount()}
                </span>
              )}
            </Link>

            <button onClick={toggleMenu}>
              {isMenuOpen ? (
                <X className="text-gray-700" />
              ) : (
                <Menu className="text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 bg-white">
            <div className="flex flex-col space-y-3">
              <Link
                to="/"
                className="text-gray-700 hover:text-primary px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Menu
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="text-gray-700 hover:text-primary px-4 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-left text-gray-700 hover:text-primary px-4 py-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-primary px-4 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="text-gray-700 hover:text-primary px-4 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;