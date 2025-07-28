import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaSpinner,
  FaMotorcycle,
  FaCar,
  FaBicycle,
  FaSearch,
  FaMapMarkerAlt,
  FaUser,
  FaPhone,
  FaCarAlt,
  FaInfoCircle,
  FaBox,
} from "react-icons/fa";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import io from "socket.io-client";

// Set Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Utility function to calculate bearing between two points
const calculateBearing = (startLng, startLat, destLng, destLat) => {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const toDegrees = (radians) => (radians * 180) / Math.PI;

  const startLatRad = toRadians(startLat);
  const startLngRad = toRadians(startLng);
  const destLatRad = toRadians(destLat);
  const destLngRad = toRadians(destLng);

  const deltaLng = destLngRad - startLngRad;

  const y = Math.sin(deltaLng) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(deltaLng);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
};

// ManagerDeliveryMap Component
const ManagerDeliveryMap = ({ currentLocation, destination, orderId, refreshKey }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const bikeMarker = useRef(null);
  const homeMarker = useRef(null);
  const socket = useRef(null);
  const lastRouteUpdate = useRef(0);
  const ROUTE_UPDATE_INTERVAL = 10000;

  const correctedDestination = {
    longitude: destination?.coordinates?.[0] || 80.2215,
    latitude: destination?.coordinates?.[1] || 9.729583,
  };

  useEffect(() => {
    socket.current = io(import.meta.env.VITE_WEBSOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      secure: false,
    });

    socket.current.on("connect", () => {
      console.log("Connected to WebSocket in ManagerDeliveryMap");
      socket.current.emit("joinOrder", orderId);
    });

    socket.current.on("locationUpdate", ({ deliveryPersonId, location }) => {
      console.log("Received locationUpdate in ManagerDeliveryMap:", { deliveryPersonId, location });
      if (bikeMarker.current && location?.coordinates) {
        animateBikeTo(location.coordinates[0], location.coordinates[1]);
      }
    });

    socket.current.on("connect_error", (error) => {
      console.error("WebSocket connection error in ManagerDeliveryMap:", error);
    });

    return () => {
      socket.current.disconnect();
    };
  }, [orderId]);

  useEffect(() => {
    if (
      map.current &&
      map.current.isStyleLoaded() &&
      currentLocation?.coordinates?.[0] &&
      currentLocation?.coordinates?.[1] &&
      correctedDestination?.longitude &&
      correctedDestination?.latitude &&
      Date.now() - lastRouteUpdate.current > ROUTE_UPDATE_INTERVAL
    ) {
      drawRoute(
        [currentLocation.coordinates[0], currentLocation.coordinates[1]],
        [correctedDestination.longitude, correctedDestination.latitude]
      );
      lastRouteUpdate.current = Date.now();

      if (bikeMarker.current) {
        const bearing = calculateBearing(
          currentLocation.coordinates[0],
          currentLocation.coordinates[1],
          correctedDestination.longitude,
          correctedDestination.latitude
        );
        bikeMarker.current.getElement().style.transform = `translate(-50%, -50%) rotate(${bearing}deg)`;
      }
    }
  }, [currentLocation, correctedDestination]); // Fixed typo: correctedResponse -> correctedDestination

  const loadMarkers = () => {
    if (!map.current || !map.current.isStyleLoaded()) {
      console.error("Map not loaded or style not ready for markers in ManagerDeliveryMap");
      return;
    }

    if (currentLocation?.coordinates?.[0] && currentLocation?.coordinates?.[1]) {
      if (bikeMarker.current) bikeMarker.current.remove();
      const bikeEl = document.createElement("div");
      bikeEl.className = "bike-marker";
      bikeEl.textContent = "🛵";
      bikeEl.style.fontSize = "32px";
      bikeEl.style.lineHeight = "1";
      bikeEl.style.transform = "translate(-50%, -50%)";
      bikeEl.style.filter = "drop-shadow(0 2px 3px rgba(0,0,0,0.3))";
      bikeEl.style.transition = "transform 0.3s ease";

      bikeMarker.current = new mapboxgl.Marker(bikeEl)
        .setLngLat([currentLocation.coordinates[0], currentLocation.coordinates[1]])
        .addTo(map.current);

      const bearing = calculateBearing(
        currentLocation.coordinates[0],
        currentLocation.coordinates[1],
        correctedDestination.longitude,
        correctedDestination.latitude
      );
      bikeEl.style.transform = `translate(-50%, -50%) rotate(${bearing}deg)`;

      console.log("Added bike marker at:", [currentLocation.coordinates[0], currentLocation.coordinates[1]]);
    } else {
      console.error("Invalid currentLocation in ManagerDeliveryMap:", currentLocation);
    }

    if (correctedDestination?.longitude && correctedDestination?.latitude) {
      if (homeMarker.current) homeMarker.current.remove();
      const homeEl = document.createElement("div");
      homeEl.className = "home-marker";
      homeEl.textContent = "🏠";
      homeEl.style.fontSize = "30px";
      homeEl.style.lineHeight = "1";
      homeEl.style.transform = "translate(-50%, -50%)";
      homeEl.style.filter = "drop-shadow(0 2px 3px rgba(0,0,0,0.3))";

      homeMarker.current = new mapboxgl.Marker(homeEl)
        .setLngLat([correctedDestination.longitude, correctedDestination.latitude])
        .setPopup(new mapboxgl.Popup().setText(`Delivery Address: ${destination?.address || "Chavakachcheri, Jaffna"}`))
        .addTo(map.current);

      console.log("Added home marker at:", [correctedDestination.longitude, correctedDestination.latitude]);

      drawRoute(
        [currentLocation.coordinates[0], currentLocation.coordinates[1]],
        [correctedDestination.longitude, correctedDestination.latitude]
      );

      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([currentLocation.coordinates[0], currentLocation.coordinates[1]]);
      bounds.extend([correctedDestination.longitude, correctedDestination.latitude]);
      map.current.fitBounds(bounds, { padding: 100, maxZoom: 15 });
    } else {
      console.error("Invalid correctedDestination in ManagerDeliveryMap:", correctedDestination);
    }
  };

  const animateBikeTo = (lng, lat) => {
    if (!bikeMarker.current) return;

    const currentLngLat = bikeMarker.current.getLngLat();
    const deltaLng = (lng - currentLngLat.lng) / 60;
    const deltaLat = (lat - currentLngLat.lat) / 60;
    let i = 0;

    const animate = () => {
      if (i < 60) {
        bikeMarker.current.setLngLat([currentLngLat.lng + deltaLng * i, currentLngLat.lat + deltaLat * i]);
        const bearing = calculateBearing(
          currentLngLat.lng + deltaLng * i,
          currentLngLat.lat + deltaLat * i,
          correctedDestination.longitude,
          correctedDestination.latitude
        );
        bikeMarker.current.getElement().style.transform = `translate(-50%, -50%) rotate(${bearing}deg)`;
        i++;
        requestAnimationFrame(animate);
      } else {
        bikeMarker.current.setLngLat([lng, lat]);
        const bearing = calculateBearing(
          lng,
          lat,
          correctedDestination.longitude,
          correctedDestination.latitude
        );
        bikeMarker.current.getElement().style.transform = `translate(-50%, -50%) rotate(${bearing}deg)`;
      }
    };
    animate();
  };

  const fetchRoute = async (from, to) => {
    try {
      console.log(`Fetching route from [${from[0]}, ${from[1]}] to [${to[0]}, ${to[1]}]`);
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}&overview=full`
      );
      const response = await query.json();
      console.log("Mapbox Directions API Response:", response);

      if (response.code === "Ok" && response.routes && response.routes.length > 0) {
        let geometry = response.routes[0].geometry;
        if (geometry.coordinates && geometry.coordinates.length > 0) {
          // Snap the last point to the destination with a small tolerance
          const lastPoint = geometry.coordinates[geometry.coordinates.length - 1];
          const dx = to[0] - lastPoint[0];
          const dy = to[1] - lastPoint[1];
          if (dx * dx + dy * dy > 0.0001) { // Tolerance of ~10 meters
            geometry.coordinates[geometry.coordinates.length - 1] = to;
          }
        }
        return geometry;
      } else {
        console.error("No valid routes found in response:", response);
        return null;
      }
    } catch (error) {
      console.error("Error fetching route from Mapbox Directions API:", error);
      return null;
    }
  };

  const drawRoute = async (from, to) => {
    if (!map.current || !map.current.isStyleLoaded()) {
      console.error("Map not loaded or style not ready in ManagerDeliveryMap");
      return;
    }

    const routeGeometry = await fetchRoute(from, to);
    if (!routeGeometry) {
      console.warn("Falling back to straight line due to route fetch failure");
      const lineData = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [from, to],
        },
      };

      if (map.current.getSource("route")) {
        map.current.getSource("route").setData(lineData);
      } else {
        map.current.addSource("route", { type: "geojson", data: lineData });
        map.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#FF5733", "line-width": 4 },
        });
      }
      return;
    }

    const lineData = { type: "Feature", geometry: routeGeometry };

    if (map.current.getLayer("route")) map.current.removeLayer("route");
    if (map.current.getSource("route")) map.current.removeSource("route");

    map.current.addSource("route", { type: "geojson", data: lineData });
    map.current.addLayer({
      id: "route",
      type: "line",
      source: "route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#FF5733", "line-width": 4 },
    });
  };

  useEffect(() => {
    if (!currentLocation?.coordinates?.[0] || !currentLocation?.coordinates?.[1]) {
      console.error("Skipping map initialization due to invalid currentLocation:", currentLocation);
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [currentLocation.coordinates[0], currentLocation.coordinates[1]],
      zoom: 13,
    });

    map.current.on("load", () => {
      map.current.addControl(new mapboxgl.NavigationControl());
      loadMarkers();
    });

    map.current.on("error", (e) => {
      console.error("Mapbox error in ManagerDeliveryMap:", e.error);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [currentLocation, refreshKey]);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <div
        ref={mapContainer}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: "12px",
        }}
      />
    </div>
  );
};

// Main TrackingPage Component
const TrackingPage = () => {
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const socket = useRef(null);
  const [assignedOrder, setAssignedOrder] = useState(null);
  const pollingInterval = useRef(null);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    fetchDeliveryPersons();
  }, []);

  useEffect(() => {
    socket.current = io(import.meta.env.VITE_WEBSOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      secure: false,
    });

    socket.current.on("connect", () => {
      console.log("Connected to WebSocket");
    });

    socket.current.on("locationUpdate", ({ deliveryPersonId, location }) => {
      console.log("Received locationUpdate:", { deliveryPersonId, location });
      const person = deliveryPersons.find((p) => p._id === deliveryPersonId);
      if (person && selectedPerson?._id === deliveryPersonId) {
        setSelectedPerson((prev) => ({
          ...prev,
          currentLocation: {
            ...prev.currentLocation,
            coordinates: location.coordinates,
          },
        }));
      }
    });

    socket.current.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
    });

    return () => {
      socket.current.disconnect();
    };
  }, [deliveryPersons, selectedPerson]);

  const fetchDeliveryPersons = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/delivery-persons`);
      const personsWithLocations = response.data.map((person) => {
        const isInvalidLocation =
          !person.currentLocation ||
          !person.currentLocation.coordinates ||
          (person.currentLocation.coordinates[0] === 0 && person.currentLocation.coordinates[1] === 0);

        return {
          ...person,
          currentLocation: isInvalidLocation
            ? {
                type: "Point",
                coordinates: [79.8612 + (Math.random() * 0.1 - 0.05), 6.9271 + (Math.random() * 0.1 - 0.05)],
                address: "Colombo",
              }
            : person.currentLocation,
        };
      });
      console.log("Fetched Delivery Persons:", personsWithLocations);
      setDeliveryPersons(personsWithLocations);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch delivery persons. Please try again later.");
      toast.error("Failed to fetch delivery persons!");
      setLoading(false);
    }
  };

  const fetchAssignedOrder = async (personId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/delivery-persons/${personId}/assigned-orders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      console.log("Assigned Order Response:", response.data);
      const onTheWayOrder = response.data.find(order =>
        order.status === "on_the_way" &&
        order.deliveryLocation?.coordinates &&
        order.deliveryLocation.coordinates.every(coord => coord !== 0)
      );
      const validOrder = onTheWayOrder || response.data.find(order =>
        order.deliveryLocation?.coordinates &&
        order.deliveryLocation.coordinates.every(coord => coord !== 0)
      ) || null;

      if (validOrder) {
        console.log("Selected valid order:", validOrder);
        return validOrder;
      } else {
        console.log("No valid order found, using fallback");
        return {
          _id: "fallback",
          deliveryLocation: {
            coordinates: [80.2215, 9.729583],
            address: "Default Address",
          },
        };
      }
    } catch (err) {
      console.error("Failed to fetch assigned order:", err);
      return {
        _id: "fallback",
        deliveryLocation: {
          coordinates: [80.2215, 9.729583],
          address: "Default Address",
        },
      };
    }
  };

  const startPolling = (personId) => {
    if (pollingInterval.current) clearInterval(pollingInterval.current);
    pollingInterval.current = setInterval(async () => {
      console.log("Polling for updates...");
      await fetchDeliveryPersons();
      if (selectedPerson) {
        const order = await fetchAssignedOrder(personId);
        setAssignedOrder(order);
      }
    }, 5000);
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  const handleTrack = async (person) => {
    setIsTracking(true);
    setSelectedPerson(null);
    setAssignedOrder(null);

    setSelectedPerson(person);
    const order = await fetchAssignedOrder(person._id);
    setAssignedOrder(order);

    startPolling(person._id);

    setMapRefreshKey((prev) => prev + 1);
    setTimeout(() => {
      setMapRefreshKey((prev) => prev + 1);
      setIsTracking(false);
    }, 500);
  };

  const filteredDeliveryPersons = deliveryPersons.filter((person) => {
    const matchesSearch =
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.phone.includes(searchTerm) ||
      person.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "available" && person.status === "available") ||
      (activeTab === "busy" && person.status === "busy");

    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-indigo-600 mx-auto mb-4" />
          <p className="text-lg text-gray-700">Loading delivery team...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-md p-8 bg-white rounded-xl shadow-lg text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{error}</h3>
          <button
            onClick={fetchDeliveryPersons}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaMapMarkerAlt className="text-indigo-600 mr-3 text-4xl" />
              Delivery Tracking System
            </h1>
            <p className="mt-2 text-sm text-gray-600">Monitor and track your delivery personnel in real-time</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="w-full sm:w-64">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search delivery persons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 text-sm font-medium rounded-full ${
                  activeTab === "all" ? "bg-indigo-100 text-indigo-800" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                All ({deliveryPersons.length})
              </button>
              <button
                onClick={() => setActiveTab("available")}
                className={`px-3 py-1.5 text-sm font-medium rounded-full ${
                  activeTab === "available"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                Available ({deliveryPersons.filter((p) => p.status === "available").length})
              </button>
              <button
                onClick={() => setActiveTab("busy")}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                  activeTab === "busy"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                On Delivery ({deliveryPersons.filter((p) => p.status === "busy").length})
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Delivery Team
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {filteredDeliveryPersons.length}{" "}
                    {filteredDeliveryPersons.length === 1 ? "person" : "persons"}
                  </span>
                </h2>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: "600px" }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Person
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDeliveryPersons.length > 0 ? (
                      filteredDeliveryPersons.map((person) => (
                        <tr
                          key={person._id}
                          className={`hover:bg-gray-50 transition-colors ${
                            selectedPerson?._id === person._id ? "bg-indigo-50" : ""
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <FaUser className="text-indigo-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {person.name}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center">
                                  <FaPhone className="mr-1 text-xs" />
                                  {person.phone}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center">
                                  <FaCarAlt className="mr-1 text-xs" />
                                  {person.vehicleNumber} ({person.vehicleType})
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                person.status === "available"
                                  ? "bg-green-100 text-green-800"
                                  : person.status === "busy"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {person.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleTrack(person)}
                              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm ${
                                selectedPerson?._id === person._id
                                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                  : "bg-white text-indigo-600 border-indigo-600 hover:bg-indigo-50"
                              }`}
                            >
                              Track
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <svg
                              className="w-16 h-16 mb-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <p className="text-lg font-medium">No delivery persons found</p>
                            <p className="text-sm mt-1">Try adjusting your search</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
              {selectedPerson && !isTracking ? (
                <>
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FaMapMarkerAlt className="text-indigo-600 mr-2" />
                      Tracking {selectedPerson.name}
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <FaUser className="text-indigo-600 mr-2" />
                          <div>
                            <p className="text-xs text-gray-500">Delivery Person</p>
                            <p className="font-medium">{selectedPerson.name}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <FaPhone className="text-indigo-600 mr-2" />
                          <div>
                            <p className="text-xs text-gray-500">Contact</p>
                            <p className="font-medium">{selectedPerson.phone}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          {selectedPerson.vehicleType === "bike" ? (
                            <FaMotorcycle className="text-indigo-600 mr-2" />
                          ) : selectedPerson.vehicleType === "car" ? (
                            <FaCar className="text-indigo-600 mr-2" />
                          ) : (
                            <FaBicycle className="text-indigo-600 mr-2" />
                          )}
                          <div>
                            <p className="text-xs text-gray-500">Vehicle</p>
                            <p className="font-medium">
                              {selectedPerson.vehicleNumber} ({selectedPerson.vehicleType})
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <FaBox className="text-indigo-600 mr-2" />
                          <div>
                            <p className="text-xs text-gray-500">Current Order (On the Way)</p>
                            {assignedOrder && assignedOrder._id !== "fallback" && assignedOrder.status === "on_the_way" ? (
                              <div>
                                <p className="font-medium">Order ID: {assignedOrder._id}</p>
                                <p className="text-sm text-gray-600">Status: On the Way</p>
                                <p className="text-sm text-gray-600">
                                  Delivery Address: {assignedOrder.deliveryLocation.address || "N/A"}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-600 italic">No active delivery</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200" style={{ minHeight: "384px" }}>
                      {assignedOrder && (
                        <ManagerDeliveryMap
                          key={mapRefreshKey}
                          currentLocation={selectedPerson.currentLocation}
                          destination={assignedOrder.deliveryLocation}
                          orderId={assignedOrder._id}
                          refreshKey={mapRefreshKey}
                        />
                      )}
                    </div>
                  </div>
                </>
              ) : selectedPerson && isTracking ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <FaSpinner className="animate-spin text-4xl text-indigo-600 mb-4" />
                  <p className="text-gray-500">Loading tracking data...</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <FaMapMarkerAlt className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Delivery Person Selected</h3>
                  <p className="text-gray-500 mb-6">Select a delivery person from the list to view their location on the map</p>
                  <div className="bg-indigo-100 text-indigo-800 p-3 rounded-lg">
                    <p className="text-sm flex items-center">
                      <FaInfoCircle className="mr-2" />
                      Click the "Track" button next to a delivery person
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;