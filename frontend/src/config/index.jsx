import axios from "axios";

export const BASE_URL = "http://localhost:9090";

export const clientServer = axios.create({
  baseURL: BASE_URL,
});

export const resolveImageUrl = (val) => {
  if (!val) return `${BASE_URL}/default.jpg`;
  if (/^https?:\/\//i.test(val)) return val; // already a full URL (Cloudinary)
  return `${BASE_URL}/${encodeURIComponent(val)}`; // legacy local file
};
