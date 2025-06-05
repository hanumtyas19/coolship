"use client";
import { LoadScript } from "@react-google-maps/api";

export default function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  return (
      <LoadScript googleMapsApiKey="AIzaSyB3csBUDnxM-oYSH0t-kRxiBuX5SuPdvrU">
      {children}
    </LoadScript>
  );
}
