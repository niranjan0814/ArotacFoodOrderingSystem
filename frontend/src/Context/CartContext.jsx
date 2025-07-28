import React, { createContext, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import axios from "axios";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [orders, setOrders] = useState([]);
  const [cartItems, setCartItems] = useState(() => {
    const localData = localStorage.getItem("cartItems");
    return localData ? JSON.parse(localData) : [];
  });

  useEffect(() => {
    console.log("Current cartItems:", cartItems); // Debug: Log cartItems state
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item) => {
    try {
      console.log("Received item in addToCart:", item); // Debug: Log the incoming item
      if (!item._id || !item.name || !item.price) {
        throw new Error("Invalid item: missing _id, name, or price");
      }
      const normalizedItem = {
        ...item,
        id: item._id,
        menuItem: item._id, // For HomeOrder orderItemSchema
        image: item.imageUrl,
      };
      console.log("Normalized item:", normalizedItem);

      setCartItems((prevItems) => {
        const existingItem = prevItems.find((cartItem) => cartItem.id === normalizedItem.id);
        if (existingItem) {
          const updatedItems = prevItems.map((cartItem) =>
            cartItem.id === normalizedItem.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          );
          console.log("Updated cartItems (existing):", updatedItems);
          return updatedItems;
        }
        const updatedItems = [...prevItems, { ...normalizedItem, quantity: 1 }];
        console.log("Updated cartItems (new):", updatedItems);
        return updatedItems;
      });

      toast.success(`${normalizedItem.name} added to cart!`);
    } catch (error) {
      console.error("Error adding to cart:", error.message); // Debug: Log the error message
      toast.error("Failed to add item to cart");
    }
  };

  const removeFromCart = (id) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const increaseQuantity = (id) => {
    setCartItems(
      cartItems.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setCartItems(
      cartItems.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  };

  const postOrder = async ({ userId, address, phoneNumber, orderItems }) => {
    try {
      // Set a default address if none is provided
      const defaultAddress = address || "kokuvil";

      const orderData = {
        userId,
        address: defaultAddress, // Use the default address if address is undefined
        phoneNumber,
        order: JSON.stringify(
          orderItems.map((item) => ({
            menuItem: item.menuItem || item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image || item.imageUrl, // Include the image URL
          }))
        ),
        paymentMethod: "Online Pay",
      };

      const response = await axios.post(
        `${backendUrl}/api/homeOrder/create`,
        orderData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        if (!response.data.mainOrderId) {
          console.warn("Order created but no mainOrderId returned");
        }
        toast.success("Order placed successfully!");
        clearCart();
        return response.data;
      }

      throw new Error(response.data.message || "Order failed");
    } catch (error) {
      let errorMessage = "Order failed";
      if (error.response) {
        errorMessage = error.response.data?.message || error.message;
        console.error("Backend error details:", error.response.data);
      } else {
        console.error("Network/request error:", error);
      }

      toast.error(errorMessage);
      throw error;
    }
  };

  const fetchOrders = useCallback(async (userId) => {
    try {
      const response = await axios.get(`${backendUrl}/api/homeOrder/${userId}`);
      if (response.data.success) {
        setOrders(response.data.orders);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  }, []);

  const cancelOrder = useCallback(async (orderId) => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/homeOrder/${orderId}/cancel`
      );
      if (response.data.success) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === orderId ? { ...order, status: "cancelled" } : order
          )
        );
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to cancel order");
    }
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        increaseQuantity,
        decreaseQuantity,
        postOrder,
        fetchOrders,
        orders,
        cancelOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};