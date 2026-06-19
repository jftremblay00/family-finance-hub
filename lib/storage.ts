import { initialData } from "./data";
import type { AppData, ImportHistory, Transaction } from "./types";

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
  const imports = (data.imports ?? initialData.imports).map(normalizeImport);
  return {
    ...initialData,
    ...data,
    settings: {
      ...initialData.settings,
      ...data.settings,
    },
    transactions: (data.transactions ?? initialData.transactions).map(normalizeTransaction),
    rules: data.rules ?? initialData.rules,
    rentLedger: data.rentLedger ?? initialData.rentLedger,
    babyPurchases: data.babyPurchases ?? initialData.babyPurchases,
    registry: data.registry ?? initialData.registry,
    imports,
  };
}

function normalizeTransaction(transaction: Transaction): Transaction {
  const importedFile = transaction.notes?.match(/Imported from ([^.]+(?:\.pdf)?)/i)?.[1];
  const statementSourceId = importedFile ? makeStoredStatementSourceId(importedFile, transaction.statementMonth) : undefined;
  return {
    ...transaction,
    sourceType: transaction.sourceType ?? (importedFile ? "statement" : "manual"),
    sourceId: transaction.sourceId ?? statementSourceId ?? "manual-entry",
  };
}

function normalizeImport(item: ImportHistory): ImportHistory {
  const sourceId = item.sourceId ?? makeStoredStatementSourceId(item.fileName, item.statementMonth);
  return {
    ...item,
    sourceId,
    statementName: item.statementName ?? item.fileName.replace(/\.pdf$/i, ""),
    statementPeriod: item.statementPeriod ?? item.statementMonth,
  };
}

function makeStoredStatementSourceId(fileName: string, statementMonth: string) {
  const lower = fileName.toLowerCase();
  const issuer = lower.includes("bmo") ? "bmo-mastercard" : "";
  const cleaned = issuer || fileName
    .replace(/\.pdf$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${statementMonth}-${cleaned || "statement"}`;
}
