import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BsArrowLeftShort, BsChevronDown, BsSearch } from "react-icons/bs";
import { MdDashboard, MdAnalytics, MdSettings, MdLogout, MdMenuBook, MdAddBox } from "react-icons/md";
import { MdOutlineAnalytics } from "react-icons/md";
import { FaRegFileAlt, FaRegImages, FaUser } from "react-icons/fa";
import { MdOutlineDoneOutline } from "react-icons/md";
import { LuList } from "react-icons/lu";
import { MdOutlineWrongLocation } from "react-icons/md";
import { MdFormatListBulletedAdd } from "react-icons/md";
import { MdViewSidebar } from "react-icons/md";
import { assets } from '../../assets/assets';
import { BiMessageSquareDetail } from "react-icons/bi";
import { BiSolidFoodMenu } from "react-icons/bi";
import { GoListUnordered } from "react-icons/go";
import { BiSolidOffer } from "react-icons/bi";
import { MdOutlineInfo } from "react-icons/md";
import { MdTableRestaurant } from "react-icons/md";
import { IoIosAddCircle } from "react-icons/io";
import { IoCheckmarkDoneCircleOutline } from "react-icons/io5";
import { LuTable } from "react-icons/lu";
import { FaCartPlus } from "react-icons/fa";
import { MdOutlineHome } from "react-icons/md";
import { MdDeliveryDining } from "react-icons/md";
import { MdOutlineAddShoppingCart } from "react-icons/md";
import { VscListUnordered } from "react-icons/vsc";
import { MdTrackChanges } from "react-icons/md";
import { GrRestaurant } from "react-icons/gr";
import { BiBarChartSquare } from "react-icons/bi";
import { VscFeedback } from "react-icons/vsc";
import { CiViewTimeline } from "react-icons/ci";
import './Sidebar.css';

const Sidebar = ({ socket, user }) => {
  const [open, setOpen] = useState(true);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const navigate = useLocation();
  const [isMessageOptionsOpen, setIsMessageOptionsOpen] = useState(false);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    // Reset modal when route changes to avoid unexpected opening
    if (navigate.pathname === '/menu/view') {
      setIsMessageOptionsOpen(false);
    }
  }, [navigate.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleOptionSelect = (deliveryPerson) => {
    if (deliveryPerson && deliveryPerson.id) {
      console.log("Selected delivery person:", deliveryPerson);
      setSelectedDeliveryPerson(deliveryPerson);
      setIsMessageOptionsOpen(false);
      setIsMessagingOpen(true);
    } else {
      console.error("Invalid delivery person selected:", deliveryPerson);
    }
  };

  const handleBackToOptions = () => {
    setIsMessagingOpen(false);
    setIsMessageOptionsOpen(true);
  };

  const handleUnreadCountChange = (count) => {
    setUnreadCount(count);
  };

  const Menus = [
    { title: "Dashboard", path: "/", icon: <MdDashboard /> },
    {
      title: "Manual Orders",
      icon: <FaCartPlus />,
      submenu: true,
      submenuItems: [
        { title: "Add Manual order", path: "/order/add", icon: <MdOutlineAddShoppingCart /> },
        { title: "View order", path: "/order/view", icon: <VscListUnordered /> },
      ],
    },
    {
      title: "Feedback management",
    icon: <VscFeedback />,
     submenu: true,
     submenuItems: [
       { title: "View feedback",  path: "/feedback",  icon: <CiViewTimeline /> },
       { title: "Analytics", path: "/feedback/analytics", icon: <BiBarChartSquare /> },
     ],
   },

    {
      title: "Table management (QR)",
      icon: <MdTableRestaurant />,
      spacing: true,
      submenu: true,
      submenuItems: [
        { title: "View all tables", path: "/table/view", icon: <LuTable /> },
        { title: "Add table", path: "/table/add", icon: <IoIosAddCircle /> },
      ],
    },
    {
      title: "Menu management",
      icon: <BiSolidFoodMenu />,
      submenu: true,
      submenuItems: [
        { title: "View all menu", path: "/menu/view", icon: <MdMenuBook /> },
        { title: "Add menu item", path: "/menu/add", icon: <MdFormatListBulletedAdd /> },
        { title: "Analytics", path: "/menu/analytics", icon: <MdOutlineAnalytics /> },
      ],
    },
    {
      title: "Offer management",
      icon: <BiSolidOffer />,
      submenu: true,
      submenuItems: [
        { title: "View all offers", path: "/offers/view", icon: <MdViewSidebar /> },
        { title: "Add offer", path: "/offers/add", icon: <MdAddBox /> },
        { title: "Offer info", path: "/offers/info", icon: <MdOutlineInfo /> },
        { title: "Analytics", path: "/offer/analytics", icon: <MdOutlineAnalytics /> },
      ],
    },
    {
      title: "Analytics",
      icon: <MdAnalytics />,
      submenu: true,
      submenuItems: [
        { title: "Menu", path: "/menu/analytics", icon: <MdOutlineAnalytics /> },
        { title: "Offers", path: "/offer/analytics", icon: <MdOutlineAnalytics /> },
      ],
    },
    {
      title: "Order Management",
      icon: <GoListUnordered />,
      spacing: true,
      submenu: true,
      submenuItems: [
        { title: "View all order", path: "/view/orders", icon: <MdViewSidebar /> },
        { title: "Home Orders", path: "/view/homeorders", icon: <MdOutlineHome /> },
        { title: "In-restaurent orders", path: "/view/inrestOrders", icon: <GrRestaurant /> },
        { title: "Processed Orders", path: "/view/processOrder", icon: <MdOutlineDoneOutline /> },
      ],
    },
    {
      title: "Delivery Management",
      icon: <MdDeliveryDining />,
      submenu: true,
      submenuItems: [
        { 
          title: "Delivery Person List", 
          path: "/view/deliveryPerson", 
          icon: <LuList /> 
        },
        { title: "Tracking", path: "/delivery/tracking", icon: <MdTrackChanges /> },
        { title: "Delivered Orders", path: "/view/deliveredOrder", icon: <IoCheckmarkDoneCircleOutline /> },
        { title: "Failed Orders", path: "/view/failedOrder", icon: <MdOutlineWrongLocation /> },
      ],
    },
    {
      title: "Messages",
      icon: <BiMessageSquareDetail />,
      path:"/message",
    },
    {
      title: "Logout",
      icon: <MdLogout />,
      onClick: handleLogout,
    },
  ];

  // Flatten all menu items for search
  const allMenuItems = useMemo(() => {
    const items = [];
    Menus.forEach(menu => {
      if (menu.path) {
        items.push({
          title: menu.title,
          path: menu.path,
          icon: menu.icon,
          isMain: true
        });
      }
      if (menu.submenu && menu.submenuItems) {
        menu.submenuItems.forEach(subItem => {
          items.push({
            title: subItem.title,
            path: subItem.path,
            icon: subItem.icon,
            parentTitle: menu.title,
            isSubmenu: true
          });
        });
      }
    });
    return items;
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    const results = allMenuItems.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.path && item.path.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 5); // Limit to 5 results
    
    setSearchResults(results);
    setShowSearchResults(results.length > 0);
  };
  const handleSearchItemClick = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  return (
    <div className="sidebar flex">
      <div
        className={`bg-[#081A51] h-screen p-5 pt-8 ${
          open ? "w-72" : "w-20"
        } relative duration-300 flex flex-col`}
      >
        <BsArrowLeftShort
          className={`bg-white text-[#081A51] text-3xl rounded-full absolute 
          border border-[#081A51] cursor-pointer 
          ${open ? "-right-3 rotate-0" : "right-2 rotate-180"} top-9 duration-400`}
          onClick={() => setOpen(!open)}
        />

        <div className="inline-flex">
          <img
            src={assets.logo}
            alt="Logo"
            className={`w-32 h-12 duration-500 ${!open && "scale-0"} ${
              open && "rotate-[360deg]"
            }`}
          />
          <h1
            className={`text-white font-medium pt-2 duration-500 ${
              !open && "scale-0"
            } cursor-pointer`}
            style={{ fontSize: "1.25rem" }}
          >
            Dashboard
          </h1>
        </div>

        <div className="relative">
          <div
            className={`flex items-center rounded-md bg-[rgba(255,255,255,0.18)] mt-6 ${
              !open ? "px-2.5" : "px-4"
            } py-2`}
          >
            <BsSearch className="text-white text-lg block float-left cursor-pointer" />
            <input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className={`text-base bg-transparent w-full text-white focus:outline-none ${
                !open && "hidden"
              }`}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
            />
          </div>
          
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg">
              <div className="py-1">
                {searchResults.map((result, index) => (
                  <Link
                    key={index}
                    to={result.path}
                    onClick={handleSearchItemClick}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <span className="mr-2">{result.icon}</span>
                      <div>
                        <div className="font-medium">{result.title}</div>
                        {result.parentTitle && (
                          <div className="text-xs text-gray-500">{result.parentTitle}</div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar mt-4">
          <ul className="text-white">
            {Menus.map((menu, index) => (
              <li key={index} className="pt-2 text-white">
                {menu.action ? (
                  <div
                    className={`relative flex items-center gap-x-4 cursor-pointer p-2 
                      hover:bg-[rgba(255,255,255,0.18)] hover:rounded text-white no-underline ${
                        menu.spacing ? "mt-9" : "mt-2"
                      }`}
                    onClick={menu.action}
                  >
                    <span className="text-2xl block float-left">{menu.icon}</span>
                    <span className={`text-base font-medium flex-1 ${!open && "hidden"}`}>
                      {menu.title}
                    </span>
                    {menu.title === "Messages" && unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                ) : menu.path ? (
                  <Link
                    to={menu.path}
                    className={`flex items-center gap-x-4 cursor-pointer p-2 
                      hover:bg-[rgba(255,255,255,0.18)] hover:rounded text-white no-underline ${
                        menu.spacing ? "mt-9" : "mt-2"
                      }`}
                    onClick={menu.onClick}
                  >
                    <span className="text-2xl block float-left">{menu.icon}</span>
                    <span className={`text-base font-medium flex-1 ${!open && "hidden"}`}>
                      {menu.title}
                    </span>
                    {menu.submenu && (
                      <BsChevronDown
                        className={`${openSubmenu === menu.title ? "rotate-180" : ""}`}
                      />
                    )}
                  </Link>
                ) : (
                  <div
                    className={`flex items-center gap-x-4 cursor-pointer p-2 
                      hover:bg-[rgba(255,255,255,0.18)] hover:rounded text-white no-underline ${
                        menu.spacing ? "mt-9" : "mt-2"
                      }`}
                    onClick={menu.onClick || (() => menu.submenu && setOpenSubmenu(openSubmenu === menu.title ? null : menu.title))}
                  >
                    <span className="text-2xl block float-left">{menu.icon}</span>
                    <span className={`text-base font-medium flex-1 ${!open && "hidden"}`}>
                      {menu.title}
                    </span>
                    {menu.submenu && (
                      <BsChevronDown
                        className={`${openSubmenu === menu.title ? "rotate-180" : ""}`}
                      />
                    )}
                  </div>
                )}

                {menu.submenu && open && openSubmenu === menu.title && (
                  <ul className="pt-2 text-white">
                    {menu.submenuItems.map((submenuItem, subIndex) => (
                      <li key={subIndex}>
                        {submenuItem.action ? (
                          <div
                            className="flex items-center gap-x-4 cursor-pointer p-2 px-5
                              hover:bg-[rgba(255,255,255,0.18)] hover:rounded text-white no-underline"
                            onClick={submenuItem.action}
                          >
                            <span className="text-xl">{submenuItem.icon}</span>
                            {submenuItem.title}
                          </div>
                        ) : (
                          <Link
                            to={submenuItem.path}
                            className="flex items-center gap-x-4 cursor-pointer p-2 px-5
                              hover:bg-[rgba(255,255,255,0.18)] hover:rounded text-white no-underline"
                          >
                            <span className="text-xl">{submenuItem.icon}</span>
                            {submenuItem.title}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;