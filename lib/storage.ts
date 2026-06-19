import { initialData } from "./data";
import type { AppData } from "./types";

const key = "family-finance-hub-data";

export function loadData(): AppData {
  if (typeof window === "undefined") return initialData;
  const saved = window.localStorage.getItem(key);
  if (!saved) return initialData;
  try {
    return normalizeData(JSON.parse(saved) as Partial<AppData>);
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

function normalizeData(data: Partial<AppData>): AppData {
  return {
    ...initialData,
    ...data,
    settings: {
      ...initialData.settings,
      ...data.settings,
    },
    transactions: data.transactions ?? initialData.transactions,
    rules: data.rules ?? initialData.rules,
    rentLedger: data.rentLedger ?? initialData.rentLedger,
    babyPurchases: data.babyPurchases ?? initialData.babyPurchases,
    registry: data.registry ?? initialData.registry,
    imports: data.imports ?? initialData.imports,
  };
}
