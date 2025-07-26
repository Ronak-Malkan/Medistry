import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Shared navigation configuration
const navigationConfig = [
  {
    to: "/dashboard",
    label: "Dashboard",
    roles: ["account_admin", "app_admin"],
    standalone: true,
  },
  {
    label: "Master",
    roles: ["account_admin", "app_admin"],
    collapsible: true,
    children: [
      { to: "/medicines", label: "Medicines" },
      { to: "/patients", label: "Patients" },
      { to: "/customers", label: "Customers" },
      { to: "/providers", label: "Providers" },
      { to: "/contents", label: "Contents" },
    ],
  },
  {
    to: "/inventory",
    label: "Inventory",
    roles: ["account_admin", "app_admin"],
    standalone: true,
  },
  {
    label: "Invoices",
    roles: ["account_admin", "app_admin"],
    collapsible: true,
    children: [
      { to: "/purchase-invoices", label: "New Purchase Invoice" },
      { to: "/purchase-invoices/list", label: "Purchase Invoice List" },
      { to: "/sales-invoices", label: "New Sales Invoice" },
      { to: "/sales-invoices/list", label: "Sales Invoice List" },
    ],
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
  const [mobileMasterDrawerOpen, setMobileMasterDrawerOpen] = useState(false);
  const [mobileInvoicesDrawerOpen, setMobileInvoicesDrawerOpen] =
    useState(false);

  if (!user) return null;

  // Helper function to check if a link is active
  const isLinkActive = (to: string, isChild = false) => {
    if (isChild) {
      return location.pathname.startsWith(to);
    }
    return location.pathname.startsWith(to);
  };

  // Helper function to check if a drawer should be open by default
  const shouldDrawerBeOpen = (children: any[]) => {
    return children.some((child) => isLinkActive(child.to, true));
  };

  // Render navigation item
  const renderNavItem = (item: any, isMobile = false, level = 0) => {
    const paddingLeft = level > 0 ? `pl-${level * 4 + 4}` : "pl-4";

    if (item.standalone) {
      return (
        <li key={item.to}>
          <Link
            to={item.to}
            className={`block ${paddingLeft} py-2 rounded-lg font-medium transition text-lg ${
              isLinkActive(item.to)
                ? "bg-teal-600 text-white shadow"
                : "text-teal-700 hover:bg-teal-50"
            }`}
            onClick={isMobile ? closeDrawer : undefined}
          >
            {item.label}
          </Link>
        </li>
      );
    }

    if (item.collapsible) {
      const isOpen = isMobile
        ? item.label === "Master"
          ? mobileMasterDrawerOpen
          : mobileInvoicesDrawerOpen
        : item.label === "Master"
        ? masterDrawerOpen
        : invoicesDrawerOpen;

      const setIsOpen = isMobile
        ? item.label === "Master"
          ? setMobileMasterDrawerOpen
          : setMobileInvoicesDrawerOpen
        : item.label === "Master"
        ? setMasterDrawerOpen
        : setInvoicesDrawerOpen;

      return (
        <li key={item.label}>
          <button
            className={`w-full flex items-center justify-between ${paddingLeft} py-2 rounded-lg font-medium text-lg text-teal-700 hover:bg-teal-50 focus:outline-none`}
            onClick={() => setIsOpen((open: boolean) => !open)}
            aria-expanded={isOpen}
            aria-controls={`${item.label.toLowerCase()}-drawer`}
          >
            <span>{item.label}</span>
            <svg
              className={`h-5 w-5 ml-2 transition-transform ${
                isOpen ? "rotate-90" : ""
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
          {isOpen && (
            <ul
              id={`${item.label.toLowerCase()}-drawer`}
              className="ml-4 mt-1 flex flex-col gap-1"
            >
              {item.children.map((child: any) => (
                <li key={child.to}>
                  <Link
                    to={child.to}
                    className={`block px-4 py-2 rounded-lg font-medium transition text-lg ${
                      isLinkActive(child.to, true)
                        ? "bg-teal-600 text-white shadow"
                        : "text-teal-700 hover:bg-teal-50"
                    }`}
                    onClick={isMobile ? closeDrawer : undefined}
                  >
                    {child.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      );
    }

    return null;
  };

  // Sidebar for desktop
  const sidebar = (
    <nav className="bg-white border-r border-blue-100 shadow-sm min-h-screen hidden md:flex flex-col w-60 px-4 py-6 sticky top-0 z-20">
      <div className="mb-10 flex items-center gap-2">
        <span className="text-2xl font-extrabold text-teal-700 tracking-tight">
          Medistry
        </span>
      </div>
      <ul className="flex-1 flex flex-col gap-2">
        {navigationConfig.map((item) => renderNavItem(item, false))}
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
          {navigationConfig.map((item) => renderNavItem(item, true))}
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
