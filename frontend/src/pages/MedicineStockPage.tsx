import React, { useState, useEffect } from "react";

// Types
interface MedicineStock {
  medicineStockId: number;
  medicine: {
    medicineId: number;
    name: string;
    hsn: string;
  };
  batchNumber: string;
  incomingDate: string;
  expiryDate: string;
  quantityAvailable: number;
  price: string;
  unitsPerPack?: number;
  createdAt: string;
  updatedAt: string;
}

// API functions
async function fetchMedicineStock(prefix?: string) {
  const url = prefix
    ? `/api/medicine-stock/search?prefix=${encodeURIComponent(prefix)}`
    : "/api/medicine-stock/searchall";

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data;
}

async function deleteMedicineStock(id: number) {
  const res = await fetch(`/api/medicine-stock/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete medicine stock");
}

export default function MedicineStockPage() {
  const [medicineStock, setMedicineStock] = useState<MedicineStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<any>(null);

  // Load medicine stock and account info
  useEffect(() => {
    loadMedicineStock();
    loadAccountInfo();
  }, []);

  const loadAccountInfo = async () => {
    try {
      const res = await fetch("/api/accounts", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAccountInfo(data);
      }
    } catch (err) {
      console.error("Failed to load account info:", err);
    }
  };

  const loadMedicineStock = async () => {
    setLoading(true);
    try {
      const data = await fetchMedicineStock(searchTerm);
      setMedicineStock(data);
    } catch (err) {
      setError("Failed to load medicine stock");
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
      const data = await fetchMedicineStock(prefix);
      setMedicineStock(data);
    } catch (err) {
      setError("Failed to search medicine stock");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (stock: MedicineStock) => {
    if (
      !confirm(
        `Are you sure you want to delete stock for "${stock.medicine.name}" (Batch: ${stock.batchNumber})?`
      )
    )
      return;

    try {
      await deleteMedicineStock(stock.medicineStockId);
      setSuccess("Medicine stock deleted successfully!");
      loadMedicineStock();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStockStatus = (quantity: number) => {
    const lowStockThreshold = accountInfo?.lowStockThreshold || 10;
    if (quantity <= lowStockThreshold)
      return { text: "Low Stock", color: "text-orange-600 bg-orange-100" };
    return { text: "In Stock", color: "text-green-600 bg-green-100" };
  };

  const getExpiryStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const expiryAlertLeadTime = accountInfo?.expiryAlertLeadTime || 30;
    if (daysUntilExpiry <= expiryAlertLeadTime)
      return { text: "Expiring Soon", color: "text-orange-600 bg-orange-100" };
    return { text: "Valid", color: "text-green-600 bg-green-100" };
  };

  return (
    <div className="flex-1 w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-extrabold mb-2 text-teal-700 tracking-tight">
            Medicine Stock
          </h1>
          <div className="text-sm text-gray-600">
            Read-only view • Stock is managed through purchase invoices
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search medicine stock..."
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

        {/* Medicine Stock Table */}
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
                      Medicine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Incoming Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {medicineStock.map((stock) => {
                    const stockStatus = getStockStatus(stock.quantityAvailable);
                    const expiryStatus = getExpiryStatus(stock.expiryDate);

                    return (
                      <tr
                        key={stock.medicineStockId}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {stock.medicine.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {stock.batchNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {stock.quantityAvailable}
                          </div>
                          {stock.unitsPerPack && (
                            <div className="text-xs text-gray-500">
                              {stock.unitsPerPack} units/pack
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ₹{parseFloat(stock.price).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(stock.incomingDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(stock.expiryDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}
                            >
                              {stockStatus.text}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${expiryStatus.color}`}
                            >
                              {expiryStatus.text}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDelete(stock)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {medicineStock.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No medicine stock found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {!loading && medicineStock.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4">
              <div className="text-2xl font-bold text-teal-700">
                {medicineStock.length}
              </div>
              <div className="text-sm text-gray-500">Total Stock Items</div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4">
              <div className="text-2xl font-bold text-green-600">
                {
                  medicineStock.filter((s) => {
                    const lowStockThreshold =
                      accountInfo?.lowStockThreshold || 10;
                    return s.quantityAvailable > lowStockThreshold;
                  }).length
                }
              </div>
              <div className="text-sm text-gray-500">In Stock</div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4">
              <div className="text-2xl font-bold text-orange-600">
                {
                  medicineStock.filter((s) => {
                    const lowStockThreshold =
                      accountInfo?.lowStockThreshold || 10;
                    return (
                      s.quantityAvailable <= lowStockThreshold &&
                      s.quantityAvailable > 0
                    );
                  }).length
                }
              </div>
              <div className="text-sm text-gray-500">Low Stock</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
