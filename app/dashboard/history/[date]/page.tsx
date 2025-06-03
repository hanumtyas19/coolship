"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import EChartTempPh from "@/components/EChartTempPh";
import { GoogleMap, DirectionsService, DirectionsRenderer, Marker } from "@react-google-maps/api";

interface LogData {
  humidity: number;
  temperature: number;
  location: {
    lat: string;
    lng: string;
  };
  timestamp: any;
}

interface TimeSlot {
  time: string;
  data: LogData[];
}

interface ChartData {
  time: string;
  temperature: number;
  humidity: number;
}

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const mapOptions = {
  mapTypeId: "terrain",
  mapTypeControl: true,
  streetViewControl: true,
  fullscreenControl: true,
  zoomControl: true,
};

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const date = params?.date as string;
  
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: -6.2088, lng: 106.8456 }); // Default to Jakarta
  const [pathCoordinates, setPathCoordinates] = useState<google.maps.LatLngLiteral[]>([]);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [waypoints, setWaypoints] = useState<google.maps.DirectionsWaypoint[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);


  useEffect(() => {
    if (!date) return;

    const fetchDetailData = async () => {
      try {
        console.log("📅 Fetching data for date:", date);
        
        const logsRef = collection(firestore, `tracking_logs/${date}/logs`);
        const logsSnapshot = await getDocs(logsRef);
        
        console.log("🕐 Number of time slots:", logsSnapshot.size);
        
        if (logsSnapshot.empty) {
          setError("No log data available for this date");
          return;
        }

        const timeSlotPromises = logsSnapshot.docs.map(async (timeDoc) => {
          const time = timeDoc.id;
          const timeData = timeDoc.data();
          let logData: LogData[] = [];
          
          if (timeData.humidity !== undefined) {
            logData = [timeData as LogData];
          }
          
          return {
            time,
            data: logData
          };
        });

        const resolvedTimeSlots = await Promise.all(timeSlotPromises);
        const sortedTimeSlots = resolvedTimeSlots.sort((a, b) => a.time.localeCompare(b.time));
        
        // Prepare chart data
        const chartDataPoints: ChartData[] = sortedTimeSlots
          .filter(slot => slot.data.length > 0)
          .map(slot => ({
            time: slot.time,
            temperature: slot.data[0].temperature,
            humidity: slot.data[0].humidity
          }));
        
        // Prepare map coordinates
        const coordinates: google.maps.LatLngLiteral[] = sortedTimeSlots
          .filter(slot => slot.data.length > 0 && slot.data[0].location)
          .map(slot => ({
            lat: parseFloat(slot.data[0].location.lat),
            lng: parseFloat(slot.data[0].location.lng)
          }));

        if (coordinates.length > 0) {
          setMapCenter(coordinates[0]);
          
          // Prepare waypoints for directions
          if (coordinates.length > 2) {
            // If we have more than 2 points, middle points become waypoints
            setWaypoints(
              coordinates.slice(1, -1).map(coord => ({
                location: coord,
                stopover: true
              }))
            );
          }
        }
        
        setPathCoordinates(coordinates);
        setChartData(chartDataPoints);
        setTimeSlots(sortedTimeSlots);
        
      } catch (error: any) {
        console.error("❌ Error fetching detail data:", error);
        setError(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailData();
  }, [date]);

  const directionsCallback = (
    result: google.maps.DirectionsResult | null,
    status: google.maps.DirectionsStatus
  ) => {
    if (result !== null && status === 'OK') {
      setDirections(result);
    } else {
      console.warn('Directions request failed:', status);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "N/A";
    
    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleString('en-US');
      } else if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleString('en-US');
      }
      return timestamp.toString();
    } catch {
      return "Invalid Date";
    }
  };

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = timeSlots.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(timeSlots.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-2"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Shipping Details</h1>
          <p className="text-gray-600 mt-1">Date: {date}</p>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-semibold">Error:</p>
          <p className="text-red-600">{error}</p>
        </div>
      ) : timeSlots.length > 0 ? (
        <div className="space-y-6">
          {/* Chart Section */}
          <div className="bg-white rounded-lg shadow-md border p-6">
            <EChartTempPh data={chartData} />
          </div>

          {/* Map Section */}
          <div className="bg-white rounded-lg shadow-md border p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Tracking Map</h2>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={14}
              options={mapOptions}
            >
              {pathCoordinates.length >= 2 && (
                <DirectionsService
                  options={{
                    destination: pathCoordinates[pathCoordinates.length - 1],
                    origin: pathCoordinates[0],
                    waypoints: waypoints,
                    travelMode: google.maps.TravelMode.DRIVING,
                    optimizeWaypoints: true
                  }}
                  callback={directionsCallback}
                />
              )}
              
              {directions && (
                <DirectionsRenderer
                  options={{
                    directions: directions,
                    markerOptions: {
                      icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 7,
                        fillColor: "#4285F4",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "#FFFFFF",
                      }
                    },
                    suppressMarkers: false,
                    polylineOptions: {
                      strokeColor: "#4285F4",
                      strokeWeight: 5,
                      strokeOpacity: 0.8
                    }
                  }}
                />
              )}

              {/* Fallback to markers if directions fail */}
              {!directions && pathCoordinates.map((coord, index) => (
                <Marker
                  key={index}
                  position={coord}
                  label={{
                    text: (index + 1).toString(),
                    color: "#FFFFFF",
                    fontWeight: "bold"
                  }}
                />
              ))}
            </GoogleMap>
          </div>

          {/* Data Points Section */}
          <div className="bg-white rounded-lg shadow-md border">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Data Points Detail
              </h2>
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, timeSlots.length)} of {timeSlots.length} entries
              </div>
            </div>

            <div className="divide-y divide-gray-100 max-h-[600px] overflow-auto">
              {currentItems.map((slot) => (
                <div key={slot.time} className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    🕐 {slot.time}
                  </h3>
                  
                  {slot.data.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <span className="text-blue-600 font-medium">💧 Humidity</span>
                        <div className="text-2xl font-bold mt-1">{slot.data[0].humidity}%</div>
                      </div>
                      
                      <div className="bg-red-50 rounded-lg p-4">
                        <span className="text-red-600 font-medium">🌡️ Temperature</span>
                        <div className="text-2xl font-bold mt-1">{slot.data[0].temperature}°C</div>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-4">
                        <span className="text-green-600 font-medium">📍 Location</span>
                        <div className="text-sm font-mono mt-1">
                          {slot.data[0].location?.lat && slot.data[0].location?.lng 
                            ? `${slot.data[0].location.lat}, ${slot.data[0].location.lng}`
                            : "N/A"
                          }
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 rounded-lg p-4">
                        <span className="text-purple-600 font-medium">⏰ Time</span>
                        <div className="text-sm font-medium mt-1">
                          {formatTimestamp(slot.data[0].timestamp)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      No data available for this time
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${
                          currentPage === number
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300'
                        }`}
                      >
                        {number}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data Available</h3>
          <p className="text-gray-500">No journey logs found for date {date}</p>
        </div>
      )}
    </div>
  );
}