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
  const rawImports = (data.imports ?? initialData.imports).map(normalizeImport);
  const imports = rawImports.filter((item) => item.id !== "imp-sample" && !/sample/i.test(item.statementName));
  const sampleRentIds = new Set(["rent-mar", "rent-apr", "rent-may", "rent-jun"]);
  return {
    ...initialData,
    ...data,
    settings: {
      ...initialData.settings,
      ...data.settings,
    },
    transactions: (data.transactions ?? initialData.transactions)
      .map(normalizeTransaction)
      .filter((transaction) => transaction.sourceId !== "sample-data" && transaction.sourceId !== "2026-06-bmo-mastercard"),
    rules: (data.rules ?? initialData.rules).map((rule) => {
      if (rule.merchantPattern === "COSTCO") return { ...rule, tag: "Costco" };
      if (rule.merchantPattern === "IKEA") return { ...rule, tag: "IKEA" };
      return rule;
    }),
    rentLedger: (data.rentLedger ?? initialData.rentLedger).filter((entry) => !sampleRentIds.has(entry.id)),
    babyPurchases: (data.babyPurchases ?? initialData.babyPurchases).filter((purchase) => !["baby-1", "baby-2", "baby-3"].includes(purchase.id)),
    registry: (data.registry ?? initialData.registry).filter((item) => !["reg-1", "reg-2", "reg-3", "reg-4"].includes(item.id)),
    projects: data.projects ?? initialData.projects,
    imports,
  };
}

function normalizeTransaction(transaction: Transaction): Transaction {
  const importedFile = transaction.notes?.match(/Imported from ([^.]+(?:\.pdf)?)/i)?.[1];
  const statementSourceId = importedFile ? makeStoredStatementSourceId(importedFile, transaction.statementMonth) : undefined;
  return {
    ...transaction,
    paidBy: transaction.paidBy ?? "JF",
    paymentMethod: transaction.paymentMethod ?? inferPaymentMethod(transaction),
    projectId: transaction.projectId ?? "",
    sourceType: transaction.sourceType ?? (importedFile ? "statement" : "manual"),
    sourceId: transaction.sourceId ?? statementSourceId ?? "manual-entry",
    deletedAt: transaction.deletedAt ?? "",
  };
}

function inferPaymentMethod(transaction: Transaction) {
  if (transaction.sourceType === "statement") return transaction.cardholder === "Jade" ? "Mastercard Jade" : "Mastercard JF";
  if (transaction.sourceType === "receipt") return "Other";
  if (transaction.paidBy === "Jade") return "Cash Jade";
  return "Cash JF";
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
