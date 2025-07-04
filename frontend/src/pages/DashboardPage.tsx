import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

interface StatCardProps {
  title: string;
  value: number | string;
  color: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, color, icon }: StatCardProps) {
  return (
    <div
      className={`flex flex-col items-center bg-white rounded-xl shadow-md border border-blue-100 p-6 w-full sm:w-64 mb-4 sm:mb-0`}
    >
      <div className={`mb-2 text-3xl`} style={{ color }}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-teal-700 mb-1">{value}</div>
      <div className="text-sm text-gray-500 font-medium">{title}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    medicines: 0,
    bills: 0,
    lowStock: 0,
    expiringSoon: 0,
  });
  const [loading, setLoading] = useState(true);
  console.log("DashboardPage");
  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const [medicinesRes, billsRes, lowStockRes, expiringRes] =
          await Promise.all([
            fetch("/api/medicines/stats", {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
              },
            }),
            fetch("/api/bills/stats", {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
              },
            }),
            fetch("/api/medicines/low-stock", {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
              },
            }),
            fetch("/api/medicines/expiring-soon", {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
              },
            }),
          ]);
        const medicines = (await medicinesRes.json()).count || 0;
        const bills = (await billsRes.json()).count || 0;
        const lowStock = (await lowStockRes.json()).count || 0;
        const expiringSoon = (await expiringRes.json()).count || 0;
        setStats({ medicines, bills, lowStock, expiringSoon });
      } catch {
        setStats({ medicines: 0, bills: 0, lowStock: 0, expiringSoon: 0 });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Friendlier welcome message
  let welcomeText = "Welcome!";
  if (user?.fullName) welcomeText = `Welcome, ${user.fullName}!`;
  else if (user?.username) welcomeText = `Welcome, ${user.username}!`;
  else if (user?.role === "account_admin")
    welcomeText = "Welcome, Account Admin!";
  else if (user?.role === "app_admin") welcomeText = "Welcome, App Admin!";

  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 overflow-x-hidden">
        <h1 className="text-3xl font-extrabold mb-2 text-teal-700 tracking-tight">
          Dashboard
        </h1>
        <div className="mb-6 text-lg sm:text-xl font-semibold text-teal-800">
          {welcomeText}
        </div>
        <div className="flex flex-wrap justify-between gap-4 sm:gap-6 mb-8">
          <StatCard
            title="Total Medicines"
            value={loading ? "-" : stats.medicines}
            color="#0d9488"
            icon={
              <span role="img" aria-label="medicine">
                💊
              </span>
            }
          />
          <StatCard
            title="Total Bills"
            value={loading ? "-" : stats.bills}
            color="#2563eb"
            icon={
              <span role="img" aria-label="bill">
                🧾
              </span>
            }
          />
          <StatCard
            title="Low Stock"
            value={loading ? "-" : stats.lowStock}
            color="#f59e42"
            icon={
              <span role="img" aria-label="low stock">
                ⚠️
              </span>
            }
          />
          <StatCard
            title="Expiring Soon"
            value={loading ? "-" : stats.expiringSoon}
            color="#e11d48"
            icon={
              <span role="img" aria-label="expiring">
                ⏰
              </span>
            }
          />
        </div>
      </div>
    </div>
  );
}
