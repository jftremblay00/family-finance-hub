import { initialData } from "./data";
import type { AppData } from "./types";

const key = "family-finance-hub-data";

export function loadData(): AppData {
  if (typeof window === "undefined") return initialData;
  const saved = window.localStorage.getItem(key);
  if (!saved) return initialData;
  try {
    return JSON.parse(saved) as AppData;
  } catch {
    return initialData;
  }
}

export function saveData(data: AppData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(data));
}

export function resetData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}
