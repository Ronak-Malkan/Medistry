import React, { useState, useEffect } from "react";
import SuggestionDropdown from "../components/SuggestionDropdown";

// Types
interface Medicine {
  medicineId: number;
  name: string;
  hsn: string;
  contents: Content[];
  createdAt: string;
  updatedAt: string;
}

interface Content {
  contentId: number;
  name: string;
}

interface MedicineFormData {
  name: string;
  hsn: string;
  contentIds: number[];
}

// API functions
async function fetchMedicines(prefix?: string) {
  const url = prefix
    ? `/api/medicines/search?prefix=${encodeURIComponent(prefix)}`
    : "/api/medicines/master";

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return prefix ? data : data.medicines || [];
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

async function createMedicine(data: MedicineFormData) {
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
    throw new Error((await res.json()).error || "Failed to create medicine");
  return await res.json();
}

async function updateMedicine(id: number, data: Partial<MedicineFormData>) {
  const res = await fetch(`/api/medicines/master/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error((await res.json()).error || "Failed to update medicine");
  return await res.json();
}

async function deleteMedicine(id: number) {
  const res = await fetch(`/api/medicines/master/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete medicine");
}

async function createContent(name: string) {
  const res = await fetch("/api/contents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  if (!res.ok)
    throw new Error((await res.json()).message || "Failed to create content");
  return await res.json();
}

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [formData, setFormData] = useState<MedicineFormData>({
    name: "",
    hsn: "",
    contentIds: [],
  });
  const [selectedContents, setSelectedContents] = useState<Content[]>([]);
  const [showContentForm, setShowContentForm] = useState(false);
  const [newContentName, setNewContentName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load medicines
  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const data = await fetchMedicines(searchTerm);
      setMedicines(data);
    } catch (err) {
      setError("Failed to load medicines");
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
      const data = await fetchMedicines(prefix);
      setMedicines(data);
    } catch (err) {
      setError("Failed to search medicines");
    } finally {
      setLoading(false);
    }
  };

  // Form handlers
  const handleAddContent = (val: string, item?: Content) => {
    if (item && !selectedContents.some((c) => c.contentId === item.contentId)) {
      setSelectedContents([...selectedContents, item]);
      setFormData((prev) => ({
        ...prev,
        contentIds: [...prev.contentIds, item.contentId],
      }));
    }
  };

  const handleRemoveContent = (contentId: number) => {
    setSelectedContents(
      selectedContents.filter((c) => c.contentId !== contentId)
    );
    setFormData((prev) => ({
      ...prev,
      contentIds: prev.contentIds.filter((id) => id !== contentId),
    }));
  };

  const handleCreateContent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newContentName.trim()) return;

    try {
      const newContent = await createContent(newContentName.trim());
      setSelectedContents([...selectedContents, newContent]);
      setFormData((prev) => ({
        ...prev,
        contentIds: [...prev.contentIds, newContent.contentId],
      }));
      setNewContentName("");
      setShowContentForm(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.hsn.trim()) {
      setError("Name and HSN are required");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (editingMedicine) {
        await updateMedicine(editingMedicine.medicineId, formData);
        setSuccess("Medicine updated successfully!");
      } else {
        await createMedicine(formData);
        setSuccess("Medicine created successfully!");
      }

      // Reset form and reload
      setFormData({ name: "", hsn: "", contentIds: [] });
      setSelectedContents([]);
      setEditingMedicine(null);
      setShowAddModal(false);
      loadMedicines();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name,
      hsn: medicine.hsn,
      contentIds: medicine.contents.map((c) => c.contentId),
    });
    setSelectedContents(medicine.contents);
    setShowAddModal(true);
  };

  const handleDelete = async (medicine: Medicine) => {
    if (!confirm(`Are you sure you want to delete "${medicine.name}"?`)) return;

    try {
      await deleteMedicine(medicine.medicineId);
      setSuccess("Medicine deleted successfully!");
      loadMedicines();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", hsn: "", contentIds: [] });
    setSelectedContents([]);
    setEditingMedicine(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="flex-1 w-full">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-extrabold mb-2 text-teal-700 tracking-tight">
            Medicines
          </h1>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700 transition"
          >
            + Add Medicine
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Search medicines..."
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

        {/* Medicines Table */}
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
                      HSN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contents
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
                  {medicines.map((medicine) => (
                    <tr key={medicine.medicineId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {medicine.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {medicine.hsn}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {medicine.contents.map((content) => (
                            <span
                              key={content.contentId}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800"
                            >
                              {content.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(medicine.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(medicine)}
                          className="text-teal-600 hover:text-teal-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(medicine)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {medicines.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No medicines found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-teal-700">
                {editingMedicine ? "Edit Medicine" : "Add New Medicine"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Medicine Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter medicine name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    HSN Code *
                  </label>
                  <input
                    type="text"
                    value={formData.hsn}
                    onChange={(e) =>
                      setFormData({ ...formData, hsn: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter HSN code"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Contents
                  </label>
                  <SuggestionDropdown
                    value=""
                    onChange={(val, item) =>
                      handleAddContent(val, item as Content)
                    }
                    fetchSuggestions={fetchContents}
                    placeholder="Search and add contents..."
                    getLabel={(content) => content.name}
                    onAddNew={() => setShowContentForm(true)}
                  />

                  {/* Selected Contents */}
                  {selectedContents.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedContents.map((content) => (
                        <span
                          key={content.contentId}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800"
                        >
                          {content.name}
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveContent(content.contentId)
                            }
                            className="ml-2 text-teal-600 hover:text-teal-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Inline Content Creation */}
                  {showContentForm && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newContentName}
                          onChange={(e) => setNewContentName(e.target.value)}
                          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Enter content name"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCreateContent(e as any);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => handleCreateContent(e as any)}
                          className="bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700 transition"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowContentForm(false)}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded font-semibold hover:bg-gray-400 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-teal-600 text-white px-6 py-2 rounded font-semibold hover:bg-teal-700 transition disabled:opacity-50"
                  >
                    {submitting
                      ? "Saving..."
                      : editingMedicine
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
