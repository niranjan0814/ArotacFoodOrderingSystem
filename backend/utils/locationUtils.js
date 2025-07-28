// src/utils/locationUtils.js
import axios from "axios";

export const getCoordinatesNominatim = async (address) => {
    const baseUrl = "https://nominatim.openstreetmap.org/search";
    const params = {
      q: address,
      format: "json",
      limit: 1,
    };
  
    try {
      const response = await axios.get(baseUrl, {
        params,
        headers: {
          "User-Agent": "YourAppName/1.0 (tamildubdowshield29@gmail.com)", // required
        },
      });
  
      const data = response.data;
  
      if (data.length > 0) {
        const { lat, lon } = data[0];
        return { lat, lon };
      } else {
        throw new Error("No location found for the given address.");
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error.message);
      return null;
    }
  }
  

export const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// (async () => {
//     try {
//       const coords = await getCoordinatesNominatim("Manipay, Jaffna, Sri Lanka");
//       console.log("Coordinates:", coords);
//     } catch (error) {
//       console.error("Error:", error.message);
//     }
//   })();