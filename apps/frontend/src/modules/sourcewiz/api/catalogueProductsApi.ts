import { axiosInstance } from "../../../services/api/axiosInstance";
import { getAssetUrl } from "../../../shared/utils/urlHelper";
import type { CatalogProductItem } from "../utils/pptxExport";

export interface CatalogueImage {
  id: string;
  label: string;
  url: string;
  previewUrl: string;
  isMain?: boolean;
}
export type StoredCatalogueProduct = CatalogProductItem & {
  images?: CatalogueImage[];
  fullDetails?: Record<string, any>;
  createdBy?: string;
  version?: number;
  [key: string]: any;
};
function resolveImages(product: StoredCatalogueProduct): StoredCatalogueProduct {
  return { ...product, image: getAssetUrl(product.image), images: product.images?.map((img, index) => {
    const image = typeof img === "string" ? { id: `image-${index}`, label: "", url: img, previewUrl: img } : img;
    return { ...image, id: image.id || `image-${index}`, label: image.label || "",
      url: getAssetUrl(image.url), previewUrl: getAssetUrl(image.previewUrl || image.url) };
  }) };
}

function storageImageUrl(value: string): string {
  const prefix = getAssetUrl("/uploads/");
  return value?.startsWith(prefix) ? `/uploads/${value.slice(prefix.length)}` : value;
}
function storageProduct(product: any) {
  return { ...product, image: storageImageUrl(product.image || ""),
    images: (product.images || []).map((img: CatalogueImage) => ({
      ...img, url: storageImageUrl(img.url), previewUrl: storageImageUrl(img.previewUrl || img.url),
    })) };
}

export const catalogueProductsApi = {
  async list(): Promise<StoredCatalogueProduct[]> {
    return (await axiosInstance.get("/catalogue/products")).data.data.map(resolveImages);
  },
  async get(id: string): Promise<StoredCatalogueProduct> {
    return resolveImages((await axiosInstance.get(`/catalogue/products/${encodeURIComponent(id)}`)).data.data);
  },
  async save(product: any, id?: string): Promise<StoredCatalogueProduct> {
    const res = id
      ? await axiosInstance.put(`/catalogue/products/${encodeURIComponent(id)}`, storageProduct(product))
      : await axiosInstance.post("/catalogue/products", storageProduct(product));
    return resolveImages(res.data.data);
  },
  async upload(file: Blob, name = "catalogue-image"): Promise<string> {
    const body = new FormData();
    body.append("file", file, name);
    const res = await axiosInstance.post("/catalogue/images", body);
    return res.data.data.url;
  },
  async remove(ids: string[]): Promise<void> {
    await axiosInstance.post("/catalogue/products/bulk-delete", { ids });
  },
  async importLegacy(legacyId: string, product: any): Promise<{ alreadyImported: boolean; product: StoredCatalogueProduct }> {
    return (await axiosInstance.post("/catalogue/products/import", { legacyId, product: storageProduct(product) })).data.data;
  },
};

export function catalogueError(error: any): string {
  return error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || "Catalogue request failed. Please retry.";
}
