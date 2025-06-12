"use client";
import { LoadScript } from "@react-google-maps/api";

export default function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  return (
      <LoadScript googleMapsApiKey="AIzaSyD99NAMbCKGNenHQgv3TMEWuAG2arKEBy8">
      {children}
    </LoadScript>
  );
}
