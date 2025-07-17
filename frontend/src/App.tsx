import React, { useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { shortcutManager, SHORTCUTS } from "./utils/shortcuts";
import { useShortcutsHelp } from "./components/ShortcutsHelp";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AccountsPage from "./pages/AccountsPage";
import UsersPage from "./pages/UsersPage";
import ContentsPage from "./pages/ContentsPage";
import MedicinesPage from "./pages/MedicinesPage";
import LandingPage from "./pages/LandingPage";
import SignUpPage from "./pages/SignUpPage";
import ProtectedLayout from "./components/ProtectedLayout";
import PurchaseInvoicePage from "./pages/PurchaseInvoicePage";
import SalesInvoicePage from "./pages/SalesInvoicePage";

function ProtectedRoute() {
  const { token, validateToken, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const valid = await validateToken();
      if (!valid && isMounted) {
        navigate("/login", { replace: true });
      }
    })();
    return () => {
      isMounted = false;
    };
    // validateToken changes on every render, but we only want to run on mount/route change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate]);
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <svg
          className="animate-spin h-8 w-8 text-blue-600"
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
      </div>
    );
  }
  return token ? <Outlet /> : null;
}

function RoleProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: React.ReactNode;
}) {
  const { user, token, loading } = useAuth();
  if (loading || (token && !user)) {
    // Still loading user info
    return (
      <div className="flex items-center justify-center min-h-screen">
        <svg
          className="animate-spin h-8 w-8 text-blue-600"
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
      </div>
    );
  }
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// Component to handle global shortcuts
function GlobalShortcuts() {
  const navigate = useNavigate();
  const { openHelp, isOpen, setIsOpen } = useShortcutsHelp();

  useEffect(() => {
    console.log("Registering shortcuts..."); // Debug log

    // Register global shortcuts
    shortcutManager.registerShortcut({
      ...SHORTCUTS.HELP,
      action: () => {
        console.log("Help shortcut triggered!"); // Debug log
        setIsOpen(true);
      },
    });

    shortcutManager.registerShortcut({
      ...SHORTCUTS.SALES_INVOICE,
      action: () => navigate("/sales-invoices"),
    });

    shortcutManager.registerShortcut({
      ...SHORTCUTS.PURCHASE_INVOICE,
      action: () => navigate("/purchase-invoices"),
    });

    shortcutManager.registerShortcut({
      ...SHORTCUTS.SALES_RETURN,
      action: () => navigate("/sales-invoices?billType=CA-SR-BS"),
    });

    // Register alternative shortcut for Mac users (Ctrl+R)
    if (SHORTCUTS.SALES_RETURN_ALT) {
      shortcutManager.registerShortcut({
        ...SHORTCUTS.SALES_RETURN_ALT,
        action: () => navigate("/sales-invoices?billType=CA-SR-BS"),
      });
    }

    console.log("All shortcuts registered"); // Debug log

    // Cleanup on unmount
    return () => {
      shortcutManager.clearAll();
    };
  }, [navigate, openHelp]);

  return null;
}

export default function App() {
  const { ShortcutsHelpComponent } = useShortcutsHelp();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-teal-50 via-blue-50 to-green-100">
      <GlobalShortcuts />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/accounts"
            element={
              <RoleProtectedRoute allowedRoles={["account_admin"]}>
                <AccountsPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            element={
              <RoleProtectedRoute allowedRoles={["app_admin"]}>
                <ProtectedLayout>
                  <Outlet />
                </ProtectedLayout>
              </RoleProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/contents" element={<ContentsPage />} />
            <Route path="/medicines" element={<MedicinesPage />} />
            <Route
              path="/purchase-invoices"
              element={<PurchaseInvoicePage />}
            />
            <Route path="/sales-invoices" element={<SalesInvoicePage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      {/* Shortcuts Help Modal */}
      <ShortcutsHelpComponent />
    </div>
  );
}
