import type { Metadata } from "next";
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
      </body>
    </html>
  );
}
