import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, loginAs: "user" }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const { token } = await res.json();
      login(token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-sm mx-auto mt-20 p-6 bg-white shadow rounded"
    >
      <h1 className="text-2xl mb-4">Login</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <label className="block mb-2">
        Username
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border px-2 py-1 rounded focus:ring"
        />
      </label>
      <label className="block mb-4">
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border px-2 py-1 rounded focus:ring"
        />
      </label>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Log in
      </button>
    </form>
  );
}
