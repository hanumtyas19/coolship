"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import Link from "next/link";
import { IconCalendarStats } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Create a custom theme to match your app's design
const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb', // blue-600
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '0.5rem',
            backgroundColor: 'white',
          },
        },
      },
    },
  },
});

export default function HistoryPage() {
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // State for date filtering
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const ref = collection(firestore, "tracking_logs");
        console.log("Fetching collection from:", ref.path);

        const snapshot = await getDocs(ref);
        console.log("Number of documents in tracking_logs:", snapshot.size);
        console.log("All document IDs:", snapshot.docs.map(doc => doc.id));

        if (snapshot.empty) {
          console.warn("tracking_logs collection is empty");
        }

        const fetchedDates = snapshot.docs.map((doc) => {
          console.log("Processing Document ID:", doc.id);
          return doc.id;
        });
        console.log("Final fetched dates:", fetchedDates);
        setDates(fetchedDates);
      } catch (error) {
        console.error("Failed to fetch data from Firestore:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDates();
  }, []);

  // Sort based on sortOrder
  const sortedDates = [...dates].sort((a, b) => {
    try {
      const dateA = new Date(a);
      const dateB = new Date(b);
      
      // Check if dates are valid
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        console.error("Invalid date found:", { a, b, dateA, dateB });
        return 0;
      }

      console.log("Comparing dates:", {
        a: a,
        b: b,
        dateA: dateA.toISOString(),
        dateB: dateB.toISOString()
      });

      if (sortOrder === "desc") {
        return dateB.getTime() - dateA.getTime();
      } else {
        return dateA.getTime() - dateB.getTime();
      }
    } catch (error) {
      console.error("Error processing dates:", error, { a, b });
      return 0;
    }
  });
  
  console.log("Sorted dates:", sortedDates);

  // Filter by date range if available
  let filteredDates = sortedDates;
  if (startDate && endDate) {
    filteredDates = sortedDates.filter((dateStr) => {
      const current = new Date(dateStr).getTime();
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      console.log("Checking date:", dateStr);
      console.log("Current timestamp:", current);
      console.log("Start timestamp:", startDate.getTime());
      console.log("End timestamp:", end.getTime());
      console.log("Is within range:", current >= startDate.getTime() && current <= end.getTime());
      return current >= startDate.getTime() && current <= end.getTime();
    });
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header: Title + Sort + Date Filter */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-blue-600">
            Shipment History
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <div className="flex items-center gap-4">
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(date) => setStartDate(date)}
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { width: '180px' }
                    }
                  }}
                  maxDate={endDate || undefined}
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(date) => setEndDate(date)}
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { width: '180px' }
                    }
                  }}
                  minDate={startDate || undefined}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStartDate(null);
                    setEndDate(null);
                  }}
                  size="icon"
                  className="h-9 w-9"
                >
                  ×
                </Button>
              </div>
            </LocalizationProvider>
          </ThemeProvider>
        </div>
      </div>

      {/* Card Container */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div
              className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full"
              role="status"
              aria-label="loading"
            >
              <span className="sr-only">Loading...</span>
            </div>
            <div className="text-gray-500 font-medium">Loading data...</div>
          </div>
        ) : filteredDates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredDates.map((date, index) => (
              <div
                key={date}
                className="relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="absolute -top-3 -left-3 bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-sm">
                  {index + 1}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <IconCalendarStats className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-800">
                        {new Date(date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </h3>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/history/${date}`}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all duration-200 hover:shadow-md group-hover:shadow-blue-100"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="text-gray-400 mb-3">
              <IconCalendarStats className="w-12 h-12" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No data available
            </h3>
            <p className="text-gray-500 text-center">
              {startDate && endDate
                ? "No history found in the selected date range."
                : "No travel history has been recorded in the system yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
