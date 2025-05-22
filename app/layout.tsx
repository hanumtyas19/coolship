import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner"
import "./globals.css";
import { LoadScript } from "@react-google-maps/api";
import GoogleMapsProvider from "@/components/GoogleMapsProvider";

export const metadata: Metadata = {
  title: "CoolShip",
    description: "CoolShip is a platform for monitoring coolship systems.",
    icons:"/logo.svg"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      >
        <GoogleMapsProvider>
          {children}
        </GoogleMapsProvider>
        <Toaster position="top-right" richColors/>
      </body>
    </html>
  );
}
