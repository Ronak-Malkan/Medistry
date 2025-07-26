import React, { useState, useEffect } from "react";

// Types
interface PurchaseInvoice {
  incoming_bill_id: number;
  provider: {
    providerId: number;
    name: string;
    contactEmail: string;
    contactPhone: string;
  };
  invoice_number: string;
  invoice_date: string;
  payment_status: "Paid" | "Remaining";
  discount_total: string; // TypeORM decimal fields return as strings
  sgst_total: string;
  cgst_total: string;
  total_amount: string;
  created_at: string;
  updated_at: string;
}

// API functions
async function fetchPurchaseInvoices(prefix?: string) {
  const url = prefix
    ? `/api/incoming-bills/search?q=${encodeURIComponent(prefix)}`
    : "/api/incoming-bills";

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return prefix ? data : data.incomingBills || [];
}

async function deletePurchaseInvoice(id: number) {
  const res = await fetch(`/api/incoming-bills/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete purchase invoice");
}

export default function PurchaseInvoiceListPage() {
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load purchase invoices
  useEffect(() => {
    loadPurchaseInvoices();
  }, []);

  const loadPurchaseInvoices = async () => {
    setLoading(true);
    try {
      const data = await fetchPurchaseInvoices(searchTerm);
      setPurchaseInvoices(data);
    } catch (err) {
      setError("Failed to load purchase invoices");
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
      const data = await fetchPurchaseInvoices(prefix);
      setPurchaseInvoices(data);
    } catch (err) {
      setError("Failed to search purchase invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (invoice: PurchaseInvoice) => {
    if (
      !confirm(
        `Are you sure you want to delete purchase invoice "${invoice.invoice_number}"? This will also reverse the stock additions.`
      )
    )
      return;

    try {
      await deletePurchaseInvoice(invoice.incoming_bill_id);
      setSuccess("Purchase invoice deleted successfully!");
      loadPurchaseInvoices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (invoice: PurchaseInvoice) => {
    // Navigate to edit page with invoice ID
    window.location.href = `/purchase-invoices/${invoice.incoming_bill_id}`;
  };

  const handleView = (invoice: PurchaseInvoice) => {
    // Navigate to view page with invoice ID
    window.location.href = `/purchase-invoices/${invoice.incoming_bill_id}`;
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-orange-600 bg-orange-100";
      case "overdue":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="flex-1 w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-extrabold mb-2 text-teal-700 tracking-tight">
            Purchase Invoices
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => (window.location.href = "/purchase-invoices")}
              className="bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700 transition"
            >
              + New Purchase Invoice
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search purchase invoices..."
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

        {/* Purchase Invoices Table */}
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
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
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
                  {purchaseInvoices.map((invoice) => (
                    <tr
                      key={invoice.incoming_bill_id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.invoice_number ||
                            `PI-${invoice.incoming_bill_id}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {invoice.incoming_bill_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.provider.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.provider.contactEmail}
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
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                            invoice.payment_status
                          )}`}
                        >
                          {invoice.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.invoice_date).toLocaleDateString()}
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
              {purchaseInvoices.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No purchase invoices found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {!loading && purchaseInvoices.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4">
              <div className="text-2xl font-bold text-teal-700">
                {purchaseInvoices.length}
              </div>
              <div className="text-sm text-gray-500">Total Invoices</div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4">
              <div className="text-2xl font-bold text-green-600">
                ₹
                {purchaseInvoices
                  .reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0)
                  .toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Total Amount</div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4">
              <div className="text-2xl font-bold text-orange-600">
                {
                  purchaseInvoices.filter(
                    (inv) => inv.payment_status.toLowerCase() === "pending"
                  ).length
                }
              </div>
              <div className="text-sm text-gray-500">Pending Payment</div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4">
              <div className="text-2xl font-bold text-green-600">
                {
                  purchaseInvoices.filter(
                    (inv) => inv.payment_status.toLowerCase() === "paid"
                  ).length
                }
              </div>
              <div className="text-sm text-gray-500">Paid</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
