import type { AppData, BabyCategory, Category, RegistryStatus, Rule, Tag, Transaction } from "./types";

export const categories: Category[] = ["Shared", "JF Personal", "Jade Personal", "Baby", "Review"];
export const tags: Tag[] = ["Grocery", "Restaurant", "Home", "Travel", "Insurance", "Subscription", "Baby", "Medical", "Other"];
export const babyCategories: BabyCategory[] = ["Furniture", "Transportation", "Feeding", "Diapers", "Clothing", "Health", "Toys", "Safety", "Other"];
export const registryStatuses: RegistryStatus[] = ["Needed", "Purchased", "Gifted"];

const sharedMerchants = [
  ["HECTOR'S", "Restaurant"],
  ["SAVE ON", "Grocery"],
  ["COSTCO", "Grocery"],
  ["IKEA", "Home"],
  ["HOME DEPOT", "Home"],
  ["CANADIAN TIRE", "Home"],
  ["BCAA", "Insurance"],
  ["AIR CANADA", "Travel"],
  ["LONDON DRUGS", "Medical"],
  ["NESTERS", "Grocery"],
  ["WALMART", "Grocery"],
  ["SUNFLOWER BAKERY", "Restaurant"],
] as const;

const jfMerchants = [
  ["CLAUDE", "Subscription"],
  ["ADOBE", "Subscription"],
  ["GOOGLE ONE", "Subscription"],
  ["SPOTIFY", "Subscription"],
  ["TELUS", "Subscription"],
  ["EQUIFAX", "Subscription"],
  ["TRANSUNION", "Subscription"],
  ["AMAZON PRIME", "Subscription"],
  ["UBER ONE", "Subscription"],
] as const;

export const initialRules: Rule[] = [
  ...sharedMerchants.map(([merchantPattern, tag], index) => ({
    id: `rule-shared-${index}`,
    merchantPattern,
    category: "Shared" as Category,
    tag,
    autoApply: true,
  })),
  ...jfMerchants.map(([merchantPattern, tag], index) => ({
    id: `rule-jf-${index}`,
    merchantPattern,
    category: "JF Personal" as Category,
    tag,
    autoApply: true,
  })),
];

export const initialData: AppData = {
  transactions: [
    tx("2026-06-03", "SAVE ON FOODS 902", 186.42, "JF", "2026-06", "Shared", "Grocery"),
    tx("2026-06-04", "CLAUDE AI", 31.49, "JF", "2026-06", "JF Personal", "Subscription"),
    tx("2026-06-05", "LONDON DRUGS 78", 42.17, "Jade", "2026-06", "Shared", "Medical"),
    tx("2026-06-06", "BABIES R US ONLINE", 329.99, "Jade", "2026-06", "Baby", "Baby", "Stroller deposit"),
    tx("2026-06-09", "HECTOR'S CASA", 76.28, "JF", "2026-06", "Shared", "Restaurant"),
    tx("2026-06-12", "MOONLIGHT CAFE", 24.9, "Jade", "2026-06", "Review", "Other"),
    tx("2026-06-14", "IKEA RICHMOND", 218.34, "JF", "2026-06", "Shared", "Home"),
    tx("2026-05-02", "COSTCO WHOLESALE", 312.15, "JF", "2026-05", "Shared", "Grocery"),
    tx("2026-05-13", "SPOTIFY", 12.99, "JF", "2026-05", "JF Personal", "Subscription"),
    tx("2026-05-21", "WEST COAST MIDWIVES", 145, "Jade", "2026-05", "Baby", "Medical"),
  ],
  rules: initialRules,
  rentLedger: [
    { id: "rent-mar", date: "2026-03-01", amount: 1300, description: "Jade paid JF rent" },
    { id: "rent-apr", date: "2026-04-01", amount: 850, description: "Jade paid JF rent" },
    { id: "rent-may", date: "2026-05-01", amount: 850, description: "Jade paid JF rent" },
    { id: "rent-jun", date: "2026-06-01", amount: 850, description: "Jade paid JF rent" },
  ],
  babyPurchases: [
    { id: "baby-1", date: "2026-06-06", item: "Stroller deposit", category: "Transportation", amount: 329.99, notes: "From scanned receipt" },
    { id: "baby-2", date: "2026-05-21", item: "Prenatal appointment", category: "Health", amount: 145, notes: "" },
    { id: "baby-3", date: "2026-06-15", item: "Changing pad", category: "Furniture", amount: 89.5, notes: "" },
  ],
  registry: [
    { id: "reg-1", item: "Convertible crib", category: "Furniture", status: "Needed", estimatedCost: 650, notes: "Measure nursery first" },
    { id: "reg-2", item: "Stroller", category: "Transportation", status: "Purchased", estimatedCost: 899, notes: "Deposit paid" },
    { id: "reg-3", item: "Bottle starter kit", category: "Feeding", status: "Gifted", estimatedCost: 75, notes: "From registry" },
    { id: "reg-4", item: "Car seat", category: "Safety", status: "Needed", estimatedCost: 420, notes: "" },
  ],
  imports: [
    { id: "imp-sample", fileName: "BMO Mastercard June sample.pdf", importedAt: "2026-06-16T10:00:00.000Z", statementMonth: "2026-06", transactions: 8, reviewItems: 1 },
  ],
};

function tx(
  date: string,
  merchant: string,
  amount: number,
  cardholder: Transaction["cardholder"],
  statementMonth: string,
  category: Category,
  tag: Tag,
  notes = "",
): Transaction {
  return {
    id: `txn-${date}-${merchant}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    date,
    merchant,
    amount,
    cardholder,
    statementMonth,
    category,
    tag,
    notes,
  };
}
