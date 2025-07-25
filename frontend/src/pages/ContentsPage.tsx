import React, { useState, useEffect } from "react";
import SuggestionDropdown from "../components/SuggestionDropdown";

// Types
interface Content {
  contentId: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface ContentFormData {
  name: string;
}

// API functions
async function fetchContents(prefix?: string) {
  const url = prefix
    ? `/api/contents/search?prefix=${encodeURIComponent(prefix)}`
    : "/api/contents";

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return prefix ? data : data.contents || [];
}

async function createContent(data: ContentFormData) {
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

async function updateContent(id: number, data: ContentFormData) {
  const res = await fetch(`/api/contents/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error((await res.json()).message || "Failed to update content");
  return await res.json();
}

async function deleteContent(id: number) {
  const res = await fetch(`/api/contents/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("medistry_jwt")}`,
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete content");
}

export default function ContentsPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [formData, setFormData] = useState<ContentFormData>({
    name: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load contents
  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    setLoading(true);
    try {
      const data = await fetchContents(searchTerm);
      setContents(data);
    } catch (err) {
      setError("Failed to load contents");
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
      const data = await fetchContents(prefix);
      setContents(data);
    } catch (err) {
      setError("Failed to search contents");
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
      if (editingContent) {
        await updateContent(editingContent.contentId, formData);
        setSuccess("Content updated successfully!");
      } else {
        await createContent(formData);
        setSuccess("Content created successfully!");
      }

      // Reset form and reload
      setFormData({ name: "" });
      setEditingContent(null);
      setShowAddModal(false);
      loadContents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (content: Content) => {
    setEditingContent(content);
    setFormData({
      name: content.name,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (content: Content) => {
    if (!confirm(`Are you sure you want to delete "${content.name}"?`)) return;

    try {
      await deleteContent(content.contentId);
      setSuccess("Content deleted successfully!");
      loadContents();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: "" });
    setEditingContent(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="flex-1 w-full">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-extrabold mb-2 text-teal-700 tracking-tight">
            Contents
          </h1>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700 transition"
          >
            + Add Content
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative w-full">
                <input
                  className="w-full border rounded px-3 py-2"
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Search contents..."
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

        {/* Contents Table */}
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
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contents.map((content) => (
                    <tr key={content.contentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {content.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(content.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(content.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(content)}
                          className="text-teal-600 hover:text-teal-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(content)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No contents found
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
                {editingContent ? "Edit Content" : "Add New Content"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Content Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter content name"
                    required
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
                      : editingContent
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
