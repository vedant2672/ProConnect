import axios from "axios";

export const BASE_URL = "https://proconnect-b8ci.onrender.com/";

export const clientServer = axios.create({
  baseURL: BASE_URL,
});
