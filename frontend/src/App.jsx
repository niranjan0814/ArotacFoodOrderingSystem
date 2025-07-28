import { twMerge } from 'tailwind-merge';
import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Menu from './pages/Menu/Menu.jsx'
import MenuItemDetails from "./pages/MenuItemDetails/MenuItemDetails";
import OfferPage from "./pages/OfferPage/OfferPage";
import LandingPage from "./pages/Home/Home.jsx";
import LoginHome from "./pages/HomeDelivery/Login.jsx";
import ResetPassword from './pages/HomeDelivery/ResetPassword.jsx';
import FoodList from './pages/HomeDelivery/FoodList.jsx';
import Profile from './pages/HomeDelivery/Profile.jsx';
import Contact from './pages/Contact/contactus.jsx';
import CartPage from './pages/HomeDelivery/CartPage.jsx';
import OrdersPage from './pages/HomeDelivery/OrdersPage.jsx';


const App = () => {
  return (
    <div className='app'>
      {/* Add ToastContainer at the root level */}
      <ToastContainer />
   
      <Routes>
          <Route  path="/*" element={<LandingPage />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/login-home" element={<LoginHome />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/menu/:id" element={<MenuItemDetails />} />
          <Route path="/offers" element={<OfferPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/foodList" element={<FoodList />} />
          <Route path="/profile" element={<Profile />} />
          
          <Route path="/contact" element={<Contact />} />
         
          <Route path="/cart" element={<CartPage />} />
          
          <Route path="/order" element={<OrdersPage />} />
       
      </Routes>
    </div>
  )
}

export default App