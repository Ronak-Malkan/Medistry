import React from "react";
import Navigation from "./Navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen md:max-h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      {/* Navigation (sidebar on desktop, topbar/drawer on mobile) */}
      <Navigation />
      {/* Main content */}
      <main className="box-border flex-1 w-full max-w-full px-2 sm:px-6 py-6 mx-auto bg-gradient-to-br from-teal-50 via-blue-50 to-green-100 flex flex-col md:max-h-screen overflow-hidden md:flex-1">
        {children}
      </main>
    </div>
  );
}
