import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-green-100">
      <div className="max-w-xl w-full p-10 bg-white rounded-2xl shadow-2xl border border-blue-100 text-center">
        <h1 className="text-4xl font-extrabold text-teal-700 mb-4 tracking-tight">
          Medistry
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          The modern, multi-tenant pharmacy management system. <br />
          <span className="text-teal-600 font-semibold">
            Inventory, billing, compliance, and more—simplified.
          </span>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/signup"
            className="bg-teal-600 text-white px-8 py-3 rounded-lg font-semibold text-lg shadow hover:bg-teal-700 transition"
          >
            Sign Up
          </Link>
          <Link
            to="/login"
            className="bg-white border border-teal-600 text-teal-700 px-8 py-3 rounded-lg font-semibold text-lg shadow hover:bg-teal-50 transition"
          >
            Log In
          </Link>
        </div>
        <div className="mt-8 text-sm text-gray-500">
          <span>Medistry &copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  );
}
