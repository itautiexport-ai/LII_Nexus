const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    const protocol = window.location.protocol || "http:";
    return `${protocol}//${host}:4000/api/v1`;
  }
  return "http://localhost:4000/api/v1";
};

export const env = {
  get apiBaseUrl() {
    return getApiBaseUrl();
  },
};
