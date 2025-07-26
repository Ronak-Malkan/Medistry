import React, { useState, useEffect } from "react";

// Types
interface SalesInvoice {
  bill_id: number;
  patient: {
    patient_id: number;
    name: string;
    phone?: string;
    address?: string;
  };
  doctor_name: string;
  bill_date: string;
  discount_total: string; // TypeORM decimal fields return as strings
  sgst_total: string;
  cgst_total: string;
  total_amount: string;
  credit: boolean;
  created_at: string;
  updated_at: string;
}

// API functions
async function fetchSalesInvoices(prefix?: string) {
  const url = prefix
    ? `/api/bills/search?q=${encodeURIComponent(prefix)}`
    : "/api/bills";

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return prefix ? data : data.bills || [];
}

async function deleteSalesInvoice(id: number) {
  const res = await fetch(`/api/bills/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete sales invoice");
}

export default function SalesInvoiceListPage() {
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load sales invoices
  useEffect(() => {
    loadSalesInvoices();
  }, []);

  const loadSalesInvoices = async () => {
    setLoading(true);
    try {
      const data = await fetchSalesInvoices(searchTerm);
      setSalesInvoices(data);
    } catch (err) {
      setError("Failed to load sales invoices");
    } finally {
      setLoading(false);
    }
  };

  // Search handler
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const prefix = e.target.value;
    setSearchTerm(prefix);
    setLoading(true);
    try {
      const data = await fetchSalesInvoices(prefix);
      setSalesInvoices(data);
    } catch (err) {
      setError("Failed to search sales invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (invoice: SalesInvoice) => {
    if (
      !confirm(
        `Are you sure you want to delete sales invoice "${invoice.bill_id}"? This will also reverse the stock decrements.`
      )
    )
      return;

    try {
      await deleteSalesInvoice(invoice.bill_id);
      setSuccess("Sales invoice deleted successfully!");
      loadSalesInvoices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (invoice: SalesInvoice) => {
    // Navigate to edit page with invoice ID
    window.location.href = `/sales-invoices/${invoice.bill_id}`;
  };

  const handleView = (invoice: SalesInvoice) => {
    // Navigate to view page with invoice ID
    window.location.href = `/sales-invoices/${invoice.bill_id}`;
  };

  const getBillTypeLabel = (credit: boolean) => {
    return credit ? "Credit Sale" : "Cash Sale";
  };

  const getBillTypeColor = (credit: boolean) => {
    return credit ? "text-blue-600 bg-blue-100" : "text-green-600 bg-green-100";
  };

  const getPaymentStatusColor = (credit: boolean) => {
    return credit
      ? "text-orange-600 bg-orange-100"
      : "text-green-600 bg-green-100";
  };

  return (
    <div className="flex-1 w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-extrabold mb-2 text-teal-700 tracking-tight">
            Sales Invoices
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => (window.location.href = "/sales-invoices")}
              className="bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700 transition"
            >
              + New Sales Invoice
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search sales invoices..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Sales Invoices Table */}
        <div className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <svg
                className="animate-spin h-8 w-8 text-teal-600"
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
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesInvoices.map((invoice) => (
                    <tr key={invoice.bill_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          SI-{invoice.bill_id}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {invoice.bill_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.patient.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.patient.phone || "No phone"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{parseFloat(invoice.total_amount).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Discount: ₹
                          {parseFloat(invoice.discount_total).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBillTypeColor(
                            invoice.credit
                          )}`}
                        >
                          {getBillTypeLabel(invoice.credit)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                            invoice.credit
                          )}`}
                        >
                          {invoice.credit ? "Credit" : "Cash"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.bill_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleView(invoice)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(invoice)}
                            className="text-teal-600 hover:text-teal-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(invoice)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {salesInvoices.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No sales invoices found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {!loading && salesInvoices.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4">
              <div className="text-2xl font-bold text-teal-700">
                {salesInvoices.length}
              </div>
              <div className="text-sm text-gray-500">Total Invoices</div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4">
              <div className="text-2xl font-bold text-green-600">
                ₹
                {salesInvoices
                  .reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0)
                  .toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Total Amount</div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4">
              <div className="text-2xl font-bold text-orange-600">
                {salesInvoices.filter((inv) => inv.credit).length}
              </div>
              <div className="text-sm text-gray-500">Credit Sales</div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4">
              <div className="text-2xl font-bold text-green-600">
                {salesInvoices.filter((inv) => !inv.credit).length}
              </div>
              <div className="text-sm text-gray-500">Cash Sales</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
