import { useEffect, useState } from "react";
import { getCategories } from "../api/categories";
import { uploadMultipleImages } from "../api/uploads";

export default function ProductForm({ onCreate }) {
  const [cats, setCats] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [stock, setStock] = useState(0);
  const [description, setDescription] = useState("");

  const [imageFiles, setImageFiles] = useState([]);
  const [uploaded, setUploaded] = useState([]); // [{url, public_id}]
  const [uploading, setUploading] = useState(false);

  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await getCategories();
        const list = res.data.categories || [];
        setCats(list);
        if (list[0]?._id) setCategory(list[0]._id);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load categories");
      } finally {
        setLoadingCats(false);
      }
    })();
  }, []);

  const handlePick = (e) => {
    setImageFiles(Array.from(e.target.files || []));
  };

  const handleUpload = async () => {
    setErr("");
    if (!imageFiles.length) {
      setErr("Please select images first");
      return;
    }
    setUploading(true);
    try {
      const res = await uploadMultipleImages(imageFiles);
      // backend returns images array (in our earlier code it was: { images: [{imageUrl, public_id}] }
      const imgs = (res.data.images || []).map((x) => ({
        url: x.imageUrl || x.url, // support both keys
        public_id: x.public_id,
      }));
      setUploaded((prev) => [...prev, ...imgs]);
      setImageFiles([]);
    } catch (e) {
      setErr(e?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeLocalImage = (public_id) => {
    setUploaded((prev) => prev.filter((i) => i.public_id !== public_id));
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!title.trim()) return setErr("Title is required");
    if (!category) return setErr("Category is required");
    if (price === "" || Number(price) < 0)
      return setErr("Valid price is required");
    if (!uploaded.length) return setErr("Upload at least 1 product image");

    await onCreate({
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      discountPrice: discountPrice === "" ? undefined : Number(discountPrice),
      category,
      brand: brand.trim(),
      stock: Number(stock),
      images: uploaded, // ✅ [{url, public_id}]
    });

    // reset form
    setTitle("");
    setPrice("");
    setDiscountPrice("");
    setBrand("");
    setStock(0);
    setDescription("");
    setUploaded([]);
  };

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="font-semibold mb-3">Add Product</h3>

      {err && (
        <div className="mb-3 p-3 rounded-lg bg-red-50 text-red-700">{err}</div>
      )}

      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">
            Product Name
          </label>
          <input
            className="border rounded-lg p-2 w-full mt-1"
            placeholder="Example: RTX 3060 Ti Graphics Card"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            This is the main product name shown to customers.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Brand</label>
          <input
            className="border rounded-lg p-2 w-full mt-1"
            placeholder="Example: NVIDIA, AMD, Intel"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Manufacturer or brand of the product (optional).
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Selling Price (₹)
          </label>
          <input
            type="number"
            min="0"
            className="border rounded-lg p-2 w-full mt-1"
            placeholder="Example: 25999"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Final price customers will pay if no discount is applied.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Discounted Price (₹)
          </label>
          <input
            type="number"
            min="0"
            className="border rounded-lg p-2 w-full mt-1"
            placeholder="Example: 23999"
            value={discountPrice}
            onChange={(e) => setDiscountPrice(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional. If set, this price will be shown as the discounted price.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Available Quantity (Stock)
          </label>
          <input
            type="number"
            min="0"
            className="border rounded-lg p-2 w-full mt-1"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Total number of units available for sale.
            <br />
            <strong>0</strong> means the product is out of stock.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Product Category
          </label>
          <select
            className="border rounded-lg p-2 w-full mt-1"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {cats.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Select the category this product belongs to (CPU, GPU, PSU, etc.).
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700">
            Product Description
          </label>
          <textarea
            rows={3}
            className="border rounded-lg p-2 w-full mt-1"
            placeholder="Short description of the product features"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional. Shown on the product detail page for customers.
          </p>
        </div>

        {/* Upload section */}
        <div className="md:col-span-2 border rounded-xl p-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-medium">Images</div>
              <div className="text-sm text-gray-500">
                Upload 1–6 images at a time.
              </div>
            </div>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !imageFiles.length}
              className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Selected"}
            </button>
          </div>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePick}
            className="mt-3 block w-full text-sm
             file:border file:border-gray-300
             file:rounded-lg file:px-4 file:py-2
             file:bg-white file:text-gray-700
             hover:file:bg-gray-50"
          />

          {uploaded.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-2">
              {uploaded.map((img) => (
                <div key={img.public_id} className="relative">
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-20 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeLocalImage(img.public_id)}
                    className="absolute top-1 right-1 bg-white border rounded px-2 text-sm"
                    title="Remove from product (not cloud delete)"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <button className="px-4 py-2 rounded-lg bg-black text-white">
            Create Product
          </button>
        </div>
      </form>
    </div>
  );
}
