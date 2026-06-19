import type { AppData, Category, ImportHistory, Rule, Tag, Transaction } from "./types";

export function currency(value: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value);
}

export function monthLabel(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric" }).format(new Date(year, monthIndex - 1, 2));
}

export function currentStatementMonth(transactions: Transaction[]) {
  return [...new Set(transactions.map((transaction) => transaction.statementMonth))].sort().at(-1) ?? "2026-06";
}

export function calculateSummary(data: AppData, month = currentStatementMonth(data.transactions)) {
  const transactions = activeTransactions(data);
  const monthTransactions = transactions.filter((transaction) => transaction.statementMonth === month);
  const shared = sum(monthTransactions.filter((transaction) => transaction.category === "Shared"));
  const baby = sum(monthTransactions.filter((transaction) => transaction.category === "Baby"));
  const review = monthTransactions.filter((transaction) => transaction.category === "Review").length;
  const rentCredits = sum(activeRentLedger(data));
  const sharedOwedToJF = shared / 2;
  const netPosition = sharedOwedToJF - rentCredits;
  const babyAllTime = sum(activeBabyPurchases(data));

  return { month, shared, baby, review, rentCredits, sharedOwedToJF, netPosition, babyAllTime };
}

export function activeTransactions(data: AppData) {
  return data.transactions.filter((transaction) => isOnOrAfterStartDate(transaction.date, data.settings.startDate) && !isCardPaymentLine(transaction.merchant, transaction.amount));
}

export function activeRentLedger(data: AppData) {
  return data.rentLedger.filter((entry) => isOnOrAfterStartDate(entry.date, data.settings.startDate));
}

export function activeBabyPurchases(data: AppData) {
  return data.babyPurchases.filter((purchase) => isOnOrAfterStartDate(purchase.date, data.settings.startDate));
}

export function isOnOrAfterStartDate(date: string, startDate: string) {
  return !startDate || date >= startDate;
}

export function netPositionCopy(netPosition: number) {
  if (Math.abs(netPosition) < 0.01) return "Settled up";
  return netPosition > 0 ? `Jade owes JF ${currency(netPosition)}` : `JF owes Jade ${currency(Math.abs(netPosition))}`;
}

export function applyRules(transaction: Omit<Transaction, "category" | "tag">, rules: Rule[]): Transaction {
  const match = rules.find((rule) => rule.autoApply && transaction.merchant.toUpperCase().includes(rule.merchantPattern.toUpperCase()));
  return {
    ...transaction,
    category: match?.category ?? "Review",
    tag: match?.tag ?? "Other",
  };
}

export function createRule(merchant: string, category: Category, tag: Tag): Rule {
  const cleaned = merchant.toUpperCase().replace(/[^A-Z0-9 '&-]/g, " ").replace(/\s+/g, " ").trim();
  const pattern = cleaned.split(" ").slice(0, 3).join(" ");
  return {
    id: `rule-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    merchantPattern: pattern,
    category,
    tag,
    autoApply: true,
  };
}

export function exportSheets(data: AppData) {
  const monthly = buildMonthlySummary(data);
  return {
    Settings: [{ startDate: data.settings.startDate }],
    Transactions: activeTransactions(data),
    Rules: data.rules,
    "Rent Ledger": activeRentLedger(data),
    "Baby Purchases": activeBabyPurchases(data),
    "Baby Registry": data.registry,
    "Monthly Summary": monthly,
  };
}

export function rowsToCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}

export function makeStatementSourceId(fileName: string, statementMonth: string) {
  const lower = fileName.toLowerCase();
  const issuer = lower.includes("bmo") ? "bmo-mastercard" : "";
  const base = issuer || fileName
    .replace(/\.pdf$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${statementMonth}-${base || "bmo-mastercard"}`;
}

export function transactionFingerprint(transaction: Pick<Transaction, "date" | "merchant" | "amount" | "cardholder">) {
  return [
    transaction.date,
    transaction.merchant.toUpperCase().replace(/\s+/g, " ").trim(),
    transaction.amount.toFixed(2),
    transaction.cardholder,
  ].join("|");
}

export function uniqueTransactions(transactions: Transaction[], existing: Transaction[] = []) {
  const seen = new Set(existing.map(transactionFingerprint));
  const unique: Transaction[] = [];
  let duplicates = 0;

  for (const transaction of transactions) {
    const fingerprint = transactionFingerprint(transaction);
    if (seen.has(fingerprint)) {
      duplicates += 1;
      continue;
    }
    seen.add(fingerprint);
    unique.push(transaction);
  }

  return { transactions: unique, duplicates };
}

export async function extractPdfTransactions(file: File, rules: Rule[], startDate?: string): Promise<Transaction[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  let text = "";

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    text += `\n${content.items.map((item) => ("str" in item ? item.str : "")).join(" ")}`;
  }

  return parseStatementText(text, rules, file.name).filter((transaction) => isOnOrAfterStartDate(transaction.date, startDate ?? ""));
}

export function parseStatementText(text: string, rules: Rule[], fileName = "BMO Mastercard statement.pdf") {
  const statementMonth = inferMonth(text) ?? new Date().toISOString().slice(0, 7);
  const sourceId = makeStatementSourceId(fileName, statementMonth);
  let cardholder: Transaction["cardholder"] = "JF";
  const transactions: Transaction[] = [];
  const lines = text.split(/\n|(?=\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2}\b)/i);

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+/g, " ").trim();
    if (/jade/i.test(line) && /cardholder|transactions|account/i.test(line)) cardholder = "Jade";
    if (/\bJF\b|jean|fred/i.test(line) && /cardholder|transactions|account/i.test(line)) cardholder = "JF";

    const match = line.match(/\b([A-Z][a-z]{2,8})\.?\s+(\d{1,2})\s+(.+?)\s+(-?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2}))\b/);
    if (!match) continue;

    const [, monthName, day, merchant, amountText] = match;
    const date = normalizeStatementDate(monthName, day, statementMonth);
    const amount = Number(amountText.replace(/[$,]/g, ""));
    if (isCardPaymentLine(merchant, amount)) continue;
    const base = {
      id: `imp-${Date.now()}-${transactions.length}`,
      date,
      merchant: merchant.trim().toUpperCase(),
      amount,
      cardholder,
      statementMonth,
      notes: `Imported from ${fileName}`,
      sourceType: "statement" as const,
      sourceId,
    };
    transactions.push(applyRules(base, rules));
  }

  return transactions;
}

export function isCardPaymentLine(merchant: string, amount: number) {
  const normalized = merchant.toUpperCase().replace(/\s+/g, " ").trim();
  const paymentPattern =
    /\b(PAYMENT|PAYMENT RECEIVED|THANK YOU|AUTOMATIC PAYMENT|AUTO PAYMENT|ONLINE PAYMENT|BILL PAYMENT|PREAUTHORIZED PAYMENT|PRE-AUTHORIZED PAYMENT|CREDIT CARD PAYMENT)\b/;
  return paymentPattern.test(normalized) || (amount < 0 && /\b(PAY|PMT|PYMT|CR|CREDIT)\b/.test(normalized));
}

export async function runReceiptOcr(file: File) {
  const { recognize } = await import("tesseract.js");
  const result = await recognize(file, "eng");
  return parseReceiptText(result.data.text);
}

export function parseReceiptText(text: string) {
  const lines = text.split(/\n/).map((line) => line.trim()).filter(Boolean);
  const merchant = lines.find((line) => /[A-Za-z]{3,}/.test(line))?.slice(0, 42) ?? "Receipt merchant";
  const dateMatch = text.match(/\b(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/);
  const totalLines = lines.filter((line) => /total|amount|balance/i.test(line));
  const amountMatch = [...totalLines, ...lines].join("\n").match(/(-?\$?\d{1,4}(?:,\d{3})*(?:\.\d{2}))/g);
  const amount = amountMatch ? Number(amountMatch.at(-1)?.replace(/[$,]/g, "")) : 0;
  return {
    merchant,
    date: normalizeReceiptDate(dateMatch?.[1]),
    amount,
  };
}

export function makeImportHistory(fileName: string, statementMonth: string, transactions: Transaction[]): ImportHistory {
  const sourceId = transactions[0]?.sourceId ?? makeStatementSourceId(fileName, statementMonth);
  return {
    id: `imp-${Date.now()}`,
    sourceId,
    statementName: fileName.replace(/\.pdf$/i, ""),
    statementPeriod: monthLabel(statementMonth),
    fileName,
    importedAt: new Date().toISOString(),
    statementMonth,
    transactions: transactions.length,
    reviewItems: transactions.filter((transaction) => transaction.category === "Review").length,
  };
}

function normalizeStatementDate(monthName: string, day: string, statementMonth: string) {
  const year = Number(statementMonth.slice(0, 4));
  const month = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].findIndex((name) =>
    monthName.toLowerCase().startsWith(name),
  );
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(Number(day)).padStart(2, "0")}`;
}

function normalizeReceiptDate(value?: string) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const cleaned = value.replaceAll("/", "-");
  const parts = cleaned.split("-").map(Number);
  if (parts[0] > 1900) return `${parts[0]}-${String(parts[1]).padStart(2, "0")}-${String(parts[2]).padStart(2, "0")}`;
  const year = parts[2] < 100 ? 2000 + parts[2] : parts[2];
  return `${year}-${String(parts[0]).padStart(2, "0")}-${String(parts[1]).padStart(2, "0")}`;
}

function inferMonth(text: string) {
  const match = text.match(/\b(20\d{2})[-/ ](0?[1-9]|1[0-2])\b/);
  if (!match) return undefined;
  return `${match[1]}-${String(Number(match[2])).padStart(2, "0")}`;
}

function buildMonthlySummary(data: AppData) {
  const transactions = activeTransactions(data);
  const months = [...new Set(transactions.map((transaction) => transaction.statementMonth))].sort();
  return months.map((month) => {
    const summary = calculateSummary(data, month);
    return {
      month,
      sharedExpenses: summary.shared,
      jadeShare: summary.sharedOwedToJF,
      rentCredits: summary.rentCredits,
      netPosition: summary.netPosition,
      babySpending: summary.baby,
      reviewQueue: summary.review,
    };
  });
}

function sum(items: { amount: number }[]) {
  return items.reduce((total, item) => total + item.amount, 0);
}
