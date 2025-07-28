import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar.jsx';
import AddMenuItem from './pages/addMenuItems/AddMenuItem.jsx';
import ViewMenuItems from './pages/ViewMenuItems/ViewMenuItems.jsx';
import EditMenuItem from './pages/EditMenuItem/EditMenuItem.jsx';
import AddOfferForm from './pages/AddOfferForm/AddOfferForm.jsx';
import AddTableForm from './pages/AddTable/AddTable.jsx';
import TableList from './pages/TableList/TableList.jsx';
import OffersPage from './pages/OffersPage/OffersPage.jsx';
import EditOffer from './pages/EditOffer/EditOffer.jsx';
import InfoPage from './pages/InfoPage/InfoPage.jsx';
import Login from './pages/Login/Login.jsx';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword/ResetPassword.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/ReactToastify.css';
import { useEffect, useState } from 'react';
import MenuAnalytics from './pages/MenuAnalytics/MenuAnalytics.jsx';
import OfferAnalytics from './pages/OfferAnalytics/OfferAnalytics.jsx';
import EditTable from './pages/EditTable/EditTable.jsx';
import AddOrder from './pages/OrderPage/OrderPage.jsx';
import OrderSummaryPage from './pages/OrderSummaryPage/OrderSummaryPage.jsx';
import OrderListPage from './pages/OrderListPage/OrderListPage.jsx';
import EditOrderPage from './pages/EditOrderPage/EditOrderPage.jsx';
import OrdersPage from './pages/OrdersPage/OrdersPage.jsx';
import HomeOrders from './pages/HomeOrders/HomeOrders.jsx';
import InRestaurantOrders from './pages/InRestaurentOrders.jsx/InRestaurentOrders.jsx';
import ProcessedOrdersPage from './pages/ProcessedOrdersPage/ProcessedOrdersPage.jsx';
import OrderDetails from './pages/OrderDetails/OrderDetails.jsx';
import DeliveryPersonList from './pages/DeliveryPersonList/DeliveryPersonList.jsx';
import DeliveryPersonDetails from './pages/DeliveryPersonDetails/DeliveryPersonDetails.jsx';
import TrackingPage from './pages/TrackingPage/TrackingPage.jsx';
import DeliveredOrder from './pages/DeliveredOrder/DeliveredOrder.jsx';
import FailedOrder from './pages/FailedOrder/FailedOrder.jsx';
import MessageOptionsModal from './pages/Message/MessageOptionsModal.jsx';
import MessagingModal from './pages/Message/MessagingModal.jsx';
import ManagerFeedbackPage from './pages/ManagerFeedbackPage/ManagerFeedbackPage.jsx';
import FeedbackAnalyticsPage from './pages/FeedbackAnalyticsPage/FeedbackAnalyticsPage.jsx';
import RestaurantDashboard from './pages/RestaurantDashboard/RestaurantDashboard.jsx';
const App = () => {
  const [authStatus, setAuthStatus] = useState('checking');

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setAuthStatus('unauthenticated');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/auth/verify', {
          headers: { 'x-auth-token': token }
        });
        
        if (response.ok) {
          setAuthStatus('authenticated');
        } else {
          localStorage.removeItem('token');
          setAuthStatus('unauthenticated');
        }
      } catch (error) {
        localStorage.removeItem('token');
        setAuthStatus('unauthenticated');
      }
    };

    verifyToken();
  }, []);

  const PrivateRoute = ({ children }) => {
    switch (authStatus) {
      case 'checking':
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
      case 'authenticated':
        return children;
      default:
        return <Navigate to="/login" replace />;
    }
  };

  const Layout = () => (
    <div className="flex">
      <Sidebar />
      <Routes>
        <Route path="/menu/view" element={<ViewMenuItems />} />
        <Route path="/menu/add" element={<AddMenuItem />} />
        <Route path="/menu/edit/:id" element={<EditMenuItem />} />
        <Route path="/offers/view" element={<OffersPage />} />
        <Route path="/offers/add" element={<AddOfferForm />} />
        <Route path="/offers/edit/:id" element={<EditOffer />} />
        <Route path="/offers/info" element={<InfoPage />} />
        <Route path="/menu/analytics" element={<MenuAnalytics />} />
        <Route path="/offer/analytics" element={<OfferAnalytics />} />
        <Route path="/table/add" element={<AddTableForm />} />
        <Route path="/table/view" element={<TableList />} />
        <Route path="/order/view" element={<OrderListPage />} />
        <Route path="/edit-table/:id" element={<EditTable />} />
        <Route path="/orders/edit/:id" element={<EditOrderPage />} />
        <Route path="/order/add" element={<AddOrder />} />
        <Route path="/order-summary" element={<OrderSummaryPage />} />
        <Route path="/view/orders" element={<OrdersPage />} />
        <Route path="/view/homeorders" element={<HomeOrders />} />
        <Route path="/view/inrestOrders" element={<InRestaurantOrders />} />
        <Route path="/view/processOrder" element={<ProcessedOrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetails />} />
        <Route path="/view/deliveryPerson" element={<DeliveryPersonList />} />
        <Route path="/delivery-persons/:id" element={<DeliveryPersonDetails/>} />
        <Route path="/delivery/tracking" element={<TrackingPage/>} />
        <Route path="/view/deliveredOrder" element={<DeliveredOrder/>} />
        <Route path="/view/failedOrder" element={<FailedOrder/>} />
        <Route path="/message" element={<MessageOptionsModal/>} />
        <Route path="/messaging" element={<MessagingModal/>} />
        <Route path="/feedback" element={<ManagerFeedbackPage/>} />
        <Route path="/feedback/analytics" element={<FeedbackAnalyticsPage />} />
        <Route path="/" element={<RestaurantDashboard />} />
      </Routes>
    </div>
  );

  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route 
          path="/login" 
          element={authStatus === 'authenticated' ? 
            <Navigate to="/menu/view" replace /> : 
            <Login setAuthStatus={setAuthStatus} />
          } 
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;