import { env } from "../../config/env";

/**
 * Safely resolves assets, avatar, and upload URLs.
 * Handles absolute, root-relative, empty, and relative/absolute API configs correctly.
 */
export function getAssetUrl(url: string | null | undefined): string {
  if (!url) return "";

  // 1. Absolute URLs or base64 data URIs remain as-is
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }

  const apiBase = env.apiBaseUrl;

  // 2. Prepend base origin depending on relative vs absolute configuration
  let baseOrigin = "";
  if (typeof window !== "undefined" && window.location) {
    baseOrigin = window.location.origin;
  }

  if (apiBase.startsWith("http://") || apiBase.startsWith("https://")) {
    try {
      baseOrigin = new URL(apiBase).origin;
    } catch (e) {
      console.warn("Invalid apiBaseUrl format, falling back to local origin", e);
    }
  }

  const path = url.startsWith("/") ? url : `/${url}`;
  return `${baseOrigin}${path}`;
}
