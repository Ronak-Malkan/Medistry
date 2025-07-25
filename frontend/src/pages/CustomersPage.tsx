import React, { useState, useEffect } from "react";

// Types
interface Customer {
  customerId: number;
  name: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomerFormData {
  name: string;
  phone?: string;
  address?: string;
}

// API functions
async function fetchCustomers(prefix?: string) {
  const url = prefix
    ? `/api/customers/search?q=${encodeURIComponent(prefix)}`
    : "/api/customers";

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return prefix ? data : data.customers || [];
}

async function createCustomer(data: CustomerFormData) {
  const res = await fetch("/api/customers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error((await res.json()).message || "Failed to create customer");
  return await res.json();
}

async function updateCustomer(id: number, data: Partial<CustomerFormData>) {
  const res = await fetch(`/api/customers/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error((await res.json()).message || "Failed to update customer");
  return await res.json();
}

async function deleteCustomer(id: number) {
  const res = await fetch(`/api/customers/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete customer");
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    phone: "",
    address: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load customers
  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    console.log("customers", customers);
  }, [customers, setCustomers]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomers(searchTerm);
      setCustomers(data);
    } catch (err) {
      setError("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  // Search handler
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const prefix = e.target.value;
    console.log("prefix", prefix);
    setSearchTerm(prefix);
    setLoading(true);
    try {
      const data = await fetchCustomers(prefix);
      setCustomers(data);
    } catch (err) {
      setError("Failed to search customers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.customerId, formData);
        setSuccess("Customer updated successfully!");
      } else {
        await createCustomer(formData);
        setSuccess("Customer created successfully!");
      }

      // Reset form and reload
      setFormData({ name: "", phone: "", address: "" });
      setEditingCustomer(null);
      setShowAddModal(false);
      loadCustomers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setShowAddModal(true);
  };

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to delete "${customer.name}"?`)) return;

    try {
      await deleteCustomer(customer.customerId);
      setSuccess("Customer deleted successfully!");
      loadCustomers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", phone: "", address: "" });
    setEditingCustomer(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="flex-1 w-full">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-extrabold mb-2 text-teal-700 tracking-tight">
            Customers
          </h1>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700 transition"
          >
            + Add Customer
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              {/* <SuggestionDropdown
                value={searchTerm}
                onChange={(val) => handleSearch(val)}
                fetchSuggestions={fetchCustomers}
                placeholder="Search customers..."
                getLabel={(customer: Customer) => customer.name}
                inputClassName="w-full border rounded px-3 py-2"
              /> */}
              <div className="relative w-full">
                <input
                  className="w-full border rounded px-3 py-2"
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Search customers..."
                  autoComplete="off"
                />
              </div>
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

        {/* Customers Table */}
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
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.customerId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {customer.phone || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {customer.address || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-teal-600 hover:text-teal-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(customer)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {customers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No customers found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-teal-700">
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter address"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-teal-600 text-white px-6 py-2 rounded font-semibold hover:bg-teal-700 transition disabled:opacity-50"
                  >
                    {submitting
                      ? "Saving..."
                      : editingCustomer
                      ? "Update"
                      : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowAddModal(false);
                    }}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded font-semibold hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
