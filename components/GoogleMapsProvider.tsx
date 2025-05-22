"use client";
import { LoadScript } from "@react-google-maps/api";

export default function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  return (
    <LoadScript googleMapsApiKey="AIzaSyCPcc7NZeArZrA2X79nClEcYyv-hGY4iC8">
      {children}
    </LoadScript>
  );
}
