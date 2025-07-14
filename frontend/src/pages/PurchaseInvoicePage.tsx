import React, { useState, useEffect } from "react";
import SuggestionDropdown from "../components/SuggestionDropdown";
// Define Content type locally for frontend use
type Content = {
  contentId: number;
  name: string;
};

// Define a type for the row
interface MedicineRow {
  medicine: string;
  batchNumber: string;
  incomingDate: string;
  quantityReceived: string;
  unitCost: string;
  discountLine: string;
  freeQuantity: string;
  expiryDate: string;
}

const initialRow: MedicineRow = {
  medicine: "",
  batchNumber: "",
  incomingDate: "",
  quantityReceived: "",
  unitCost: "",
  discountLine: "",
  freeQuantity: "",
  expiryDate: "",
};

// API fetchers with auth
async function fetchProviders(prefix: string) {
  const res = await fetch(
    `/api/providers/search?q=${encodeURIComponent(prefix)}`,
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

async function fetchMedicines(prefix: string) {
  console.log(
    "Fetching medicines with token:",
    localStorage.getItem("medistry_jwt")
  );
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

async function fetchContents(prefix: string) {
  const res = await fetch(
    `/api/contents/search?prefix=${encodeURIComponent(prefix)}`,
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

async function createProvider(data: {
  name: string;
  contactEmail: string;
  contactPhone: string;
}) {
  const res = await fetch("/api/providers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error((await res.json()).message || "Failed to create provider");
  return await res.json();
}

// Add API for creating medicine and content
async function createMedicine(data: {
  name: string;
  hsn: string;
  contentIds: number[];
}) {
  const res = await fetch("/api/medicines/master", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error((await res.json()).message || "Failed to create medicine");
  return await res.json();
}
async function createContent(data: { name: string }) {
  const res = await fetch("/api/contents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error((await res.json()).message || "Failed to create content");
  return await res.json();
}

const PurchaseInvoicePage: React.FC = () => {
  const [rows, setRows] = useState<MedicineRow[]>([{ ...initialRow }]);
  const [invoiceDetails, setInvoiceDetails] = useState({
    provider: "",
    invoiceNumber: "",
    invoiceDate: "",
    paymentStatus: "Paid",
    discountTotal: "",
    sgstTotal: "",
    cgstTotal: "",
    totalAmount: "",
  });
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [showAddMedicine, setShowAddMedicine] = useState<{
    rowIdx: number;
    input: string;
  } | null>(null);
  const [showAddContent, setShowAddContent] = useState<{
    input: string;
  } | null>(null);
  // Use Content[] for newMedicineContents
  const [newMedicineContents, setNewMedicineContents] = useState<Content[]>([]);
  const [providerForm, setProviderForm] = useState({
    name: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [providerLoading, setProviderLoading] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);

  // --- MODAL STATE for new medicine ---
  const [newMedicineName, setNewMedicineName] = useState("");
  const [addMedicineLoading, setAddMedicineLoading] = useState(false);
  const [addMedicineError, setAddMedicineError] = useState<string | null>(null);

  // Add state for HSN and for controlling the persistent content sub-form
  const [newMedicineHSN, setNewMedicineHSN] = useState("");
  const [showContentForm, setShowContentForm] = useState(false);

  // Add state for inline content creation
  const [inlineContentName, setInlineContentName] = useState("");
  const [inlineContentLoading, setInlineContentLoading] = useState(false);
  const [inlineContentError, setInlineContentError] = useState<string | null>(
    null
  );

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [totalAmountOverride, setTotalAmountOverride] = useState<string | null>(
    null
  );

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
    const sgst = parseFloat(invoiceDetails.sgstTotal) || 0;
    const cgst = parseFloat(invoiceDetails.cgstTotal) || 0;
    const discountTotal = parseFloat(invoiceDetails.discountTotal) || 0;
    const total = sum + sgst + cgst - discountTotal;
    setInvoiceDetails((prev) => ({ ...prev, totalAmount: total.toFixed(2) }));
  }, [
    rows,
    invoiceDetails.sgstTotal,
    invoiceDetails.cgstTotal,
    invoiceDetails.discountTotal,
    totalAmountOverride,
  ]);

  // If user edits totalAmount, treat as override
  const handleTotalAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTotalAmountOverride(e.target.value);
    setInvoiceDetails((prev) => ({ ...prev, totalAmount: e.target.value }));
  };

  // If user clears override, recalc
  useEffect(() => {
    if (totalAmountOverride === null) return;
    if (totalAmountOverride.trim() === "") {
      setTotalAmountOverride(null);
    }
  }, [totalAmountOverride]);

  // Find providerId from provider name (from SuggestionDropdown)
  const getProviderId = async (name: string) => {
    const res = await fetch(
      `/api/providers/search?q=${encodeURIComponent(name)}`,
      {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
        },
      }
    );
    if (!res.ok) return null;
    const providers = await res.json();
    const found = providers.find((p: any) => p.name === name);
    return found ? found.providerId : null;
  };

  // Find medicineId from medicine name (from SuggestionDropdown)
  const getMedicineId = async (name: string) => {
    const res = await fetch(
      `/api/medicines/search?prefix=${encodeURIComponent(name)}`,
      {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
        },
      }
    );
    if (!res.ok) return null;
    const meds = await res.json();
    const found = meds.find((m: any) => m.name === name);
    return found ? found.medicineId : null;
  };

  // Submit handler
  const handleSubmit = async () => {
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      // Get providerId
      const providerId = await getProviderId(invoiceDetails.provider);
      if (!providerId) throw new Error("Provider not found");
      // Map rows to entries
      const entries = await Promise.all(
        rows.map(async (row) => {
          const medicineId = await getMedicineId(row.medicine);
          return {
            medicineId,
            batchNumber: row.batchNumber,
            incomingDate: row.incomingDate,
            expiryDate: row.expiryDate,
            quantity: parseInt(row.quantityReceived) || 0,
            price: parseFloat(row.unitCost) || 0,
            discountLine: parseFloat(row.discountLine) || 0,
            freeQuantity: parseInt(row.freeQuantity) || 0,
          };
        })
      );
      // Prepare bill
      const bill = {
        provider: providerId,
        invoice_number: invoiceDetails.invoiceNumber,
        invoice_date: invoiceDetails.invoiceDate,
        payment_status: invoiceDetails.paymentStatus,
        discount_total: parseFloat(invoiceDetails.discountTotal) || 0,
        sgst_total: parseFloat(invoiceDetails.sgstTotal) || 0,
        cgst_total: parseFloat(invoiceDetails.cgstTotal) || 0,
        total_amount: parseFloat(invoiceDetails.totalAmount) || 0,
      };
      // POST to API
      const res = await fetch("/api/incoming-bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
        },
        credentials: "include",
        body: JSON.stringify({ bill, entries }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to create bill");
      // Success: reset form or show success message
      setSubmitLoading(false);
      alert("Purchase bill created successfully!");
      // Optionally reset form here
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create bill");
      setSubmitLoading(false);
    }
  };

  const handleRowChange = (
    idx: number,
    field: keyof MedicineRow,
    value: string
  ) => {
    const updated = [...rows];
    updated[idx][field] = value;
    setRows(updated);
  };

  const addRow = () => setRows([...rows, { ...initialRow }]);
  const removeRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx));

  // Handler for provider creation
  const handleProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProviderLoading(true);
    setProviderError(null);
    try {
      const newProvider = await createProvider(providerForm);
      setInvoiceDetails((prev) => ({ ...prev, provider: newProvider.name }));
      setShowAddProvider(false);
      setProviderForm({ name: "", contactEmail: "", contactPhone: "" });
    } catch (err: any) {
      setProviderError(err.message || "Failed to create provider");
    } finally {
      setProviderLoading(false);
    }
  };

  // Handler for adding content to new medicine
  const handleAddContentToMedicine = (val: string, item?: any) => {
    const contentItem = item as Content | undefined;
    if (
      contentItem &&
      !newMedicineContents.some((c) => c.contentId === contentItem.contentId)
    ) {
      setNewMedicineContents([...newMedicineContents, contentItem]);
    }
  };

  // Handler for removing content from new medicine
  const handleRemoveContentFromMedicine = (val: string) => {
    setNewMedicineContents(newMedicineContents.filter((c) => c.name !== val));
  };

  return (
    <div className="p-6 flex-1 flex flex-col min-h-0 gap-y-4 overflow-hidden">
      {/* Top: Invoice Details */}
      <div className="bg-white rounded shadow p-4 flex flex-wrap gap-4 flex-shrink-0">
        <div className="w-64">
          <SuggestionDropdown
            value={invoiceDetails.provider}
            onChange={(val, item) =>
              setInvoiceDetails({ ...invoiceDetails, provider: val })
            }
            fetchSuggestions={fetchProviders}
            placeholder="Provider"
            label="Provider"
            getLabel={(prov) => prov.name}
            onAddNew={(input) => setShowAddProvider(true)}
            // Patch: always show Add New if input is non-empty and no results
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Invoice Number
          </label>
          <input
            className="border rounded px-3 py-2 w-32"
            value={invoiceDetails.invoiceNumber}
            onChange={(e) =>
              setInvoiceDetails({
                ...invoiceDetails,
                invoiceNumber: e.target.value,
              })
            }
            placeholder="Invoice No."
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Invoice Date
          </label>
          <input
            type="date"
            className="border rounded px-3 py-2 w-40"
            value={invoiceDetails.invoiceDate}
            onChange={(e) =>
              setInvoiceDetails({
                ...invoiceDetails,
                invoiceDate: e.target.value,
              })
            }
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Payment Status
          </label>
          <select
            className="border rounded px-3 py-2 w-32"
            value={invoiceDetails.paymentStatus}
            onChange={(e) =>
              setInvoiceDetails({
                ...invoiceDetails,
                paymentStatus: e.target.value,
              })
            }
          >
            <option value="Paid">Paid</option>
            <option value="Remaining">Remaining</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Discount Total
          </label>
          <input
            className="border rounded px-3 py-2 w-24"
            value={invoiceDetails.discountTotal}
            onChange={(e) =>
              setInvoiceDetails({
                ...invoiceDetails,
                discountTotal: e.target.value,
              })
            }
            placeholder="0.00"
          />
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
              <th className="px-2 py-2 text-left">Quantity Received</th>
              <th className="px-2 py-2 text-left">Unit Cost</th>
              <th className="px-2 py-2 text-left">Discount Line</th>
              <th className="px-2 py-2 text-left">Free Quantity</th>
              <th className="px-2 py-2 text-left">Expiry Date</th>
              <th className="px-2 py-2 text-left">Remove</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b">
                <td className="px-2 py-1 align-middle">{idx + 1}</td>
                <td className="px-2 py-1 min-w-[14rem] max-w-[14rem] align-middle">
                  <div className="flex items-center min-w-0">
                    <SuggestionDropdown
                      value={row.medicine}
                      onChange={(val, item) =>
                        handleRowChange(idx, "medicine", val)
                      }
                      fetchSuggestions={fetchMedicines}
                      placeholder="Medicine"
                      getLabel={(med) => med.name}
                      onAddNew={(input) => {
                        setShowAddMedicine({ rowIdx: idx, input });
                        setNewMedicineName(input);
                      }}
                      inputClassName="!h-8 !min-h-0 !py-1 !px-2 !text-base !border !rounded w-full"
                      inputId={`medicine-input-${idx}`}
                      // Patch: always show Add New if input is non-empty and no results
                    />
                  </div>
                </td>
                <td className="px-2 py-1">
                  <input
                    className="border rounded px-2 py-1 w-32"
                    value={row.batchNumber}
                    onChange={(e) =>
                      handleRowChange(idx, "batchNumber", e.target.value)
                    }
                    placeholder="Batch No."
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="date"
                    className="border rounded px-2 py-1 w-36"
                    value={row.incomingDate}
                    onChange={(e) =>
                      handleRowChange(idx, "incomingDate", e.target.value)
                    }
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className="border rounded px-2 py-1 w-20"
                    value={row.quantityReceived}
                    onChange={(e) =>
                      handleRowChange(idx, "quantityReceived", e.target.value)
                    }
                    placeholder="Qty"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className="border rounded px-2 py-1 w-20"
                    value={row.unitCost}
                    onChange={(e) =>
                      handleRowChange(idx, "unitCost", e.target.value)
                    }
                    placeholder="Unit Cost"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className="border rounded px-2 py-1 w-20"
                    value={row.discountLine}
                    onChange={(e) =>
                      handleRowChange(idx, "discountLine", e.target.value)
                    }
                    placeholder="Discount"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className="border rounded px-2 py-1 w-20"
                    value={row.freeQuantity}
                    onChange={(e) =>
                      handleRowChange(idx, "freeQuantity", e.target.value)
                    }
                    placeholder="Free Qty"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="date"
                    className="border rounded px-2 py-1 w-36"
                    value={row.expiryDate}
                    onChange={(e) =>
                      handleRowChange(idx, "expiryDate", e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (idx === rows.length - 1) {
                          addRow();
                          setTimeout(() => {
                            const next = document.querySelector(
                              `#medicine-input-${idx + 1}`
                            ) as HTMLInputElement;
                            if (next) next.focus();
                          }, 10);
                        } else {
                          const next = document.querySelector(
                            `#medicine-input-${idx + 1}`
                          ) as HTMLInputElement;
                          if (next) next.focus();
                        }
                      }
                    }}
                  />
                </td>
                <td className="px-2 py-1">
                  <button
                    className="text-red-600 font-bold"
                    onClick={() => removeRow(idx)}
                    disabled={rows.length === 1}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Row Button */}
      <div className="flex-shrink-0">
        <button
          className="bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700 transition"
          onClick={addRow}
        >
          + Add Row
        </button>
      </div>

      {/* Bottom: Totals */}
      <div className="bg-white rounded shadow p-4 flex flex-row flex-wrap gap-6 items-end justify-between flex-shrink-0 mt-4">
        <div className="flex flex-row flex-wrap gap-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              SGST Total
            </label>
            <input
              className="border rounded px-3 py-2 w-24"
              value={invoiceDetails.sgstTotal}
              onChange={(e) =>
                setInvoiceDetails({
                  ...invoiceDetails,
                  sgstTotal: e.target.value,
                })
              }
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              CGST Total
            </label>
            <input
              className="border rounded px-3 py-2 w-24"
              value={invoiceDetails.cgstTotal}
              onChange={(e) =>
                setInvoiceDetails({
                  ...invoiceDetails,
                  cgstTotal: e.target.value,
                })
              }
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Total Amount
            </label>
            <input
              className="border rounded px-3 py-2 w-28"
              value={invoiceDetails.totalAmount}
              onChange={handleTotalAmountChange}
            />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 ml-auto">
          <button
            className="bg-teal-600 text-white px-6 py-2 rounded font-semibold hover:bg-teal-700 transition min-w-[120px]"
            onClick={handleSubmit}
            disabled={submitLoading}
          >
            {submitLoading ? "Submitting..." : "Submit"}
          </button>
          {submitError && (
            <div className="text-red-600 text-sm mt-1">{submitError}</div>
          )}
        </div>
      </div>

      {/* Add New Provider Modal */}
      {showAddProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-4 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Add New Provider</h2>
            <form onSubmit={handleProviderSubmit}>
              <div className="mb-3">
                <label className="block text-gray-700 font-semibold mb-1">
                  Name
                </label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={providerForm.name}
                  onChange={(e) =>
                    setProviderForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-gray-700 font-semibold mb-1">
                  Contact Email
                </label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  type="email"
                  value={providerForm.contactEmail}
                  onChange={(e) =>
                    setProviderForm((f) => ({
                      ...f,
                      contactEmail: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-gray-700 font-semibold mb-1">
                  Contact Phone
                </label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={providerForm.contactPhone}
                  onChange={(e) =>
                    setProviderForm((f) => ({
                      ...f,
                      contactPhone: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              {providerError && (
                <div className="text-red-600 mb-2">{providerError}</div>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700 transition"
                  disabled={providerLoading}
                >
                  {providerLoading ? "Adding..." : "Add Provider"}
                </button>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-semibold hover:bg-gray-300 transition"
                  onClick={() => setShowAddProvider(false)}
                  disabled={providerLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add New Medicine Modal */}
      {showAddMedicine && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-4 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Add New Medicine</h2>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-1">
                Medicine Name
              </label>
              <input
                className="border rounded px-3 py-2 w-full"
                value={newMedicineName}
                onChange={(e) => setNewMedicineName(e.target.value)}
                placeholder="Enter medicine name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-1">
                HSN
              </label>
              <input
                className="border rounded px-3 py-2 w-full"
                value={newMedicineHSN}
                onChange={(e) => setNewMedicineHSN(e.target.value)}
                placeholder="Enter HSN code"
              />
            </div>
            <div className="mb-4">
              <SuggestionDropdown
                value=""
                onChange={(val, item) => handleAddContentToMedicine(val, item)}
                fetchSuggestions={fetchContents}
                placeholder="Add content (ingredient)"
                label="Contents"
                getLabel={(c) => c.name}
                onAddNew={() => setShowContentForm(true)}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {newMedicineContents.map((c) => (
                  <span
                    key={c.contentId}
                    className="bg-teal-100 text-teal-800 px-2 py-1 rounded text-sm flex items-center"
                  >
                    {c.name}
                    <button
                      className="ml-1 text-red-500"
                      onClick={() => handleRemoveContentFromMedicine(c.name)}
                      aria-label={`Remove ${c.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {/* Persistent content creation sub-form */}
              {showContentForm && (
                <div className="mt-4 p-3 bg-gray-50 rounded shadow flex flex-col gap-2 relative">
                  <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                    onClick={() => setShowContentForm(false)}
                    aria-label="Close content form"
                    type="button"
                  >
                    ×
                  </button>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setInlineContentLoading(true);
                      setInlineContentError(null);
                      try {
                        const newContent = await createContent({
                          name: inlineContentName,
                        });
                        setNewMedicineContents([
                          ...newMedicineContents,
                          newContent,
                        ]);
                        setInlineContentName("");
                        setShowContentForm(false);
                      } catch (err: any) {
                        setInlineContentError(
                          err.message || "Failed to create content"
                        );
                      } finally {
                        setInlineContentLoading(false);
                      }
                    }}
                  >
                    <label className="block text-gray-700 font-semibold mb-1">
                      Content Name
                    </label>
                    <input
                      className="border rounded px-3 py-2 w-full mb-2"
                      value={inlineContentName}
                      onChange={(e) => setInlineContentName(e.target.value)}
                      placeholder="Enter content name"
                      required
                    />
                    {inlineContentError && (
                      <div className="text-red-600 mb-2">
                        {inlineContentError}
                      </div>
                    )}
                    <button
                      type="submit"
                      className="bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700 transition"
                      disabled={
                        inlineContentLoading || !inlineContentName.trim()
                      }
                    >
                      {inlineContentLoading ? "Creating..." : "Create"}
                    </button>
                  </form>
                </div>
              )}
            </div>
            {addMedicineError && (
              <div className="text-red-600 mb-2">{addMedicineError}</div>
            )}
            <div className="flex gap-2 mt-4">
              <button
                className="bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700 transition"
                disabled={
                  addMedicineLoading ||
                  !newMedicineName.trim() ||
                  !newMedicineHSN.trim()
                }
                onClick={async () => {
                  setAddMedicineLoading(true);
                  setAddMedicineError(null);
                  try {
                    // Collect contentIds from newMedicineContents (which may be objects or strings)
                    const contentIds = newMedicineContents
                      .map((c) => c.contentId)
                      .filter(Boolean);
                    const newMed = await createMedicine({
                      name: newMedicineName,
                      hsn: newMedicineHSN,
                      contentIds,
                    });
                    const idx = showAddMedicine.rowIdx;
                    const updated = [...rows];
                    updated[idx].medicine = newMed.name;
                    setRows(updated);
                    setShowAddMedicine(null);
                    setNewMedicineName("");
                    setNewMedicineHSN("");
                    setNewMedicineContents([]);
                  } catch (err: any) {
                    setAddMedicineError(
                      err.message || "Failed to add medicine"
                    );
                  } finally {
                    setAddMedicineLoading(false);
                  }
                }}
              >
                {addMedicineLoading ? "Adding..." : "Add Medicine"}
              </button>
              <button
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-semibold hover:bg-gray-300 transition"
                onClick={() => {
                  setShowAddMedicine(null);
                  setNewMedicineName("");
                  setNewMedicineHSN("");
                  setNewMedicineContents([]);
                  setShowContentForm(false);
                }}
                disabled={addMedicineLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Remove Add Content modal entirely */}
    </div>
  );
};

export default PurchaseInvoicePage;
