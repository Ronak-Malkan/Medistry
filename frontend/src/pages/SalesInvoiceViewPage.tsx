import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ConfirmationDialog from "../components/ConfirmationDialog";
import SuggestionDropdown from "../components/SuggestionDropdown";

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
  discount_total: string;
  sgst_total: string;
  cgst_total: string;
  total_amount: string;
  credit: boolean;
  created_at: string;
  updated_at: string;
}

interface SellingLog {
  selling_log_id: number;
  medicine: {
    medicineId: number;
    name: string;
    hsn: string;
  };
  batch_number: string;
  quantity_sold: number;
  discount_line: number;
  unit_price_inclusive_gst: number;
  expiry_date: string;
}

interface MedicineRow {
  selling_log_id?: number;
  medicine: string;
  medicineId: number;
  batchNumber: string;
  quantity: string;
  price: string;
  discountLine: string;
  expiryDate: string;
  isNew?: boolean;
  availableStock?: any[];
}

// API functions
async function fetchSalesInvoice(id: number): Promise<SalesInvoice> {
  const res = await fetch(`/api/bills/${id}`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch sales invoice");
  return res.json();
}

async function fetchSellingLogs(billId: number): Promise<SellingLog[]> {
  const res = await fetch(`/api/selling-logs?billId=${billId}`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.sellingLogs || [];
}

async function updateSalesInvoice(
  id: number,
  data: Partial<SalesInvoice>
): Promise<SalesInvoice> {
  const res = await fetch(`/api/bills/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update sales invoice");
  return res.json();
}

async function updateSellingLog(
  logId: number,
  data: Partial<SellingLog>
): Promise<SellingLog> {
  const res = await fetch(`/api/selling-logs/${logId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update selling log");
  return res.json();
}

async function deleteSellingLog(logId: number): Promise<void> {
  const res = await fetch(`/api/selling-logs/${logId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete selling log");
}

async function createSellingLog(
  billId: number,
  data: Partial<SellingLog>
): Promise<SellingLog> {
  const res = await fetch(`/api/selling-logs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ ...data, bill_id: billId }),
  });
  if (!res.ok) throw new Error("Failed to create selling log");
  return res.json();
}

// Medicine stock fetching for editing
async function fetchMedicineStock(prefix: string) {
  const res = await fetch(
    `/api/medicine-stock/search?prefix=${encodeURIComponent(prefix)}`,
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

type UniqueMedicine = {
  medicineId: number;
  name: string;
  allStocks: any[];
};

async function fetchUniqueMedicines(prefix: string): Promise<UniqueMedicine[]> {
  const stocks = await fetchMedicineStock(prefix);
  const uniqueMedicines = new Map<number, UniqueMedicine>();

  stocks.forEach((stock: any) => {
    if (!uniqueMedicines.has(stock.medicine.medicineId)) {
      uniqueMedicines.set(stock.medicine.medicineId, {
        medicineId: stock.medicine.medicineId,
        name: stock.medicine.name,
        allStocks: [],
      });
    }
    uniqueMedicines.get(stock.medicine.medicineId)!.allStocks.push(stock);
  });

  return Array.from(uniqueMedicines.values());
}

export default function SalesInvoiceViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);
  const [sellingLogs, setSellingLogs] = useState<SellingLog[]>([]);
  const [rows, setRows] = useState<MedicineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<SalesInvoice>>({});
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
      const qty = parseFloat(row.quantity) || 0;
      const unit = parseFloat(row.price) || 0;
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
      const [invoiceData, logsData] = await Promise.all([
        fetchSalesInvoice(invoiceId),
        fetchSellingLogs(invoiceId),
      ]);
      setInvoice(invoiceData);
      setSellingLogs(logsData);
      setEditData(invoiceData);

      // Convert selling logs to rows format
      const initialRows: MedicineRow[] = logsData.map((log) => ({
        selling_log_id: log.selling_log_id,
        medicine: log.medicine.name,
        medicineId: log.medicine.medicineId,
        batchNumber: log.batch_number,
        quantity: log.quantity_sold.toString(),
        price: log.unit_price_inclusive_gst.toString(),
        discountLine: log.discount_line.toString(),
        expiryDate: log.expiry_date,
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
      const updatedInvoice = await updateSalesInvoice(parseInt(id), editData);
      setInvoice(updatedInvoice);
      setEditData(updatedInvoice);

      // Update selling logs
      for (const row of rows) {
        if (row.selling_log_id) {
          // Update existing log
          await updateSellingLog(row.selling_log_id, {
            quantity_sold: parseInt(row.quantity),
            unit_price_inclusive_gst: parseFloat(row.price),
            discount_line: parseFloat(row.discountLine),
          });
        } else if (row.isNew) {
          // Create new log
          await createSellingLog(parseInt(id), {
            medicine: {
              medicineId: row.medicineId,
              name: row.medicine,
              hsn: "",
            },
            batch_number: row.batchNumber,
            quantity_sold: parseInt(row.quantity),
            unit_price_inclusive_gst: parseFloat(row.price),
            discount_line: parseFloat(row.discountLine),
            expiry_date: row.expiryDate,
          });
        }
      }

      // Reload data
      await loadInvoice(parseInt(id));
      setIsEditing(false);
      setSuccess("Sales invoice updated successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(invoice || {});
    // Reset rows to original state
    const initialRows: MedicineRow[] = sellingLogs.map((log) => ({
      selling_log_id: log.selling_log_id,
      medicine: log.medicine.name,
      medicineId: log.medicine.medicineId,
      batchNumber: log.batch_number,
      quantity: log.quantity_sold.toString(),
      price: log.unit_price_inclusive_gst.toString(),
      discountLine: log.discount_line.toString(),
      expiryDate: log.expiry_date,
    }));
    setRows(initialRows);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!invoice) return;

    try {
      const res = await fetch(`/api/bills/${invoice.bill_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete sales invoice");

      setSuccess("Sales invoice deleted successfully!");
      setShowDeleteDialog(false);
      setTimeout(() => navigate("/sales-invoices/list"), 1000);
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
        quantity: "",
        price: "",
        discountLine: "",
        expiryDate: "",
        isNew: true,
      },
    ]);
  };

  const removeRow = async (idx: number) => {
    const row = rows[idx];
    if (row.selling_log_id) {
      // Delete from backend
      try {
        await deleteSellingLog(row.selling_log_id);
      } catch (err: any) {
        setError(`Failed to delete item: ${err.message}`);
        return;
      }
    }

    // Remove from local state
    setRows(rows.filter((_, i) => i !== idx));
  };

  const handleMedicineSelect = (
    idx: number,
    val: string,
    item?: UniqueMedicine
  ) => {
    const newRows = [...rows];
    if (item) {
      newRows[idx] = {
        ...newRows[idx],
        medicine: item.name,
        medicineId: item.medicineId,
        availableStock: item.allStocks,
      };
    } else {
      newRows[idx] = {
        ...newRows[idx],
        medicine: val,
        medicineId: 0,
        availableStock: [],
      };
    }
    setRows(newRows);
  };

  const handleBatchSelect = (idx: number, batchNumber: string, stock?: any) => {
    const newRows = [...rows];
    if (stock) {
      newRows[idx] = {
        ...newRows[idx],
        batchNumber: stock.batchNumber,
        expiryDate: stock.expiryDate,
        price: stock.price,
      };
    } else {
      newRows[idx] = {
        ...newRows[idx],
        batchNumber,
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
            onClick={() => navigate("/sales-invoices/list")}
            className="bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700 transition"
          >
            Back to Sales Invoices
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
            Sales invoice not found
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
              Sales Invoice #{invoice.bill_id}
            </h1>
            <div className="text-sm text-gray-600">
              ID: {invoice.bill_id} • Created:{" "}
              {new Date(invoice.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button
              onClick={() => navigate("/sales-invoices/list")}
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
                Payment Type
              </label>
              {isEditing ? (
                <select
                  value={editData.credit ? "true" : "false"}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      credit: e.target.value === "true",
                    })
                  }
                  className="border rounded px-3 py-2 w-32"
                >
                  <option value="false">Cash</option>
                  <option value="true">Credit</option>
                </select>
              ) : (
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    invoice.credit
                      ? "text-orange-600 bg-orange-100"
                      : "text-green-600 bg-green-100"
                  }`}
                >
                  {invoice.credit ? "Credit" : "Cash"}
                </span>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Patient Name
              </label>
              <div className="text-sm text-gray-900">
                {invoice.patient.name}
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Doctor Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.doctor_name || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, doctor_name: e.target.value })
                  }
                  className="border rounded px-3 py-2 w-48"
                />
              ) : (
                <div className="text-sm text-gray-900">
                  {invoice.doctor_name}
                </div>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Bill Date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.bill_date || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, bill_date: e.target.value })
                  }
                  className="border rounded px-3 py-2 w-40"
                />
              ) : (
                <div className="text-sm text-gray-900">
                  {new Date(invoice.bill_date).toLocaleDateString()}
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
                <th className="px-2 py-2 text-left">Quantity</th>
                <th className="px-2 py-2 text-left">Price</th>
                <th className="px-2 py-2 text-left">Discount Line</th>
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
                          fetchSuggestions={fetchUniqueMedicines}
                          placeholder="Medicine"
                          getLabel={(medicine: UniqueMedicine) => medicine.name}
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
                        className="border rounded px-2 py-1 w-20"
                        value={row.quantity}
                        onChange={(e) =>
                          handleRowChange(idx, "quantity", e.target.value)
                        }
                        placeholder="Qty"
                        type="number"
                        min="0"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">
                        {row.quantity}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1">
                    {isEditing ? (
                      <input
                        className="border rounded px-2 py-1 w-20"
                        value={row.price}
                        onChange={(e) =>
                          handleRowChange(idx, "price", e.target.value)
                        }
                        placeholder="Price"
                        type="number"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">
                        ₹{parseFloat(row.price).toFixed(2)}
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
                    <input
                      type="date"
                      className="border rounded px-2 py-1 w-36 bg-gray-100"
                      value={row.expiryDate}
                      readOnly
                    />
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
          title="Delete Sales Invoice"
          message="Are you sure you want to delete this sales invoice? This action will also reverse all stock decrements made by this invoice and cannot be undone."
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
