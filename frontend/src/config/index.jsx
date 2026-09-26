import axios from "axios";

const rawApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://proconnect-b8ci.onrender.com";

export const BASE_URL = rawApiBaseUrl.replace(/\/$/, "");

export const clientServer = axios.create({
  baseURL: BASE_URL,
});

export const resolveImageUrl = (val) => {
  if (!val) return `${BASE_URL}/default.jpg`;
  if (/^https?:\/\//i.test(val)) return val;
  return `${BASE_URL}/${encodeURIComponent(val)}`;
};
