import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingNav, setPendingNav] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  function parseJwt(token: string) {
    try {
      const [, payload] = token.split(".");
      return JSON.parse(atob(payload));
    } catch {
      return {};
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const { token } = await res.json();
      console.log("Token", token);
      await login(token);
      console.log("Navigating to accounts");
      setPendingNav(true);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log("Pending nav", pendingNav);
    console.log("User", user);
    if (pendingNav && user) {
      if (user.role === "account_admin") {
        navigate("/accounts");
      } else {
        navigate("/dashboard");
      }
      setPendingNav(false);
    }
  }, [pendingNav, user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-green-100">
      <form
        onSubmit={handleSubmit}
        className="max-w-sm w-full mx-auto p-8 bg-white shadow-2xl rounded-xl border border-blue-100"
        aria-label="Login form"
      >
        <h1 className="text-3xl font-extrabold mb-6 text-center text-teal-700 tracking-tight">
          Medistry Login
        </h1>
        {error && (
          <div
            className="text-red-600 mb-4 p-2 bg-red-50 border border-red-200 rounded"
            role="alert"
          >
            {error}
          </div>
        )}
        <label className="block mb-4">
          <span className="block mb-1 font-medium text-teal-800">Username</span>
          <input
            ref={usernameRef}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-teal-400 focus:outline-none bg-teal-50"
            autoComplete="username"
            aria-required="true"
          />
        </label>
        <label className="block mb-6">
          <span className="block mb-1 font-medium text-teal-800">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-teal-400 focus:outline-none bg-teal-50"
            autoComplete="current-password"
            aria-required="true"
          />
        </label>
        <button
          type="submit"
          className="w-full bg-teal-600 text-white py-2 rounded font-semibold hover:bg-teal-700 transition disabled:opacity-60 flex items-center justify-center shadow-md"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 mr-2 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
          ) : null}
          {loading ? "Logging in..." : "Log in"}
        </button>
        <div className="flex justify-between mt-6 text-sm text-teal-700">
          <Link to="/signup" className="hover:underline">
            Sign Up
          </Link>
          <Link to="/" className="hover:underline">
            Back to Home
          </Link>
        </div>
      </form>
    </div>
  );
}
