import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// 1. Remove navLinks and links logic.
// 2. Hardcode the sidebar and drawer structure as per the finalized sidebar:
//    - Dashboard (standalone)
//    - Master (collapsible) with Medicines, Patients, Customers, Providers, Contents
//    - Inventory (standalone)
//    - Invoices (Purchase Invoice, Sales Invoice)
// 3. Remove Accounts and Users from the sidebar.
// 4. Do not alter sidebar visibility logic for Accounts page.
// 5. Match the current theme and UI/UX.
const sidebarLinks = [
  {
    to: "/dashboard",
    label: "Dashboard",
    roles: ["account_admin", "app_admin"],
  },
  {
    to: "/medicines",
    label: "Medicines",
    roles: ["account_admin", "app_admin"],
  },
  { to: "/contents", label: "Contents", roles: ["account_admin", "app_admin"] },
  { to: "/patients", label: "Patients", roles: ["account_admin", "app_admin"] },
  {
    to: "/customers",
    label: "Customers",
    roles: ["account_admin", "app_admin"],
  },
  {
    to: "/providers",
    label: "Providers",
    roles: ["account_admin", "app_admin"],
  },
  {
    to: "/inventory",
    label: "Inventory",
    roles: ["account_admin", "app_admin"],
  },
  {
    to: "/purchase-invoices",
    label: "Purchase Invoices",
    roles: ["account_admin", "app_admin"],
  },
  {
    to: "/sales-invoices",
    label: "Sales Invoices",
    roles: ["account_admin", "app_admin"],
  },
];

export default function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [masterDrawerOpen, setMasterDrawerOpen] = useState(false);
  const [invoicesDrawerOpen, setInvoicesDrawerOpen] = useState(false);
  if (!user) return null;
  // const links = navLinks.filter((l) => l.roles.includes(user.role)); // This line is removed

  // Sidebar for desktop
  const sidebar = (
    <nav className="bg-white border-r border-blue-100 shadow-sm min-h-screen hidden md:flex flex-col w-60 px-4 py-6 sticky top-0 z-20">
      <div className="mb-10 flex items-center gap-2">
        <span className="text-2xl font-extrabold text-teal-700 tracking-tight">
          Medistry
        </span>
      </div>
      <ul className="flex-1 flex flex-col gap-2">
        <li>
          <Link
            to="/dashboard"
            className={`block px-4 py-2 rounded-lg font-medium transition text-lg ${
              location.pathname.startsWith("/dashboard")
                ? "bg-teal-600 text-white shadow"
                : "text-teal-700 hover:bg-teal-50"
            }`}
          >
            Dashboard
          </Link>
        </li>
        <li>
          <button
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg font-medium text-lg text-teal-700 hover:bg-teal-50 focus:outline-none"
            onClick={() => setMasterDrawerOpen((open) => !open)}
            aria-expanded={masterDrawerOpen}
            aria-controls="master-drawer"
          >
            <span>Master</span>
            <svg
              className={`h-5 w-5 ml-2 transition-transform ${
                masterDrawerOpen ? "rotate-90" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          {masterDrawerOpen && (
            <ul id="master-drawer" className="ml-4 mt-1 flex flex-col gap-1">
              <li>
                <Link
                  to="/medicines"
                  className={`block px-4 py-2 rounded-lg font-medium transition text-lg ${
                    location.pathname.startsWith("/medicines")
                      ? "bg-teal-600 text-white shadow"
                      : "text-teal-700 hover:bg-teal-50"
                  }`}
                >
                  Medicines
                </Link>
              </li>
              <li>
                <Link
                  to="/patients"
                  className={`block px-4 py-2 rounded-lg font-medium transition text-lg ${
                    location.pathname.startsWith("/patients")
                      ? "bg-teal-600 text-white shadow"
                      : "text-teal-700 hover:bg-teal-50"
                  }`}
                >
                  Patients
                </Link>
              </li>
              <li>
                <Link
                  to="/customers"
                  className={`block px-4 py-2 rounded-lg font-medium transition text-lg ${
                    location.pathname.startsWith("/customers")
                      ? "bg-teal-600 text-white shadow"
                      : "text-teal-700 hover:bg-teal-50"
                  }`}
                >
                  Customers
                </Link>
              </li>
              <li>
                <Link
                  to="/providers"
                  className={`block px-4 py-2 rounded-lg font-medium transition text-lg ${
                    location.pathname.startsWith("/providers")
                      ? "bg-teal-600 text-white shadow"
                      : "text-teal-700 hover:bg-teal-50"
                  }`}
                >
                  Providers
                </Link>
              </li>
              <li>
                <Link
                  to="/contents"
                  className={`block px-4 py-2 rounded-lg font-medium transition text-lg ${
                    location.pathname.startsWith("/contents")
                      ? "bg-teal-600 text-white shadow"
                      : "text-teal-700 hover:bg-teal-50"
                  }`}
                >
                  Contents
                </Link>
              </li>
            </ul>
          )}
        </li>
        <li>
          <Link
            to="/inventory"
            className={`block px-4 py-2 rounded-lg font-medium transition text-lg ${
              location.pathname.startsWith("/inventory")
                ? "bg-teal-600 text-white shadow"
                : "text-teal-700 hover:bg-teal-50"
            }`}
          >
            Inventory
          </Link>
        </li>
        <li>
          <button
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg font-medium text-lg text-teal-700 hover:bg-teal-50 focus:outline-none"
            onClick={() => setInvoicesDrawerOpen((open) => !open)}
            aria-expanded={invoicesDrawerOpen}
            aria-controls="invoices-drawer"
          >
            <span>Invoices</span>
            <svg
              className={`h-5 w-5 ml-2 transition-transform ${
                invoicesDrawerOpen ? "rotate-90" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          {invoicesDrawerOpen && (
            <ul id="invoices-drawer" className="ml-4 mt-1 flex flex-col gap-1">
              <li>
                <Link
                  to="/purchase-invoices"
                  className={`block px-4 py-2 rounded-lg font-medium transition text-lg ${
                    location.pathname.startsWith("/purchase-invoices")
                      ? "bg-teal-600 text-white shadow"
                      : "text-teal-700 hover:bg-teal-50"
                  }`}
                >
                  Purchase Invoice
                </Link>
              </li>
              <li>
                <Link
                  to="/sales-invoices"
                  className={`block px-4 py-2 rounded-lg font-medium transition text-lg ${
                    location.pathname.startsWith("/sales-invoices")
                      ? "bg-teal-600 text-white shadow"
                      : "text-teal-700 hover:bg-teal-50"
                  }`}
                >
                  Sales Invoice
                </Link>
              </li>
            </ul>
          )}
        </li>
      </ul>
      <button
        onClick={logout}
        className="mt-8 bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700 transition"
      >
        Logout
      </button>
    </nav>
  );

  // Topbar for mobile
  const topbar = (
    <div className="md:hidden w-full sticky top-0 z-30 bg-white border-b border-blue-100 shadow-sm flex items-center justify-between px-4 py-3">
      <span className="text-xl font-extrabold text-teal-700 tracking-tight">
        Medistry
      </span>
      <button
        aria-label="Open navigation menu"
        onClick={() => {
          setDrawerVisible(true);
          setTimeout(() => setDrawerOpen(true), 10);
        }}
        className="focus:outline-none"
      >
        <svg
          className="h-7 w-7 text-teal-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>
  );

  // Drawer overlay for mobile with slide-in and slide-out
  const closeDrawer = () => {
    setDrawerClosing(true);
    setDrawerOpen(false);
    setTimeout(() => {
      setDrawerVisible(false);
      setDrawerClosing(false);
    }, 200); // match animation duration
  };

  const drawer = drawerVisible && (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-30 transition-opacity duration-200 ${
          drawerOpen && !drawerClosing ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeDrawer}
      />
      {/* Drawer panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[80vw] h-full bg-white shadow-xl p-6 flex flex-col transition-transform duration-200 ${
          drawerOpen && !drawerClosing
            ? "translate-x-0 animate-slide-in-left"
            : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <span className="text-2xl font-extrabold text-teal-700 tracking-tight">
            Medistry
          </span>
          <button onClick={closeDrawer} aria-label="Close menu">
            <svg
              className="h-6 w-6 text-teal-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <ul className="flex-1 flex flex-col gap-2">
          {sidebarLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`block px-4 py-2 rounded-lg font-medium transition text-lg ${
                  location.pathname.startsWith(link.to)
                    ? "bg-teal-600 text-white shadow"
                    : "text-teal-700 hover:bg-teal-50"
                }`}
                onClick={closeDrawer}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <button
          onClick={() => {
            closeDrawer();
            logout();
          }}
          className="mt-8 bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700 transition"
        >
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block">{sidebar}</div>
      {/* Mobile topbar and overlay drawer */}
      {topbar}
      {drawer}
    </>
  );
}
