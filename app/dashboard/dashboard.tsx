"use client";
import { useEffect, useState } from "react";
import { database, firestore } from "../../lib/firebase";
import { ref, onValue, update as rtdbUpdate } from "firebase/database";
import { collection, query, orderBy, onSnapshot, DocumentData } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThermometerSnowflake, ThermometerSun, Droplet } from "lucide-react";
import {
  GoogleMap,
  Marker,
  Polyline,
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

interface SensorData {
  humidity: number | null;
  temperature_ds18b20: number | null;
  latitude: number | null;
  longitude: number | null;
}

export default function Home() {
  // --- existing states ---
  const [sensorData, setSensorData] = useState<SensorData>({
    humidity: null,
    temperature_ds18b20: null,
    latitude: null,
    longitude: null,
  });
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [chartData, setChartData] = useState<{ time: string; temperature: number; humidity: number }[]>([]);

  // --- new tracking states ---
  const [tracking, setTracking] = useState<boolean>(false);
  const [routeCoords, setRouteCoords] = useState<{ lat: number; lng: number }[]>([]);

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

  // helper for fallback center
  const hasValidCoordinates =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !isNaN(latitude) &&
    !isNaN(longitude);

  // ------------------------
  // 1. RTDB: sensor_data listener
  // ------------------------
  useEffect(() => {
    const dataRef = ref(database, "sensor_data");
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = {
          humidity: parseFloat(data.humidity) || null,
          temperature_ds18b20: parseFloat(data.temperature_ds18b20) || null,
          latitude: parseFloat(data.latitude) || null,
          longitude: parseFloat(data.longitude) || null,
        };
        setSensorData(parsed);

        // chart update
        if (parsed.humidity !== null && parsed.temperature_ds18b20 !== null) {
          setChartData((prev) => {
            const time = new Date().toLocaleTimeString();
            const newEntry = {
              time,
              temperature: parsed.temperature_ds18b20!,
              humidity: parsed.humidity!,
            };
            return [...prev.slice(-19), newEntry];
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // ------------------------
  // 2. Notifications setup
  // ------------------------
  useEffect(() => {
    const setupNotifications = async () => {
      if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
      try {
        if (Notification.permission === "default") {
          await Notification.requestPermission();
        }

        const regs = await navigator.serviceWorker.getRegistrations();
        let swReg = regs.find((r) =>
          r.active?.scriptURL.includes("firebase-messaging-sw.js")
        );
        if (!swReg) {
          swReg = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js",
            { scope: "/" }
          );
        }
        await navigator.serviceWorker.ready;
        await requestPermissionAndGetToken();
        setupForegroundNotifications();
      } catch (err) {
        console.error("Error setting up notifications:", err);
      }
    };
    setupNotifications();
  }, []);

  // ------------------------
  // 3. RTDB: track/status listener
  // ------------------------
  useEffect(() => {
    const unsub = onValue(ref(database, "track/status"), (snap) => {
      const s = snap.val() as boolean;
      setTracking(s);
      if (!s) {
        // clear route when stopped
        setRouteCoords([]);
      }
    });
    return () => unsub();
  }, []);

  // ------------------------
  // 4. Firestore: subscribe entries when tracking
  // ------------------------
  useEffect(() => {
    if (!tracking) return;
    const today = new Date().toISOString().split("T")[0];
    const entriesCol = collection(firestore, "tracking_logs", today, "entries");
    const q = query(entriesCol, orderBy("timestamp", "asc"));
    const unsubFs = onSnapshot(q, (snap) => {
      const coords: { lat: number; lng: number }[] = [];
      snap.forEach((doc) => {
        const d = doc.data() as DocumentData;
        coords.push({ lat: d.location.lat, lng: d.location.lng });
      });
      setRouteCoords(coords);
    });
    return () => unsubFs();
  }, [tracking]);

  // ------------------------
  // 5. Handlers: start & stop
  // ------------------------
  const handleStart = () =>
    rtdbUpdate(ref(database, "track"), { status: true });
  const handleStop = () =>
    rtdbUpdate(ref(database, "track"), { status: false });

  // ------------------------
  // 6. Map center logic
  // ------------------------
  const mapCenter = hasValidCoordinates 
    ? { lat: latitude!, lng: longitude! }
    : routeCoords.length 
      ? routeCoords[routeCoords.length - 1]
      : defaultCenter;

  // ------------------------
  // Render
  // ------------------------
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

  return (
    <div className="min-h-screen flex flex-col items-center p-6 gap-6 font-sans">
      <h1 className="text-2xl font-bold text-black">Welcome to CoolShip</h1>

      {/* Environment Card */}
      <Card className="rounded-[30px] shadow-lg px-8 py-4 flex flex-col items-center gap-4 bg-white">
        <p className="text-md font-semibold text-blue-600">
          {(!isOptimalTemp || !isOptimalHumidity)
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

      {/* Chart Section */}
      <Card className="rounded-[30px] shadow-lg px-6 py-4 w-full max-w-4xl bg-white">
        <p className="text-center text-md font-semibold text-blue-600 mb-4">
          Temperature & Humidity Chart
        </p>
        <EChartTempPh data={chartData} />
      </Card>

      {/* Map & Tracking Section */}
      <Card className="rounded-[30px] shadow-lg px-6 py-4 w-full max-w-4xl bg-white">
        <p className="text-center text-md font-semibold text-blue-600 mb-4">
          Real-time Location Map
        </p>

        {/* Start / Stop Buttons */}
        <div className="flex gap-2 justify-center mb-4">
          <Button 
            onClick={handleStart} 
            className="hover:scale-105 transition-transform duration-200 cursor-pointer bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:shadow-lg" 
            disabled={tracking}
          >
            Start 
          </Button>
          <Button 
            onClick={handleStop} 
            className="hover:scale-105 transition-transform duration-200 cursor-pointer bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:shadow-lg" 
            disabled={!tracking} 
            variant="destructive"
          >
            End
          </Button>
        </div>

        {/* Google Map */}
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={15}
          options={{
            gestureHandling: "greedy",
            zoomControl: true,
            scrollwheel: true,
            draggable: true,
            disableDefaultUI: false,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
          }}
        >
          {/* Current Position Marker */}
          {hasValidCoordinates && (
            <Marker
              position={{ lat: latitude!, lng: longitude! }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#2563eb",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#FFFFFF",
              }}
              title="Current Location"
            />
          )}

          {/* Route History */}
          {routeCoords.length > 1 && (
            <>
              {/* Route Line */}
              <Polyline
                path={routeCoords}
                options={{
                  strokeColor: "#2563eb",
                  strokeOpacity: 0.8,
                  strokeWeight: 3,
                }}
              />
              
              {/* Start Point */}
              <Marker
                position={routeCoords[0]}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 7,
                  fillColor: "#22c55e",
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: "#FFFFFF",
                }}
                title="Start Point"
              />
              
              {/* End Point */}
              <Marker
                position={routeCoords[routeCoords.length - 1]}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 7,
                  fillColor: "#ef4444",
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: "#FFFFFF",
                }}
                title="Last Tracked Point"
              />
            </>
          )}
        </GoogleMap>
      </Card>
    </div>
  );
}
