import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { assets } from "../assets/assets";
import io from "socket.io-client";

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

const DeliveryMap = ({ currentLocation, destination, orderId }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const bikeMarker = useRef(null);
  const homeMarker = useRef(null);
  const socket = useRef(null);
  const lastRouteUpdate = useRef(0);
  const ROUTE_UPDATE_INTERVAL = 10000;

  const correctedDestination = {
    longitude: destination?.longitude || 80.1744,
    latitude: destination?.latitude || 9.6717,
  };

  useEffect(() => {
    socket.current = io(import.meta.env.VITE_WEBSOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      secure: false,
    });

    socket.current.on("connect", () => {
      console.log("Connected to WebSocket in DeliveryMap");
      socket.current.emit("joinOrder", orderId);
    });

    socket.current.on("locationUpdate", ({ lat, lng }) => {
      console.log("Received locationUpdate in DeliveryMap:", { lat, lng });
      if (bikeMarker.current && lat && lng) {
        animateBikeTo(lng, lat);
      }
    });

    socket.current.on("connect_error", (error) => {
      console.error("WebSocket connection error in DeliveryMap:", error.message);
    });

    socket.current.on("disconnect", () => {
      console.log("WebSocket disconnected in DeliveryMap");
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [orderId]);

  useEffect(() => {
    if (
      map.current &&
      map.current.isStyleLoaded() &&
      currentLocation?.lng &&
      currentLocation?.lat &&
      correctedDestination?.longitude &&
      correctedDestination?.latitude &&
      Date.now() - lastRouteUpdate.current > ROUTE_UPDATE_INTERVAL
    ) {
      drawRoute(
        [currentLocation.lng, currentLocation.lat],
        [correctedDestination.longitude, correctedDestination.latitude]
      );
      lastRouteUpdate.current = Date.now();

      if (bikeMarker.current) {
        const bearing = calculateBearing(
          currentLocation.lng,
          currentLocation.lat,
          correctedDestination.longitude,
          correctedDestination.latitude
        );
        bikeMarker.current.getElement().style.transform = `translate(-50%, -50%) rotate(${bearing}deg)`;
      }
    }
  }, [currentLocation, correctedDestination]);

  const loadMarkers = () => {
    if (!map.current || !map.current.isStyleLoaded()) {
      console.error("Map not loaded or style not ready for markers in DeliveryMap");
      return;
    }

    if (currentLocation?.lng && currentLocation?.lat) {
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
        .setLngLat([currentLocation.lng, currentLocation.lat])
        .addTo(map.current);

      const bearing = calculateBearing(
        currentLocation.lng,
        currentLocation.lat,
        correctedDestination.longitude,
        correctedDestination.latitude
      );
      bikeEl.style.transform = `translate(-50%, -50%) rotate(${bearing}deg)`;

      console.log("Added bike marker at:", [currentLocation.lng, currentLocation.lat]);
    } else {
      console.error("Invalid currentLocation in DeliveryMap, using fallback:", currentLocation);
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
        .setLngLat([80.02102417951882, 9.67623434671338]) // Fallback coordinates
        .addTo(map.current);
      console.log("Added bike marker at fallback:", [80.02102417951882, 9.67623434671338]);
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
        .setPopup(
          new mapboxgl.Popup().setText(
            `Delivery Address: ${destination?.address || "Chavakachcheri, Jaffna"}`
          )
        )
        .addTo(map.current);

      console.log("Added home marker at:", [
        correctedDestination.longitude,
        correctedDestination.latitude,
      ]);

      drawRoute(
        [currentLocation?.lng || 80.02102417951882, currentLocation?.lat || 9.67623434671338],
        [correctedDestination.longitude, correctedDestination.latitude]
      );

      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([currentLocation?.lng || 80.02102417951882, currentLocation?.lat || 9.67623434671338]);
      bounds.extend([correctedDestination.longitude, correctedDestination.latitude]);
      map.current.fitBounds(bounds, { padding: 100, maxZoom: 15 });
    } else {
      console.error("Invalid correctedDestination in DeliveryMap:", correctedDestination);
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
        bikeMarker.current.setLngLat([
          currentLngLat.lng + deltaLng * i,
          currentLngLat.lat + deltaLat * i,
        ]);
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

  const addControls = () => {
    map.current.addControl(new mapboxgl.NavigationControl());

    const recenterControl = {
      onAdd: () => {
        const btn = document.createElement("button");
        btn.className = "mapboxgl-ctrl-icon";
        btn.style.backgroundImage = `url(${assets.location})`;
        btn.style.backgroundSize = "24px 24px";
        btn.style.backgroundPosition = "center";
        btn.style.backgroundRepeat = "no-repeat";
        btn.style.width = "36px";
        btn.style.height = "36px";
        btn.style.border = "none";
        btn.style.borderRadius = "8px";
        btn.style.backgroundColor = "white";
        btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
        btn.style.cursor = "pointer";
        btn.style.transition = "background-color 0.2s";

        btn.title = "Recenter to Current Location";
        btn.onmouseover = () => (btn.style.backgroundColor = "#f0f0f0");
        btn.onmouseout = () => (btn.style.backgroundColor = "white");

        btn.onclick = () => {
          if (currentLocation) {
            map.current.flyTo({
              center: [currentLocation.lng, currentLocation.lat],
              zoom: 14,
              speed: 0.8,
              curve: 1,
              easing: (t) => 1 - Math.pow(1 - t, 3),
            });
          } else {
            map.current.flyTo({
              center: [80.02102417951882, 9.67623434671338],
              zoom: 14,
              speed: 0.8,
              curve: 1,
              easing: (t) => 1 - Math.pow(1 - t, 3),
            });
          }
        };

        const container = document.createElement("div");
        container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
        container.style.margin = "10px";
        container.appendChild(btn);
        return container;
      },
      onRemove: () => {},
    };

    map.current.addControl(recenterControl, "bottom-right");
  };

  const fetchRoute = async (from, to) => {
    try {
      console.log(`Fetching route from [${from[0]}, ${from[1]}] to [${to[0]}, ${to[1]}]`);
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}&overview=full`,
        {
          headers: { Accept: "application/json" },
        }
      );
      const response = await query.json();
      console.log("Mapbox Directions API Response in DeliveryMap:", response);

      if (response.code === "Ok" && response.routes && response.routes.length > 0) {
        let geometry = response.routes[0].geometry;
        if (geometry.coordinates && geometry.coordinates.length > 0) {
          const lastPoint = geometry.coordinates[geometry.coordinates.length - 1];
          const dx = to[0] - lastPoint[0];
          const dy = to[1] - lastPoint[1];
          if (dx * dx + dy * dy > 0.0001) {
            geometry.coordinates[geometry.coordinates.length - 1] = to;
          }
        }
        return geometry;
      } else {
        console.error("No valid routes found in response:", response);
        return null;
      }
    } catch (error) {
      console.error("Error fetching route from Mapbox Directions API in DeliveryMap:", error);
      return null;
    }
  };

  const drawRoute = async (from, to) => {
    if (!map.current || !map.current.isStyleLoaded()) {
      console.error("Map not loaded or style not ready in DeliveryMap");
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
    if (!currentLocation?.lng || !currentLocation?.lat) {
      console.warn("Invalid currentLocation in DeliveryMap, using fallback:", currentLocation);
      currentLocation = { lng: 80.02102417951882, lat: 9.67623434671338 }; // Fallback
    }

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [currentLocation.lng, currentLocation.lat],
        zoom: 13,
      });

      map.current.on("load", () => {
        addControls();
        loadMarkers();
      });

      map.current.on("error", (e) => {
        console.error("Mapbox error in DeliveryMap:", e.error);
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [currentLocation]);

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

export default DeliveryMap;