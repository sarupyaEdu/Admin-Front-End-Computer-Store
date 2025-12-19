import { useEffect, useState } from "react";
import ProductForm from "../components/ProductForm";
import { useSearchParams } from "react-router-dom";

import {
  createProduct,
  deleteProduct,
  deleteProductImage,
  listProducts,
  updateProduct,
} from "../api/products";
import { getCategories } from "../api/categories";
import { uploadMultipleImages } from "../api/uploads";

const getDiscountPercent = (p) => {
  if (!p.discountPrice || p.discountPrice >= p.price) return 0;
  return Math.round(((p.price - p.discountPrice) / p.price) * 100);
};

export default function Products() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");

  // edit modal
  const [editing, setEditing] = useState(null); // product object or null
  const [editPayload, setEditPayload] = useState({
    title: "",
    brand: "",
    price: "",
    discountPrice: "",
    stock: 0,
    category: "",
    description: "",
    images: [], // [{url, public_id}]
  });

  // edit image upload
  const [editFiles, setEditFiles] = useState([]);
  const [editUploading, setEditUploading] = useState(false);
  
  // search & filters
  const [searchParams, setSearchParams] = useSearchParams();
  // search & filters (initialize from URL)
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [filterCategory, setFilterCategory] = useState(
    searchParams.get("category") || ""
  );
  const [availability, setAvailability] = useState(
    searchParams.get("availability") || ""
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "");


  useEffect(() => {
    const params = {};

    if (search) params.search = search;
    if (filterCategory) params.category = filterCategory;
    if (availability) params.availability = availability;
    if (sortBy) params.sort = sortBy;

    setSearchParams(params);
  }, [search, filterCategory, availability, sortBy, setSearchParams]);

  // "", "price-asc", "price-desc", "discount-desc"

  const fetchAll = async () => {
    setErr("");
    setNotice("");
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([listProducts(), getCategories()]);
      setItems(pRes.data.products || []);
      setCats(cRes.data.categories || []);
    } catch (e) {
      setErr(
        e?.response?.data?.message || "Failed to load products/categories"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const onCreate = async (payload) => {
    setErr("");
    setNotice("");
    try {
      await createProduct(payload);
      setNotice("Product created");
      fetchAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to create product");
    }
  };

  const onDeleteProduct = async (p) => {
    const ok = window.confirm(
      `Delete product "${p.title}"?\nCloud images will also be deleted.`
    );
    if (!ok) return;

    setErr("");
    setNotice("");
    try {
      await deleteProduct(p._id);
      setNotice("Product deleted");
      fetchAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to delete product");
    }
  };

  const openEdit = (p) => {
    setErr("");
    setNotice("");
    setEditing(p);

    setEditPayload({
      title: p.title || "",
      brand: p.brand || "",
      price: p.price ?? "",
      discountPrice: p.discountPrice ?? "",
      stock: p.stock ?? 0,
      category: p.category?._id || p.category || "",
      description: p.description || "",
      images: Array.isArray(p.images) ? p.images : [],
    });

    setEditFiles([]);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditFiles([]);
  };

  const change = (key, value) => {
    setEditPayload((prev) => ({ ...prev, [key]: value }));
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editing?._id) return;

    setErr("");
    setNotice("");

    if (!editPayload.title.trim()) return setErr("Title is required");
    if (!editPayload.category) return setErr("Category is required");
    if (editPayload.price === "" || Number(editPayload.price) < 0)
      return setErr("Valid price is required");
    if (!editPayload.images?.length)
      return setErr("Product must have at least 1 image");

    try {
      await updateProduct(editing._id, {
        title: editPayload.title.trim(),
        brand: editPayload.brand.trim(),
        price: Number(editPayload.price),
        discountPrice:
          editPayload.discountPrice === "" || editPayload.discountPrice === null
            ? undefined
            : Number(editPayload.discountPrice),
        stock: Number(editPayload.stock),
        category: editPayload.category,
        description: editPayload.description.trim(),
        images: editPayload.images, // keep updated images array
      });

      setNotice("Product updated");
      closeEdit();
      fetchAll();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to update product");
    }
  };

  const deleteOneImage = async (public_id) => {
    if (!editing?._id) return;

    const ok = window.confirm("Delete this image from product?");
    if (!ok) return;

    setErr("");
    setNotice("");

    try {
      await deleteProductImage(editing._id, public_id);
      // refresh product list and also update modal state
      const updated = await listProducts();
      const nextItems = updated.data.products || [];
      setItems(nextItems);

      const fresh = nextItems.find((x) => x._id === editing._id);
      if (fresh) {
        setEditing(fresh);
        setEditPayload((prev) => ({
          ...prev,
          images: fresh.images || [],
        }));
      }

      setNotice("Image removed");
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to remove image");
    }
  };

  const pickEditFiles = (e) => {
    setEditFiles(Array.from(e.target.files || []));
  };

  const uploadEditImages = async () => {
    if (!editFiles.length) {
      setErr("Select images first");
      return;
    }

    setErr("");
    setNotice("");
    setEditUploading(true);

    try {
      const res = await uploadMultipleImages(editFiles);
      const imgs = (res.data.images || []).map((x) => ({
        url: x.imageUrl || x.url,
        public_id: x.public_id,
      }));

      setEditPayload((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...imgs],
      }));

      setEditFiles([]);
      setNotice("Images uploaded (remember to click Save)");
    } catch (e) {
      setErr(e?.response?.data?.message || "Upload failed");
    } finally {
      setEditUploading(false);
    }
  };

  const processedItems = items
    .filter((p) => {
      // search (title + brand)
      const q = search.toLowerCase();
      const matchesSearch =
        p.title.toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q) ||
        (p.category?.name || "").toLowerCase().includes(q);

      // category filter
      const matchesCategory =
        !filterCategory || p.category?._id === filterCategory;

      // availability filter
      const matchesAvailability =
        availability === ""
          ? true
          : availability === "in"
          ? p.stock > 0
          : p.stock === 0;

      return matchesSearch && matchesCategory && matchesAvailability;
    })
    .sort((a, b) => {
      const finalPrice = (p) => p.discountPrice ?? p.price;

      if (sortBy === "price-asc") return finalPrice(a) - finalPrice(b);
      if (sortBy === "price-desc") return finalPrice(b) - finalPrice(a);

      if (sortBy === "discount-desc")
        return getDiscountPercent(b) - getDiscountPercent(a);
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Products</h2>
        <button
          onClick={fetchAll}
          className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {(err || notice) && (
        <div
          className={`rounded-xl p-3 ${
            err ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}
        >
          {err || notice}
        </div>
      )}

      {/* CREATE */}
      <ProductForm onCreate={onCreate} />

      <div className="bg-white rounded-xl shadow p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Search & Filters</h3>

          <button
            onClick={() => {
              setSearch("");
              setFilterCategory("");
              setAvailability("");
              setSortBy("");
              setSearchParams({});
            }}
            disabled={!search && !filterCategory && !availability && !sortBy}
            className={`px-3 py-2 border rounded-lg text-sm transition
    ${
      !search && !filterCategory && !availability && !sortBy
        ? "opacity-50 cursor-not-allowed"
        : "hover:bg-gray-50"
    }`}
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            className="border rounded-lg p-2"
            placeholder="Search by title, brand, or category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border rounded-lg p-2"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {cats.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="border rounded-lg p-2"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="">All Availability</option>
            <option value="in">In Stock</option>
            <option value="out">Out of Stock</option>
          </select>

          <select
            className="border rounded-lg p-2"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="">No Sorting</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="discount-desc">Discount: High → Low</option>
          </select>
        </div>

        <div className="text-sm text-gray-500">
          Showing <b>{processedItems.length}</b> of {items.length} products
        </div>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">All Products</h3>
          <p className="text-sm text-gray-500">Total: {items.length}</p>
        </div>

        {loading ? (
          <div className="p-4 text-gray-600">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-gray-600">No products yet.</div>
        ) : (
          <div className="divide-y">
            {processedItems.map((p) => (
              <div key={p._id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-lg flex items-center gap-2">
                      {p.title}

                      {getDiscountPercent(p) > 0 && (
                        <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">
                          {getDiscountPercent(p)}% OFF
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600">
                      Price: ₹{p.price}{" "}
                      {p.discountPrice ? `(Discount: ₹${p.discountPrice})` : ""}
                    </div>
                    <div className="text-sm text-gray-600">
                      Available Quantity (Stock):{" "}
                      <span
                        className={`font-medium ${
                          p.stock === 0
                            ? "text-red-600"
                            : p.stock <= 5
                            ? "text-orange-600"
                            : ""
                        }`}
                      >
                        {p.stock}
                      </span>{" "}
                      • Category: {p.category?.name || "—"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Slug: {p.slug}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="px-3 py-2 rounded-lg border hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteProduct(p)}
                      className="px-3 py-2 rounded-lg border text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {p.images?.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-10 gap-2">
                    {p.images.slice(0, 10).map((img) => (
                      <img
                        key={img.public_id}
                        src={img.url}
                        alt=""
                        className="w-full h-16 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">Edit Product</h3>
              <button
                onClick={closeEdit}
                className="px-3 py-1 rounded-lg border hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={saveEdit}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <input
                className="border rounded-lg p-2"
                value={editPayload.title}
                onChange={(e) => change("title", e.target.value)}
                placeholder="Title"
              />
              <input
                className="border rounded-lg p-2"
                value={editPayload.brand}
                onChange={(e) => change("brand", e.target.value)}
                placeholder="Brand"
              />
              <input
                type="number"
                className="border rounded-lg p-2"
                value={editPayload.price}
                onChange={(e) => change("price", e.target.value)}
                placeholder="Price"
              />
              <input
                type="number"
                className="border rounded-lg p-2"
                value={editPayload.discountPrice}
                onChange={(e) => change("discountPrice", e.target.value)}
                placeholder="Discount Price (optional)"
              />

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Available Quantity (Stock)
                </label>
                <input
                  type="number"
                  min="0"
                  className="border rounded-lg p-2 w-full mt-1"
                  value={editPayload.stock}
                  onChange={(e) => change("stock", e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of units available for customers. <b>0</b> means out of
                  stock.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  className="border rounded-lg p-2 w-full mt-1"
                  value={editPayload.category}
                  onChange={(e) => change("category", e.target.value)}
                >
                  <option value="">Select category</option>
                  {cats.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                className="border rounded-lg p-2 md:col-span-2"
                rows={3}
                value={editPayload.description}
                onChange={(e) => change("description", e.target.value)}
                placeholder="Description"
              />

              {/* Images manager */}
              <div className="md:col-span-2 border rounded-xl p-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-medium">Images</div>
                    <div className="text-sm text-gray-500">
                      You can delete images (backend blocks deleting last image)
                      or upload more.
                    </div>
                  </div>
                </div>

                {/* Existing images */}
                {editPayload.images?.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-10 gap-2">
                    {editPayload.images.map((img) => (
                      <div key={img.public_id} className="relative">
                        <img
                          src={img.url}
                          alt=""
                          className="w-full h-20 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => deleteOneImage(img.public_id)}
                          className="absolute top-1 right-1 bg-white border rounded px-2 text-sm"
                          title="Delete this image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload new images */}
                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  <label
                    htmlFor="editImages"
                    className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm"
                  >
                    Choose files
                  </label>
                  <span className="text-sm text-gray-500">
                    {editFiles.length
                      ? `${editFiles.length} file(s) selected`
                      : "No files chosen"}
                  </span>

                  <input
                    id="editImages"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={pickEditFiles}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={uploadEditImages}
                    disabled={editUploading || !editFiles.length}
                    className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
                  >
                    {editUploading ? "Uploading..." : "Upload & Add"}
                  </button>

                  <span className="text-xs text-gray-500">
                    After upload, click <b>Save Changes</b>.
                  </span>
                </div>
              </div>

              <div className="md:col-span-2 flex gap-2">
                <button className="px-4 py-2 rounded-lg bg-black text-white">
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={closeEdit}
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
