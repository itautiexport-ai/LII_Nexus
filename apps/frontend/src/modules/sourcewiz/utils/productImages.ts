import { getAssetUrl } from "../../../shared/utils/urlHelper";

// Older imported products may use strings; server products use image objects.
export function getProductImageUrls(product: { image?: string; images?: Array<string | { url: string; previewUrl?: string }> }): string[] {
  const images = (product.images || []).map(image => typeof image === "string" ? image : image.url || image.previewUrl || "");
  return [...new Set([product.image || "", ...images].filter(Boolean).map(getAssetUrl))];
}
