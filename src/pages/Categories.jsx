import { useEffect, useMemo, useState } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/categories";

export default function Categories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // create form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // edit modal state
  const [editing, setEditing] = useState(null); // category object or null
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [items]);

  const fetchAll = async () => {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const res = await getCategories();
      setItems(res.data.categories || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    try {
      await createCategory({ name: name.trim(), description: description.trim() });
      setName("");
      setDescription("");
      setNotice("Category created");
      fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create category");
    }
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setEditName(cat.name || "");
    setEditDescription(cat.description || "");
    setError("");
    setNotice("");
  };

  const onUpdate = async (e) => {
    e.preventDefault();
    if (!editing?._id) return;

    setError("");
    setNotice("");

    if (!editName.trim()) {
      setError("Category name is required");
      return;
    }

    try {
      await updateCategory(editing._id, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setEditing(null);
      setNotice("Category updated");
      fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update category");
    }
  };

  const onDelete = async (cat) => {
    const ok = window.confirm(`Delete category "${cat.name}"?`);
    if (!ok) return;

    setError("");
    setNotice("");

    try {
      await deleteCategory(cat._id);
      setNotice("Category deleted");
      fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete category");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Categories</h2>
        <button
          onClick={fetchAll}
          className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {(error || notice) && (
        <div
          className={`rounded-xl p-3 ${
            error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}
        >
          {error || notice}
        </div>
      )}

      {/* Create category */}
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-semibold mb-3">Add Category</h3>
        <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="border rounded-lg p-2"
            placeholder="Category name (e.g. CPU, GPU, PSU)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="border rounded-lg p-2 md:col-span-2"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="md:col-span-3">
            <button className="px-4 py-2 rounded-lg bg-black text-white">
              Create
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">All Categories</h3>
          <p className="text-sm text-gray-500">
            Total: {sorted.length}
          </p>
        </div>

        {loading ? (
          <div className="p-4 text-gray-600">Loading…</div>
        ) : sorted.length === 0 ? (
          <div className="p-4 text-gray-600">No categories yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((cat) => (
                  <tr key={cat._id} className="border-t">
                    <td className="p-3 font-medium">{cat.name}</td>
                    <td className="p-3 text-gray-600">{cat.slug}</td>
                    <td className="p-3 text-gray-600">{cat.description || "—"}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        className="px-3 py-1 rounded-lg border hover:bg-gray-50"
                        onClick={() => openEdit(cat)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1 rounded-lg border text-red-600 hover:bg-red-50"
                        onClick={() => onDelete(cat)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">Edit Category</h3>
              <button
                onClick={() => setEditing(null)}
                className="px-3 py-1 rounded-lg border hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={onUpdate} className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <input
                  className="w-full border rounded-lg p-2 mt-1"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Description</label>
                <input
                  className="w-full border rounded-lg p-2 mt-1"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-lg bg-black text-white">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-lg border hover:bg-gray-50"
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
}
