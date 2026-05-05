import axios from "axios";
import { storage } from "./storage";

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const token = await storage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const formatErr = (err: any): string => {
  const detail = err?.response?.data?.detail;
  if (!detail) return err?.message || "Something went wrong";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e: any) => e?.msg || JSON.stringify(e)).join(" ");
  return String(detail);
};
