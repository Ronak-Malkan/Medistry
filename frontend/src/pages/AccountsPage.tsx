import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const ROLE_INFO = {
  account_admin: "Full access to account settings, users, and data.",
  app_admin: "Can manage medicines, bills, and daily operations.",
};

function Header({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="w-full bg-white shadow-sm flex items-center justify-between px-6 py-4 border-b border-blue-100 sticky top-0 z-10">
      <span className="text-xl font-extrabold text-teal-700 tracking-tight">
        Medistry
      </span>
      <button
        onClick={onLogout}
        className="bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700 transition"
      >
        Logout
      </button>
    </header>
  );
}

export default function AccountsPage() {
  const { user, logout } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    role: "account_admin",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/accounts", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
      },
    })
      .then((res) => res.json())
      .then(setCompany);
    fetch("/api/users", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []));
  }, [user]);

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      setSuccess("User created!");
      setForm({
        username: "",
        password: "",
        fullName: "",
        email: "",
        role: "account_admin",
      });
      // Refresh users
      const usersRes = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
        },
      });
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);
    } catch (err: any) {
      setError(err.message || "Failed");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={logout} />
      <main className="flex justify-center px-2 sm:px-4">
        <div
          className="w-full"
          style={{
            maxWidth: "900px",
            marginTop: "3rem",
            marginBottom: "3rem",
          }}
        >
          <div
            className="bg-white p-6 md:p-10 sm:rounded-2xl sm:shadow-xl sm:border sm:border-blue-100"
            style={{
              marginTop: "0",
              marginBottom: "0",
              boxSizing: "border-box",
            }}
          >
            <h1 className="text-2xl font-bold mb-6 text-teal-700">
              Account Settings
            </h1>
            {company && (
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div>
                    <span className="font-medium">Name:</span> {company.name}
                  </div>
                  <div>
                    <span className="font-medium">Address:</span>{" "}
                    {company.address}
                  </div>
                  <div>
                    <span className="font-medium">Contact Phone:</span>{" "}
                    {company.contactPhone}
                  </div>
                  <div>
                    <span className="font-medium">Expiry Alert Lead Time:</span>{" "}
                    {company.expiryAlertLeadTime}
                  </div>
                </div>
                <div>
                  <div>
                    <span className="font-medium">License:</span>{" "}
                    {company.drugLicenseNumber}
                  </div>
                  <div>
                    <span className="font-medium">Contact Email:</span>{" "}
                    {company.contactEmail}
                  </div>
                  <div>
                    <span className="font-medium">Low Stock Threshold:</span>{" "}
                    {company.lowStockThreshold}
                  </div>
                </div>
              </div>
            )}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-teal-800 mb-2 flex items-center">
                Users
                <span
                  className="ml-2 text-teal-500 cursor-pointer relative"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  tabIndex={0}
                  aria-label="Role info"
                >
                  ?
                  {showTooltip && (
                    <span className="absolute left-6 top-0 bg-white border border-teal-200 rounded shadow-lg p-2 w-64 text-xs text-gray-700 z-10">
                      <b>Roles:</b>
                      <ul className="mt-1">
                        <li>
                          <b>account_admin</b>: {ROLE_INFO.account_admin}
                        </li>
                        <li>
                          <b>app_admin</b>: {ROLE_INFO.app_admin}
                        </li>
                      </ul>
                    </span>
                  )}
                </span>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border mt-2">
                  <thead>
                    <tr className="bg-teal-50">
                      <th className="p-2 text-left">Username</th>
                      <th className="p-2 text-left">Full Name</th>
                      <th className="p-2 text-left">Email</th>
                      <th className="p-2 text-left">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.userId} className="border-t">
                        <td className="p-2">{u.username}</td>
                        <td className="p-2">{u.fullName}</td>
                        <td className="p-2">{u.email}</td>
                        <td className="p-2">{u.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {user?.role === "account_admin" && (
              <form
                onSubmit={handleAddUser}
                className="bg-teal-50 p-4 rounded-lg border border-teal-100"
              >
                <h3 className="font-semibold mb-2 text-teal-700">Add User</h3>
                {error && <div className="text-red-600 mb-2">{error}</div>}
                {success && (
                  <div className="text-green-700 mb-2">{success}</div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label>
                    <span className="block mb-1">Username</span>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) =>
                        setForm({ ...form, username: e.target.value })
                      }
                      className="w-full border px-2 py-1 rounded"
                      required
                    />
                  </label>
                  <label>
                    <span className="block mb-1">Password</span>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      className="w-full border px-2 py-1 rounded"
                      required
                    />
                  </label>
                  <label>
                    <span className="block mb-1">Full Name</span>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) =>
                        setForm({ ...form, fullName: e.target.value })
                      }
                      className="w-full border px-2 py-1 rounded"
                      required
                    />
                  </label>
                  <label>
                    <span className="block mb-1">Email</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="w-full border px-2 py-1 rounded"
                      required
                    />
                  </label>
                  <label>
                    <span className="block mb-1">Role</span>
                    <select
                      value={form.role}
                      onChange={(e) =>
                        setForm({ ...form, role: e.target.value })
                      }
                      className="w-full border px-2 py-1 rounded"
                    >
                      <option value="account_admin">account_admin</option>
                      <option value="app_admin">app_admin</option>
                    </select>
                  </label>
                </div>
                <button
                  type="submit"
                  className="mt-4 bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 font-semibold"
                >
                  Add User
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
