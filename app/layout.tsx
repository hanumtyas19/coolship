import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner"
import "./globals.css";

export const metadata: Metadata = {
  title: "CoolShip",
    description: "CoolShip is a platform for monitoring coolship systems.",
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
        {children}
        <Toaster position="top-right" richColors/>
      </body>
    </html>
  );
}
