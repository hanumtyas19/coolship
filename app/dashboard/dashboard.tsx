"use client";
import { useEffect, useState } from "react";
import { database } from "../../lib/firebase";
import { ref, onValue } from "firebase/database";
import { Card } from "@/components/ui/card";
import { ThermometerSnowflake, ThermometerSun, Droplet } from "lucide-react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";
import EChartTempPh from "@/components/EChartTempPh";
import { requestPermissionAndGetToken, setupForegroundNotifications } from "@/lib/firebase-messaging";


// Gaya default untuk ukuran map
const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

// Titik tengah map kalau belum ada data lokasi
const defaultCenter = {
  lat: -7.6079,
  lng: 111.9054,
};

// Dummy data untuk koordinat rute (buat testing visual map aja)
const dummyRouteCoordinates = [
  { lat: -7.610910180570211, lng: 111.51765202402059 },
  { lat: -7.629648883407044, lng: 111.54267573928108 },
  { lat: -7.755177511805382, lng: 111.52540624902066 },
];

interface SensorData {
  humidity: number | null;
  temperature_ds18b20: number | null;
  latitude: number | null;
  longitude: number | null;
}

// Dummy data generator untuk chart
const generateDummyChartData = () => {
  const now = new Date();
  return {
    time: now.toLocaleTimeString(),
    temperature: Math.floor(Math.random() * 10 - 18), // antara -18 s.d -9
    humidity: +(Math.random() * (7.5 - 5.5) + 5.5).toFixed(2), // antara 5.5 s.d 7.5
  };
};

export default function Home() {
  const [sensorData, setSensorData] = useState<SensorData>({
    humidity: null,
    temperature_ds18b20: null,
    latitude: null,
    longitude: null,
  });

  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);

  const {
    temperature_ds18b20: temperature,
    humidity,
    latitude,
    longitude,
  } = sensorData;

  const isOptimalTemp =
    temperature !== null && temperature <= -9 && temperature >= -18;
  const isOptimalHumidity =
    humidity !== null && humidity >= 75 && humidity <= 90;

  const temperatureIcon = isOptimalTemp ? (
    <ThermometerSnowflake
      size={22}
      className="absolute top-2 left-3 text-gray-700"
    />
  ) : (
    <ThermometerSun size={22} className="absolute top-2 left-3 text-red-500" />
  );

  const temperatureTextClass = isOptimalTemp
    ? "text-5xl font-digital text-black text-center tracking-wider"
    : "text-5xl font-digital text-red-500 text-center tracking-wider";

  const humidityIcon = isOptimalHumidity ? (
    <Droplet size={22} className="absolute top-2 left-3 text-gray-700" />
  ) : (
    <Droplet size={22} className="absolute top-2 left-3 text-red-500" />
  );

  const humidityTextClass = isOptimalHumidity
    ? "text-5xl font-digital text-black text-center tracking-wider"
    : "text-5xl font-digital text-red-500 text-center tracking-wider";

  const hasValidCoordinates =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !isNaN(latitude) &&
    !isNaN(longitude);

  useEffect(() => {
    const dataRef = ref(database, "sensor_data");
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSensorData({
          humidity: parseFloat(data.humidity) || null,
          temperature_ds18b20: parseFloat(data.temperature_ds18b20) || null,
          latitude: parseFloat(data.latitude) || null,
          longitude: parseFloat(data.longitude) || null,
        });
      }
    });

    return () => unsubscribe();
  }, []);
  useEffect(() => {
    const setupNotifications = async () => {
      if (!('serviceWorker' in navigator) || !('Notification' in window)) {
        console.error("Service Worker or Notifications not supported");
        return;
      }
  
      try {
        // Check if we already have permission
        if (Notification.permission === 'default') {
          console.log("Requesting notification permission");
          const permission = await Notification.requestPermission();
          console.log("Permission result:", permission);
        }
  
        // Register service worker if it's not registered
        let swRegistration;
        const registrations = await navigator.serviceWorker.getRegistrations();
        const existingSW = registrations.find(reg => 
          reg.active && reg.active.scriptURL.includes('firebase-messaging-sw.js')
        );
        
        if (existingSW) {
          console.log("Service Worker already registered");
          swRegistration = existingSW;
        } else {
          console.log("Registering Service Worker");
          swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/'
          });
          console.log("Service Worker registered:", swRegistration);
        }
  
        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        
        // Get FCM token and save to database
        const token = await requestPermissionAndGetToken();
        if (token) {
          console.log("FCM token obtained and saved");
        }
        
        // Setup handling for foreground notifications
        setupForegroundNotifications();
        
      } catch (err) {
        console.error("Error setting up notifications:", err);
      }
    };
  
    setupNotifications();
    
    // Cleanup function
    return () => {
      // Any cleanup code needed
    };
  }, []);

  const handleMapLoad = () => {
    if (typeof google !== "undefined" && dummyRouteCoordinates.length >= 2) {
      const waypoints = dummyRouteCoordinates.slice(1, -1).map((coord) => ({
        location: coord,
        stopover: true,
      }));

      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: dummyRouteCoordinates[0],
          destination: dummyRouteCoordinates[dummyRouteCoordinates.length - 1],
          waypoints: waypoints,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK") {
            setDirections(result);
          } else {
            console.error("Directions request failed:", result);
          }
        }
      );
    }
  };

  // CHART STATE & UPDATE PER DETIK
  const [chartData, setChartData] = useState(() => {
    return Array.from({ length: 10 }, () => generateDummyChartData());
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData((prev) => {
        const newData = [...prev.slice(-19), generateDummyChartData()];
        return newData;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center p-6 gap-6 font-sans">
      <h1 className="text-2xl font-bold text-black">Welcome to CoolShip</h1>

      <Card className="rounded-[30px] shadow-lg px-8 py-4 flex flex-col items-center gap-4 bg-white">
        <p className="text-md font-semibold text-blue-600">
          {(temperature !== null && temperature > -9) ||
          (humidity !== null && (humidity < 75 || humidity > 90))
            ? "Warning: Check Env Conditions!"
            : "Overall is Good!"}
        </p>

        <div className="flex gap-4 items-center">
          <div className="relative bg-[#DCDCDC] rounded-[20px] w-[263px] h-[129px] flex flex-col justify-center px-4">
            {temperatureIcon}
            <span className={temperatureTextClass}>
              {temperature !== null ? temperature : "-"}°C
            </span>
          </div>

          <div className="relative bg-[#DCDCDC] rounded-[20px] w-[263px] h-[129px] flex flex-col justify-center px-4">
            {humidityIcon}
            <span className={humidityTextClass}>
              {humidity !== null ? humidity : "-"}%
            </span>
          </div>
        </div>
      </Card>

      {/* CHART SECTION */}
      <Card className="rounded-[30px] shadow-lg px-6 py-4 w-full max-w-4xl bg-white">
        <p className="text-center text-md font-semibold text-blue-600 mb-4">
          Temperature & Humidity Chart
        </p>
        <EChartTempPh data={chartData} />
      </Card>

      {/* MAP SECTION */}
      <Card className="rounded-[30px] shadow-lg px-6 py-4 w-full max-w-4xl bg-white">
        <p className="text-center text-md font-semibold text-blue-600">
          Real-time Location Map
        </p>

        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={
            hasValidCoordinates
              ? { lat: latitude!, lng: longitude! }
              : defaultCenter
          }
          zoom={12}
          onLoad={handleMapLoad}
          options={{
            gestureHandling: "greedy",
            zoomControl: true,
            scrollwheel: true,
            draggable: true,
            disableDefaultUI: false,
          }}
        >
          <Marker
            position={
              hasValidCoordinates
                ? { lat: latitude!, lng: longitude! }
                : defaultCenter
            }
          />
          {directions && <DirectionsRenderer directions={directions} />}
        </GoogleMap>
      </Card>
    </div>
  );
}
