import React from "react";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { logout, user } = useAuth();
  return (
    <div className="max-w-2xl mx-auto mt-16 p-6 bg-white shadow rounded text-center">
      <h1 className="text-2xl font-bold mb-4">Welcome to Medistry Dashboard</h1>
      {user && (
        <div className="mb-4 text-gray-700">
          <div>
            <b>User ID:</b> {user.userId}
          </div>
          <div>
            <b>Account ID:</b> {user.accountId}
          </div>
          <div>
            <b>Role:</b> {user.role}
          </div>
        </div>
      )}
      <button
        onClick={logout}
        className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Log out
      </button>
    </div>
  );
}
