import api from "./axios";

export const uploadSingleImage = (file, folder = "pc-parts-shop/products") => {
  const fd = new FormData();
  fd.append("image", file);
  fd.append("folder", folder);
  return api.post("/uploads/image", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadMultipleImages = (files, folder = "pc-parts-shop/products") => {
  const fd = new FormData();
  for (const f of files) fd.append("images", f);
  fd.append("folder", folder);
  return api.post("/uploads/images", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
