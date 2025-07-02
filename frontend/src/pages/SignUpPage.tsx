import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const initialAdmin = {
  username: "",
  password: "",
  fullName: "",
  email: "",
};
const initialCompany = {
  name: "",
  drugLicenseNumber: "",
  address: "",
  contactEmail: "",
  contactPhone: "",
  lowStockThreshold: "",
  expiryAlertLeadTime: "",
};

function parseJwt(token: string) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}

const steps = ["Admin Info", "Company Info", "Contact & Settings"];

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [admin, setAdmin] = useState(initialAdmin);
  const [company, setCompany] = useState(initialCompany);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  function handleAdminChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAdmin({ ...admin, [e.target.name]: e.target.value });
  }
  function handleCompanyChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCompany({ ...company, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        company: {
          ...company,
          lowStockThreshold: company.lowStockThreshold
            ? Number(company.lowStockThreshold)
            : undefined,
          expiryAlertLeadTime: company.expiryAlertLeadTime
            ? Number(company.expiryAlertLeadTime)
            : undefined,
        },
        admin,
      };
      const res = await fetch("/auth/company/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok)
        throw new Error((await res.json()).message || "Sign up failed");
      const { token } = await res.json();
      await login(token);
      const { role } = parseJwt(token);
      if (role === "account_admin") {
        navigate("/accounts");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-green-100">
      <div className="w-full max-w-lg p-0 sm:p-8">
        <div
          className={`bg-white ${
            window.innerWidth < 640
              ? ""
              : "rounded-2xl shadow-2xl border border-blue-100"
          } p-6 sm:p-8 w-full`}
          style={{ marginTop: 0, marginBottom: 0 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-teal-700">Sign Up</h1>
            <Link to="/" className="text-teal-600 hover:underline text-sm">
              Back to Home
            </Link>
          </div>
          <div className="flex items-center justify-between mb-8">
            {steps.map((label, idx) => (
              <div key={label} className="flex-1 flex flex-col items-center">
                <div
                  className={`rounded-full w-8 h-8 flex items-center justify-center font-bold text-white ${
                    step === idx + 1 ? "bg-teal-600" : "bg-teal-300"
                  }`}
                >
                  {idx + 1}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    step === idx + 1 ? "text-teal-700" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
          <form
            onSubmit={
              step === 1
                ? (e) => {
                    e.preventDefault();
                    setStep(2);
                  }
                : step === 2
                ? (e) => {
                    e.preventDefault();
                    setStep(3);
                  }
                : handleSubmit
            }
          >
            {step === 1 && (
              <div className="animate-fade-in">
                <h2 className="text-lg font-semibold mb-4 text-teal-800">
                  Admin User Info
                </h2>
                <label className="block mb-3">
                  <span className="block mb-1">Username</span>
                  <input
                    name="username"
                    value={admin.username}
                    onChange={handleAdminChange}
                    className="w-full border px-3 py-2 rounded bg-teal-50"
                    required
                    autoFocus
                  />
                </label>
                <label className="block mb-3">
                  <span className="block mb-1">Password</span>
                  <input
                    name="password"
                    type="password"
                    value={admin.password}
                    onChange={handleAdminChange}
                    className="w-full border px-3 py-2 rounded bg-teal-50"
                    required
                  />
                </label>
                <label className="block mb-3">
                  <span className="block mb-1">Full Name</span>
                  <input
                    name="fullName"
                    value={admin.fullName}
                    onChange={handleAdminChange}
                    className="w-full border px-3 py-2 rounded bg-teal-50"
                    required
                  />
                </label>
                <label className="block mb-6">
                  <span className="block mb-1">Email</span>
                  <input
                    name="email"
                    type="email"
                    value={admin.email}
                    onChange={handleAdminChange}
                    className="w-full border px-3 py-2 rounded bg-teal-50"
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="w-full bg-teal-600 text-white py-2 rounded font-semibold hover:bg-teal-700 transition"
                >
                  Next
                </button>
              </div>
            )}
            {step === 2 && (
              <div className="animate-fade-in">
                <h2 className="text-lg font-semibold mb-4 text-teal-800">
                  Company Info
                </h2>
                <label className="block mb-3">
                  <span className="block mb-1">Company Name</span>
                  <input
                    name="name"
                    value={company.name}
                    onChange={handleCompanyChange}
                    className="w-full border px-3 py-2 rounded bg-teal-50"
                    required
                    autoFocus
                  />
                </label>
                <label className="block mb-3">
                  <span className="block mb-1">Drug License Number</span>
                  <input
                    name="drugLicenseNumber"
                    value={company.drugLicenseNumber}
                    onChange={handleCompanyChange}
                    className="w-full border px-3 py-2 rounded bg-teal-50"
                    required
                  />
                </label>
                <label className="block mb-6">
                  <span className="block mb-1">Address</span>
                  <input
                    name="address"
                    value={company.address}
                    onChange={handleCompanyChange}
                    className="w-full border px-3 py-2 rounded bg-teal-50"
                    required
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-white border border-teal-600 text-teal-700 py-2 rounded font-semibold hover:bg-teal-50 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-teal-600 text-white py-2 rounded font-semibold hover:bg-teal-700 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="animate-fade-in">
                <h2 className="text-lg font-semibold mb-4 text-teal-800">
                  Contact & Settings
                </h2>
                <label className="block mb-3">
                  <span className="block mb-1">Contact Email</span>
                  <input
                    name="contactEmail"
                    type="email"
                    value={company.contactEmail}
                    onChange={handleCompanyChange}
                    className="w-full border px-3 py-2 rounded bg-teal-50"
                    required
                  />
                </label>
                <label className="block mb-3">
                  <span className="block mb-1">Contact Phone</span>
                  <input
                    name="contactPhone"
                    value={company.contactPhone}
                    onChange={handleCompanyChange}
                    className="w-full border px-3 py-2 rounded bg-teal-50"
                    required
                  />
                </label>
                <label className="block mb-3">
                  <span className="block mb-1">
                    Low Stock Threshold{" "}
                    <span className="text-gray-400">(optional)</span>
                  </span>
                  <input
                    name="lowStockThreshold"
                    type="number"
                    min="0"
                    value={company.lowStockThreshold}
                    onChange={handleCompanyChange}
                    className="w-full border px-3 py-2 rounded bg-teal-50"
                  />
                </label>
                <label className="block mb-6">
                  <span className="block mb-1">
                    Expiry Alert Lead Time{" "}
                    <span className="text-gray-400">(optional, days)</span>
                  </span>
                  <input
                    name="expiryAlertLeadTime"
                    type="number"
                    min="0"
                    value={company.expiryAlertLeadTime}
                    onChange={handleCompanyChange}
                    className="w-full border px-3 py-2 rounded bg-teal-50"
                  />
                </label>
                {error && <div className="text-red-600 mb-4">{error}</div>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 bg-white border border-teal-600 text-teal-700 py-2 rounded font-semibold hover:bg-teal-50 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-teal-600 text-white py-2 rounded font-semibold hover:bg-teal-700 transition"
                    disabled={loading}
                    aria-busy={loading}
                  >
                    {loading ? "Signing up..." : "Sign Up"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
