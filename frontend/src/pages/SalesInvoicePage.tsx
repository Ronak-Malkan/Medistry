import React, { useState, useEffect } from "react";
import SuggestionDropdown from "../components/SuggestionDropdown";

// Define Patient type locally for frontend use
type Patient = {
  patient_id: number;
  name: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
};

// Define MedicineStock type for frontend use
type MedicineStock = {
  medicineStockId: number;
  medicine: {
    medicineId: number;
    name: string;
  };
  batchNumber: string;
  expiryDate: string;
  incomingDate: string;
  quantityAvailable: number;
  price: string;
};

// Define UniqueMedicine type for dropdown
type UniqueMedicine = {
  medicineId: number;
  name: string;
  allStocks: MedicineStock[];
};

// Define a type for the row
interface MedicineRow {
  medicine: string;
  medicineId: number;
  batchNumber: string;
  quantity: string;
  price: string;
  discountLine: string;
  expiryDate: string;
  availableStock: MedicineStock[];
}

const initialRow: MedicineRow = {
  medicine: "",
  medicineId: 0,
  batchNumber: "",
  quantity: "",
  price: "",
  discountLine: "",
  expiryDate: "",
  availableStock: [],
};

// Bill types
const BILL_TYPES = [
  { value: "CA-BS", label: "CA-BS (Cash Sale)" },
  { value: "GENERAL", label: "General Sale" },
  { value: "DB-BS", label: "DB-BS (Credit Sale)" },
  { value: "CA-SR-BS", label: "CA-SR-BS (Cash Return)" },
];

// API fetchers with auth
async function fetchPatients(prefix: string) {
  const res = await fetch(
    `/api/patients/search?q=${encodeURIComponent(prefix)}`,
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

// New function to get unique medicines for dropdown
async function fetchUniqueMedicines(prefix: string): Promise<UniqueMedicine[]> {
  const stocks = await fetchMedicineStock(prefix);
  const uniqueMedicines = new Map<number, UniqueMedicine>();

  stocks.forEach((stock: MedicineStock) => {
    const medicineId = stock.medicine.medicineId;
    if (!uniqueMedicines.has(medicineId)) {
      uniqueMedicines.set(medicineId, {
        medicineId: stock.medicine.medicineId,
        name: stock.medicine.name,
        allStocks: stocks.filter(
          (s: MedicineStock) => s.medicine.medicineId === medicineId
        ),
      });
    }
  });

  return Array.from(uniqueMedicines.values());
}

async function createPatient(data: {
  name: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
}) {
  const res = await fetch("/api/patients", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error((await res.json()).message || "Failed to create patient");
  return await res.json();
}

interface SalesInvoicePageProps {
  defaultBillType?: string;
}

const SalesInvoicePage: React.FC<SalesInvoicePageProps> = ({
  defaultBillType = "CA-BS",
}) => {
  const [rows, setRows] = useState<MedicineRow[]>([{ ...initialRow }]);
  const [billDetails, setBillDetails] = useState({
    billType: defaultBillType,
    patient: "",
    patientId: 0,
    doctorName: "",
    billDate: new Date().toISOString().slice(0, 10),
    discountTotal: "",
    sgstTotal: "",
    cgstTotal: "",
    totalAmount: "",
  });

  // Patient form state
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [patientForm, setPatientForm] = useState({
    name: "",
    phone: "",
    address: "",
    date_of_birth: "",
    gender: "",
  });
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);

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
      const qty = parseFloat(row.quantity) || 0;
      const unit = parseFloat(row.price) || 0;
      const discount = parseFloat(row.discountLine) || 0;
      sum += qty * unit - discount;
    });
    const sgst = parseFloat(billDetails.sgstTotal) || 0;
    const cgst = parseFloat(billDetails.cgstTotal) || 0;
    const discountTotal = parseFloat(billDetails.discountTotal) || 0;
    const total = sum + sgst + cgst - discountTotal;
    setBillDetails((prev) => ({ ...prev, totalAmount: total.toFixed(2) }));
  }, [
    rows,
    billDetails.sgstTotal,
    billDetails.cgstTotal,
    billDetails.discountTotal,
    totalAmountOverride,
  ]);

  // If user edits totalAmount, treat as override
  const handleTotalAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTotalAmountOverride(e.target.value);
    setBillDetails((prev) => ({ ...prev, totalAmount: e.target.value }));
  };

  // If user clears override, recalc
  useEffect(() => {
    if (totalAmountOverride === null) return;
    if (totalAmountOverride.trim() === "") {
      setTotalAmountOverride(null);
    }
  }, [totalAmountOverride]);

  // Submit handler
  const handleSubmit = async () => {
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      // Validate required fields
      if (!billDetails.patient.trim()) {
        throw new Error("Patient name is required");
      }

      // Map rows to entries
      const entries = rows
        .filter((row) => row.medicine && row.quantity && row.price)
        .map((row) => ({
          medicineId: row.medicineId,
          batchNumber: row.batchNumber,
          quantity: parseInt(row.quantity) || 0,
          price: parseFloat(row.price) || 0,
          discountLine: parseFloat(row.discountLine) || 0,
        }));

      if (entries.length === 0) {
        throw new Error("At least one medicine entry is required");
      }

      // Prepare bill
      const bill = {
        patient: { name: billDetails.patient },
        doctor_name: billDetails.doctorName,
        bill_date: billDetails.billDate,
        discount_total: parseFloat(billDetails.discountTotal) || 0,
        sgst_total: parseFloat(billDetails.sgstTotal) || 0,
        cgst_total: parseFloat(billDetails.cgstTotal) || 0,
        total_amount: parseFloat(billDetails.totalAmount) || 0,
        credit: billDetails.billType === "DB-BS",
      };

      // POST to API
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
        },
        credentials: "include",
        body: JSON.stringify({ bill, entries }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create sales bill");
      }

      // Success: reset form or show success message
      setSubmitLoading(false);
      alert("Sales bill created successfully!");

      // Reset form
      setRows([{ ...initialRow }]);
      setBillDetails({
        billType: defaultBillType,
        patient: "",
        patientId: 0,
        doctorName: "",
        billDate: new Date().toISOString().slice(0, 10),
        discountTotal: "",
        sgstTotal: "",
        cgstTotal: "",
        totalAmount: "",
      });
      setTotalAmountOverride(null);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create sales bill");
      setSubmitLoading(false);
    }
  };

  const handleRowChange = (
    idx: number,
    field: keyof MedicineRow,
    value: string | number | MedicineStock[]
  ) => {
    const updated = [...rows];
    updated[idx] = { ...updated[idx], [field]: value };
    setRows(updated);
  };

  const addRow = () => setRows([...rows, { ...initialRow }]);
  const removeRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx));

  // Handler for patient creation
  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPatientLoading(true);
    setPatientError(null);
    try {
      const newPatient = await createPatient(patientForm);
      setBillDetails((prev) => ({
        ...prev,
        patient: newPatient.name,
        patientId: newPatient.patient_id,
      }));
      setShowAddPatient(false);
      setPatientForm({
        name: "",
        phone: "",
        address: "",
        date_of_birth: "",
        gender: "",
      });
    } catch (err: any) {
      setPatientError(err.message || "Failed to create patient");
    } finally {
      setPatientLoading(false);
    }
  };

  // Handler for patient selection
  const handlePatientSelect = (val: string, item?: Patient) => {
    setBillDetails((prev) => ({
      ...prev,
      patient: val,
      patientId: item?.patient_id || 0,
    }));
  };

  // Handler for medicine selection
  const handleMedicineSelect = (
    idx: number,
    val: string,
    item?: UniqueMedicine
  ) => {
    const updated = [...rows];
    updated[idx].medicine = val;
    updated[idx].medicineId = item?.medicineId || 0;
    updated[idx].availableStock = item?.allStocks || [];
    updated[idx].batchNumber = "";
    updated[idx].expiryDate = "";
    updated[idx].price = "";

    setRows(updated);
  };

  // Handler for batch selection
  const handleBatchSelect = (
    idx: number,
    batchNumber: string,
    stock?: MedicineStock
  ) => {
    const updated = [...rows];
    const selectedStock =
      stock ||
      updated[idx].availableStock.find((s) => s.batchNumber === batchNumber);

    if (selectedStock) {
      updated[idx].batchNumber = batchNumber;
      updated[idx].expiryDate = selectedStock.expiryDate;
      updated[idx].price = selectedStock.price;
    }

    setRows(updated);
  };

  return (
    <div className="p-6 flex-1 flex flex-col min-h-0 gap-y-4">
      {/* Top: Bill Details */}
      <div className="bg-white rounded shadow p-4 flex flex-wrap gap-4 flex-shrink-0">
        <div className="w-48">
          <label className="block text-gray-700 font-semibold mb-1">
            Bill Type
          </label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={billDetails.billType}
            onChange={(e) =>
              setBillDetails({ ...billDetails, billType: e.target.value })
            }
          >
            {BILL_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="w-64">
          <SuggestionDropdown
            value={billDetails.patient}
            onChange={handlePatientSelect}
            fetchSuggestions={fetchPatients}
            placeholder="Patient Name"
            label="Patient"
            getLabel={(patient: Patient) => patient.name}
            onAddNew={(input) => {
              setPatientForm((prev) => ({ ...prev, name: input }));
              setShowAddPatient(true);
            }}
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Doctor Name
          </label>
          <input
            className="border rounded px-3 py-2 w-48"
            value={billDetails.doctorName}
            onChange={(e) =>
              setBillDetails({ ...billDetails, doctorName: e.target.value })
            }
            placeholder="Doctor Name"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Bill Date
          </label>
          <input
            type="date"
            className="border rounded px-3 py-2 w-40"
            value={billDetails.billDate}
            onChange={(e) =>
              setBillDetails({ ...billDetails, billDate: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Discount Total
          </label>
          <input
            className="border rounded px-3 py-2 w-24"
            value={billDetails.discountTotal}
            onChange={(e) =>
              setBillDetails({ ...billDetails, discountTotal: e.target.value })
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
              <th className="px-2 py-2 text-left">Quantity</th>
              <th className="px-2 py-2 text-left">Price</th>
              <th className="px-2 py-2 text-left">Discount Line</th>
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
                        handleMedicineSelect(idx, val, item)
                      }
                      fetchSuggestions={fetchUniqueMedicines}
                      placeholder="Medicine"
                      getLabel={(medicine: UniqueMedicine) => medicine.name}
                      inputClassName="!h-8 !min-h-0 !py-1 !px-2 !text-base !border !rounded w-full"
                      inputId={`medicine-input-${idx}`}
                    />
                  </div>
                </td>
                <td className="px-2 py-1 min-w-[8rem] max-w-[8rem] align-middle">
                  <div className="flex items-center min-w-0">
                    <SuggestionDropdown
                      value={row.batchNumber}
                      onChange={(val, item) =>
                        handleBatchSelect(idx, val, item)
                      }
                      staticOptions={row.availableStock
                        .slice()
                        .sort((a, b) =>
                          a.expiryDate.localeCompare(b.expiryDate)
                        )}
                      placeholder="Select Batch"
                      getLabel={(stock: MedicineStock) => stock.batchNumber}
                      renderItem={(
                        stock: MedicineStock,
                        highlighted: boolean
                      ) => (
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {stock.batchNumber}
                          </span>
                          <span className="text-xs text-gray-500">
                            Exp: {stock.expiryDate} • Qty:{" "}
                            {stock.quantityAvailable}
                          </span>
                        </div>
                      )}
                      disabled={!row.availableStock.length}
                      inputClassName="!h-8 !min-h-0 !py-1 !px-2 !text-base !border !rounded w-full"
                      inputId={`batch-input-${idx}`}
                    />
                  </div>
                </td>
                <td className="px-2 py-1">
                  <input
                    className="border rounded px-2 py-1 w-20"
                    value={row.quantity}
                    onChange={(e) =>
                      handleRowChange(idx, "quantity", e.target.value)
                    }
                    placeholder="Qty"
                    type="number"
                    min="0"
                    max={
                      row.availableStock.find(
                        (s) => s.batchNumber === row.batchNumber
                      )?.quantityAvailable || ""
                    }
                  />
                </td>
                <td className="px-2 py-1">
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
                </td>
                <td className="px-2 py-1">
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
                </td>
                <td className="px-2 py-1">
                  <input
                    type="date"
                    className="border rounded px-2 py-1 w-36 bg-gray-100"
                    value={row.expiryDate}
                    readOnly
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
              value={billDetails.sgstTotal}
              onChange={(e) =>
                setBillDetails({ ...billDetails, sgstTotal: e.target.value })
              }
              type="number"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              CGST Total
            </label>
            <input
              className="border rounded px-3 py-2 w-24"
              value={billDetails.cgstTotal}
              onChange={(e) =>
                setBillDetails({ ...billDetails, cgstTotal: e.target.value })
              }
              type="number"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Total Amount
            </label>
            <input
              className="border rounded px-3 py-2 w-28"
              value={billDetails.totalAmount}
              onChange={handleTotalAmountChange}
              type="number"
              min="0"
              step="0.01"
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

      {/* Add New Patient Modal */}
      {showAddPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-4 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Add New Patient</h2>
            <form onSubmit={handlePatientSubmit}>
              <div className="mb-3">
                <label className="block text-gray-700 font-semibold mb-1">
                  Name *
                </label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={patientForm.name}
                  onChange={(e) =>
                    setPatientForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-gray-700 font-semibold mb-1">
                  Phone
                </label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={patientForm.phone}
                  onChange={(e) =>
                    setPatientForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
              <div className="mb-3">
                <label className="block text-gray-700 font-semibold mb-1">
                  Address
                </label>
                <textarea
                  className="border rounded px-3 py-2 w-full"
                  value={patientForm.address}
                  onChange={(e) =>
                    setPatientForm((f) => ({ ...f, address: e.target.value }))
                  }
                  rows={2}
                />
              </div>
              <div className="mb-3">
                <label className="block text-gray-700 font-semibold mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  className="border rounded px-3 py-2 w-full"
                  value={patientForm.date_of_birth}
                  onChange={(e) =>
                    setPatientForm((f) => ({
                      ...f,
                      date_of_birth: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="mb-3">
                <label className="block text-gray-700 font-semibold mb-1">
                  Gender
                </label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={patientForm.gender}
                  onChange={(e) =>
                    setPatientForm((f) => ({ ...f, gender: e.target.value }))
                  }
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {patientError && (
                <div className="text-red-600 mb-2">{patientError}</div>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700 transition"
                  disabled={patientLoading}
                >
                  {patientLoading ? "Adding..." : "Add Patient"}
                </button>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-semibold hover:bg-gray-300 transition"
                  onClick={() => setShowAddPatient(false)}
                  disabled={patientLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesInvoicePage;
