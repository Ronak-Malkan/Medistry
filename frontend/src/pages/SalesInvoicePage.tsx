import React from "react";

const SalesInvoicePage: React.FC = () => {
  return (
    <div className="p-6 flex-1">
      <h1 className="text-2xl font-bold mb-4">Sales Invoice</h1>
      {/* Billing type selector */}
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">
          Billing Type
        </label>
        <select className="border rounded px-3 py-2 w-64">
          <option value="CA-BS">CA-BS (Prescription Sale)</option>
          <option value="GENERAL">GENERAL (OTC Sale)</option>
          <option value="DB-BS">DB-BS (Credit/Tab Sale)</option>
          <option value="CA-SR-BS">CA-SR-BS (Sales Return)</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Only CA-BS is functional for now.
        </p>
      </div>
      {/* Table/grid for bulk entry will go here */}
      <div className="bg-white rounded shadow p-4 mb-4">
        <p className="text-gray-700">
          Bulk entry table for sales will be implemented here.
        </p>
        {/* Dropdowns for medicine, batch, etc. will be implemented here */}
      </div>
    </div>
  );
};

export default SalesInvoicePage;
