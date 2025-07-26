import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ConfirmationDialog from "../components/ConfirmationDialog";
import SuggestionDropdown from "../components/SuggestionDropdown";

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
  discount_total: string;
  sgst_total: string;
  cgst_total: string;
  total_amount: string;
  created_at: string;
  updated_at: string;
}

interface IncomingStock {
  incoming_stock_id: number;
  medicine: {
    medicineId: number;
    name: string;
    hsn: string;
  };
  batch_number: string;
  incoming_date: string;
  quantity_received: number;
  unit_cost: number;
  discount_line: number;
  free_quantity: number;
  expiry_date: string;
}

interface MedicineRow {
  incoming_stock_id?: number;
  medicine: string;
  medicineId: number;
  batchNumber: string;
  incomingDate: string;
  quantityReceived: string;
  unitCost: string;
  discountLine: string;
  freeQuantity: string;
  expiryDate: string;
  isNew?: boolean;
  availableStock?: any[];
}

// API functions
async function fetchPurchaseInvoice(id: number): Promise<PurchaseInvoice> {
  const res = await fetch(`/api/incoming-bills/${id}`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch purchase invoice");
  return res.json();
}

async function fetchIncomingStocks(billId: number): Promise<IncomingStock[]> {
  const res = await fetch(`/api/incoming-stocks?billId=${billId}`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.incomingStocks || [];
}

async function updatePurchaseInvoice(
  id: number,
  data: Partial<PurchaseInvoice>
): Promise<PurchaseInvoice> {
  const res = await fetch(`/api/incoming-bills/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update purchase invoice");
  return res.json();
}

async function updateIncomingStock(
  stockId: number,
  data: Partial<IncomingStock>
): Promise<IncomingStock> {
  const res = await fetch(`/api/incoming-stocks/${stockId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update incoming stock");
  return res.json();
}

async function deleteIncomingStock(stockId: number): Promise<void> {
  const res = await fetch(`/api/incoming-stocks/${stockId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete incoming stock");
}

async function createIncomingStock(
  billId: number,
  data: Partial<IncomingStock>
): Promise<IncomingStock> {
  const res = await fetch(`/api/incoming-stocks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ ...data, incomingBillId: billId }),
  });
  if (!res.ok) throw new Error("Failed to create incoming stock");
  return res.json();
}

// Medicine fetching for editing
async function fetchMedicines(prefix: string) {
  const res = await fetch(
    `/api/medicines/search?prefix=${encodeURIComponent(prefix)}`,
    {
      credentials: "include",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
      },
    }
  );
  if (!res.ok) return [];
  return await res.json();
}

type Medicine = {
  medicineId: number;
  name: string;
  hsn: string;
};

export default function PurchaseInvoiceViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null);
  const [incomingStocks, setIncomingStocks] = useState<IncomingStock[]>([]);
  const [rows, setRows] = useState<MedicineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<PurchaseInvoice>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [totalAmountOverride, setTotalAmountOverride] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (id) {
      loadInvoice(parseInt(id));
    }
  }, [id]);

  // Calculate total amount from rows
  useEffect(() => {
    if (totalAmountOverride !== null) return; // Don't recalc if user has overridden
    let sum = 0;
    rows.forEach((row) => {
      const qty = parseFloat(row.quantityReceived) || 0;
      const unit = parseFloat(row.unitCost) || 0;
      const discount = parseFloat(row.discountLine) || 0;
      sum += qty * unit - discount;
    });
    const sgst = parseFloat(editData.sgst_total || "0") || 0;
    const cgst = parseFloat(editData.cgst_total || "0") || 0;
    const discountTotal = parseFloat(editData.discount_total || "0") || 0;
    const total = sum + sgst + cgst - discountTotal;
    setEditData((prev) => ({ ...prev, total_amount: total.toFixed(2) }));
  }, [
    rows,
    editData.sgst_total,
    editData.cgst_total,
    editData.discount_total,
    totalAmountOverride,
  ]);

  // If user edits totalAmount, treat as override
  const handleTotalAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTotalAmountOverride(e.target.value);
    setEditData((prev) => ({ ...prev, total_amount: e.target.value }));
  };

  // If user clears override, recalc
  useEffect(() => {
    if (totalAmountOverride === null) return;
    if (totalAmountOverride.trim() === "") {
      setTotalAmountOverride(null);
    }
  }, [totalAmountOverride]);

  const loadInvoice = async (invoiceId: number) => {
    setLoading(true);
    try {
      const [invoiceData, stocksData] = await Promise.all([
        fetchPurchaseInvoice(invoiceId),
        fetchIncomingStocks(invoiceId),
      ]);
      setInvoice(invoiceData);
      setIncomingStocks(stocksData);
      setEditData(invoiceData);

      // Convert incoming stocks to rows format
      const initialRows: MedicineRow[] = stocksData.map((stock) => ({
        incoming_stock_id: stock.incoming_stock_id,
        medicine: stock.medicine.name,
        medicineId: stock.medicine.medicineId,
        batchNumber: stock.batch_number,
        incomingDate: stock.incoming_date,
        quantityReceived: stock.quantity_received.toString(),
        unitCost: stock.unit_cost.toString(),
        discountLine: stock.discount_line.toString(),
        freeQuantity: stock.free_quantity.toString(),
        expiryDate: stock.expiry_date,
      }));
      setRows(initialRows);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!invoice || !id) return;

    setSaving(true);
    try {
      // Update invoice details
      const updatedInvoice = await updatePurchaseInvoice(
        parseInt(id),
        editData
      );
      setInvoice(updatedInvoice);
      setEditData(updatedInvoice);

      // Update incoming stocks
      for (const row of rows) {
        if (row.incoming_stock_id) {
          // Update existing stock
          await updateIncomingStock(row.incoming_stock_id, {
            quantity_received: parseInt(row.quantityReceived),
            unit_cost: parseFloat(row.unitCost),
            discount_line: parseFloat(row.discountLine),
            free_quantity: parseInt(row.freeQuantity),
          });
        } else if (row.isNew) {
          // Create new stock
          await createIncomingStock(parseInt(id), {
            medicine: {
              medicineId: row.medicineId,
              name: row.medicine,
              hsn: "",
            },
            batch_number: row.batchNumber,
            incoming_date: row.incomingDate,
            quantity_received: parseInt(row.quantityReceived),
            unit_cost: parseFloat(row.unitCost),
            discount_line: parseFloat(row.discountLine),
            free_quantity: parseInt(row.freeQuantity),
            expiry_date: row.expiryDate,
          });
        }
      }

      // Reload data
      await loadInvoice(parseInt(id));
      setIsEditing(false);
      setSuccess("Purchase invoice updated successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(invoice || {});
    // Reset rows to original state
    const initialRows: MedicineRow[] = incomingStocks.map((stock) => ({
      incoming_stock_id: stock.incoming_stock_id,
      medicine: stock.medicine.name,
      medicineId: stock.medicine.medicineId,
      batchNumber: stock.batch_number,
      incomingDate: stock.incoming_date,
      quantityReceived: stock.quantity_received.toString(),
      unitCost: stock.unit_cost.toString(),
      discountLine: stock.discount_line.toString(),
      freeQuantity: stock.free_quantity.toString(),
      expiryDate: stock.expiry_date,
    }));
    setRows(initialRows);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!invoice) return;

    try {
      const res = await fetch(
        `/api/incoming-bills/${invoice.incoming_bill_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
          },
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to delete purchase invoice");

      setSuccess("Purchase invoice deleted successfully!");
      setShowDeleteDialog(false);
      setTimeout(() => navigate("/purchase-invoices/list"), 1000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRowChange = (
    idx: number,
    field: keyof MedicineRow,
    value: string
  ) => {
    const newRows = [...rows];
    newRows[idx] = { ...newRows[idx], [field]: value };
    setRows(newRows);
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        medicine: "",
        medicineId: 0,
        batchNumber: "",
        incomingDate: new Date().toISOString().slice(0, 10),
        quantityReceived: "",
        unitCost: "",
        discountLine: "",
        freeQuantity: "",
        expiryDate: "",
        isNew: true,
      },
    ]);
  };

  const removeRow = async (idx: number) => {
    const row = rows[idx];
    if (row.incoming_stock_id) {
      // Delete from backend
      try {
        await deleteIncomingStock(row.incoming_stock_id);
      } catch (err: any) {
        setError(`Failed to delete item: ${err.message}`);
        return;
      }
    }

    // Remove from local state
    setRows(rows.filter((_, i) => i !== idx));
  };

  const handleMedicineSelect = (idx: number, val: string, item?: Medicine) => {
    const newRows = [...rows];
    if (item) {
      newRows[idx] = {
        ...newRows[idx],
        medicine: item.name,
        medicineId: item.medicineId,
      };
    } else {
      newRows[idx] = {
        ...newRows[idx],
        medicine: val,
        medicineId: 0,
      };
    }
    setRows(newRows);
  };

  if (loading) {
    return (
      <div className="flex-1 w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 overflow-x-hidden">
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
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 overflow-x-hidden">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => navigate("/purchase-invoices/list")}
            className="bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700 transition"
          >
            Back to Purchase Invoices
          </button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex-1 w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 overflow-x-hidden">
          <div className="text-center py-8 text-gray-500">
            Purchase invoice not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold mb-2 text-teal-700 tracking-tight">
              Purchase Invoice #{invoice.invoice_number}
            </h1>
            <div className="text-sm text-gray-600">
              ID: {invoice.incoming_bill_id} • Created:{" "}
              {new Date(invoice.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button
              onClick={() => navigate("/purchase-invoices/list")}
              className="bg-gray-600 text-white px-4 py-2 rounded font-semibold hover:bg-gray-700 transition"
            >
              Back to List
            </button>
            {!isEditing ? (
              <>
                <button
                  onClick={handleEdit}
                  className="bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700 transition"
                >
                  Edit Invoice
                </button>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 transition"
                >
                  Delete Invoice
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-600 text-white px-4 py-2 rounded font-semibold hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </>
            )}
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

        {/* Top: Invoice Details */}
        <div className="bg-white rounded shadow p-4 flex flex-row flex-wrap gap-6 items-end justify-between flex-shrink-0 mb-4">
          <div className="flex flex-row flex-wrap gap-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Payment Status
              </label>
              {isEditing ? (
                <select
                  value={editData.payment_status || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      payment_status: e.target.value as "Paid" | "Remaining",
                    })
                  }
                  className="border rounded px-3 py-2 w-32"
                >
                  <option value="Paid">Paid</option>
                  <option value="Remaining">Remaining</option>
                </select>
              ) : (
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    invoice.payment_status === "Paid"
                      ? "text-green-600 bg-green-100"
                      : "text-orange-600 bg-orange-100"
                  }`}
                >
                  {invoice.payment_status}
                </span>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Provider Name
              </label>
              <div className="text-sm text-gray-900">
                {invoice.provider.name}
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Invoice Number
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.invoice_number || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, invoice_number: e.target.value })
                  }
                  className="border rounded px-3 py-2 w-48"
                />
              ) : (
                <div className="text-sm text-gray-900">
                  {invoice.invoice_number}
                </div>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Invoice Date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.invoice_date || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, invoice_date: e.target.value })
                  }
                  className="border rounded px-3 py-2 w-40"
                />
              ) : (
                <div className="text-sm text-gray-900">
                  {new Date(invoice.invoice_date).toLocaleDateString()}
                </div>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Discount Total
              </label>
              {isEditing ? (
                <input
                  className="border rounded px-3 py-2 w-24"
                  value={editData.discount_total || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, discount_total: e.target.value })
                  }
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                />
              ) : (
                <div className="text-sm text-gray-900">
                  ₹{parseFloat(invoice.discount_total).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle: Scrollable Table/Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto rounded shadow bg-white">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-2 text-left">#</th>
                <th className="px-2 py-2 text-left">Medicine</th>
                <th className="px-2 py-2 text-left">Batch Number</th>
                <th className="px-2 py-2 text-left">Incoming Date</th>
                <th className="px-2 py-2 text-left">Quantity</th>
                <th className="px-2 py-2 text-left">Unit Cost</th>
                <th className="px-2 py-2 text-left">Discount</th>
                <th className="px-2 py-2 text-left">Free Qty</th>
                <th className="px-2 py-2 text-left">Expiry Date</th>
                {isEditing && <th className="px-2 py-2 text-left">Remove</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-2 py-1 align-middle">{idx + 1}</td>
                  <td className="px-2 py-1 min-w-[14rem] max-w-[14rem] align-middle">
                    {isEditing ? (
                      <div className="flex items-center min-w-0">
                        <SuggestionDropdown
                          value={row.medicine}
                          onChange={(val, item) =>
                            handleMedicineSelect(idx, val, item)
                          }
                          fetchSuggestions={fetchMedicines}
                          placeholder="Medicine"
                          getLabel={(medicine: Medicine) => medicine.name}
                          inputClassName="!h-8 !min-h-0 !py-1 !px-2 !text-base !border !rounded w-full"
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-900">
                        {row.medicine}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1 min-w-[8rem] max-w-[8rem] align-middle">
                    {isEditing ? (
                      <input
                        className="border rounded px-2 py-1 w-full"
                        value={row.batchNumber}
                        onChange={(e) =>
                          handleRowChange(idx, "batchNumber", e.target.value)
                        }
                        placeholder="Batch"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">
                        {row.batchNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1">
                    {isEditing ? (
                      <input
                        type="date"
                        className="border rounded px-2 py-1 w-36"
                        value={row.incomingDate}
                        onChange={(e) =>
                          handleRowChange(idx, "incomingDate", e.target.value)
                        }
                      />
                    ) : (
                      <div className="text-sm text-gray-900">
                        {new Date(row.incomingDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1">
                    {isEditing ? (
                      <input
                        className="border rounded px-2 py-1 w-20"
                        value={row.quantityReceived}
                        onChange={(e) =>
                          handleRowChange(
                            idx,
                            "quantityReceived",
                            e.target.value
                          )
                        }
                        placeholder="Qty"
                        type="number"
                        min="0"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">
                        {row.quantityReceived}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1">
                    {isEditing ? (
                      <input
                        className="border rounded px-2 py-1 w-20"
                        value={row.unitCost}
                        onChange={(e) =>
                          handleRowChange(idx, "unitCost", e.target.value)
                        }
                        placeholder="Cost"
                        type="number"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">
                        ₹{parseFloat(row.unitCost).toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1">
                    {isEditing ? (
                      <input
                        className="border rounded px-2 py-1 w-20"
                        value={row.discountLine}
                        onChange={(e) =>
                          handleRowChange(idx, "discountLine", e.target.value)
                        }
                        placeholder="Discount"
                        type="number"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">
                        ₹{parseFloat(row.discountLine).toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1">
                    {isEditing ? (
                      <input
                        className="border rounded px-2 py-1 w-20"
                        value={row.freeQuantity}
                        onChange={(e) =>
                          handleRowChange(idx, "freeQuantity", e.target.value)
                        }
                        placeholder="Free"
                        type="number"
                        min="0"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">
                        {row.freeQuantity}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1">
                    {isEditing ? (
                      <input
                        type="date"
                        className="border rounded px-2 py-1 w-36"
                        value={row.expiryDate}
                        onChange={(e) =>
                          handleRowChange(idx, "expiryDate", e.target.value)
                        }
                      />
                    ) : (
                      <div className="text-sm text-gray-500">
                        {new Date(row.expiryDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  {isEditing && (
                    <td className="px-2 py-1">
                      <button
                        className="text-red-600 font-bold"
                        onClick={() => removeRow(idx)}
                        disabled={rows.length === 1}
                      >
                        ×
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Row Button */}
        {isEditing && (
          <div className="flex-shrink-0 mt-4">
            <button
              className="bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700 transition"
              onClick={addRow}
            >
              + Add Row
            </button>
          </div>
        )}

        {/* Bottom: Totals */}
        <div className="bg-white rounded shadow p-4 flex flex-row flex-wrap gap-6 items-end justify-between flex-shrink-0 mt-4">
          <div className="flex flex-row flex-wrap gap-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                SGST Total
              </label>
              {isEditing ? (
                <input
                  className="border rounded px-3 py-2 w-24"
                  value={editData.sgst_total || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, sgst_total: e.target.value })
                  }
                  type="number"
                  min="0"
                  step="0.01"
                />
              ) : (
                <div className="text-sm text-gray-900">
                  ₹{parseFloat(invoice.sgst_total).toFixed(2)}
                </div>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                CGST Total
              </label>
              {isEditing ? (
                <input
                  className="border rounded px-3 py-2 w-24"
                  value={editData.cgst_total || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, cgst_total: e.target.value })
                  }
                  type="number"
                  min="0"
                  step="0.01"
                />
              ) : (
                <div className="text-sm text-gray-900">
                  ₹{parseFloat(invoice.cgst_total).toFixed(2)}
                </div>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Total Amount
              </label>
              {isEditing ? (
                <input
                  className="border rounded px-3 py-2 w-28"
                  value={editData.total_amount || ""}
                  onChange={handleTotalAmountChange}
                  type="number"
                  min="0"
                  step="0.01"
                />
              ) : (
                <div className="text-sm text-gray-900">
                  ₹{parseFloat(invoice.total_amount).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteDialog}
          title="Delete Purchase Invoice"
          message="Are you sure you want to delete this purchase invoice? This action will also reverse all stock additions made by this invoice and cannot be undone."
          confirmText="Delete Invoice"
          cancelText="Cancel"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
          type="danger"
        />
      </div>
    </div>
  );
}
