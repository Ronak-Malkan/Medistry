import React from "react";
import Navigation from "./Navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      {/* Navigation (sidebar on desktop, topbar/drawer on mobile) */}
      <Navigation />
      {/* Main content */}
      <main className="flex-1 w-full max-w-full px-2 sm:px-6 py-6 mx-auto  bg-gradient-to-br from-teal-50 via-blue-50 to-green-100">
        {children}
      </main>
    </div>
  );
}
