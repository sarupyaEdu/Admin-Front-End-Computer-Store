import api from "./axios";

export const listProducts = () => api.get("/products");
export const createProduct = (payload) => api.post("/products", payload);
export const updateProduct = (id, payload) => api.put(`/products/${id}`, payload);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// delete a single image from a product (cloudinary + DB)
export const deleteProductImage = (productId, public_id) =>
  api.delete(`/products/${productId}/image`, { data: { public_id } });
