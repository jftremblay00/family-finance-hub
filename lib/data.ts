import type { AppData, BabyCategory, Category, PaymentMethod, RegistryStatus, Rule, Tag, Transaction } from "./types";

export const categories: Category[] = ["Shared", "JF Personal", "Jade Personal", "Baby", "Review"];
export const tags: Tag[] = ["Grocery", "Restaurant", "Coffee", "Home", "Costco", "IKEA", "Travel", "Insurance", "Subscription", "Baby", "Medical", "Other"];
export const paymentMethods: PaymentMethod[] = ["Cash JF", "Cash Jade", "Mastercard JF", "Mastercard Jade", "Jade Personal Credit Card", "JF Visa Personal", "Other"];
export const babyCategories: BabyCategory[] = ["Furniture", "Transportation", "Feeding", "Diapers", "Clothing", "Health", "Toys", "Safety", "Other"];
export const registryStatuses: RegistryStatus[] = ["Needed", "Purchased", "Gifted"];

export function paidByForPaymentMethod(paymentMethod: PaymentMethod): Transaction["paidBy"] {
  return paymentMethod === "Cash Jade" || paymentMethod === "Mastercard Jade" || paymentMethod === "Jade Personal Credit Card" ? "Jade" : "JF";
}

const sharedMerchants = [
  ["HECTOR'S", "Restaurant"],
  ["SAVE ON", "Grocery"],
  ["COSTCO", "Costco"],
  ["IKEA", "IKEA"],
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
  settings: {
    startDate: "2026-02-28",
    carryOverBalance: 0,
  },
  transactions: [],
  rules: initialRules,
  rentLedger: [],
  babyPurchases: [],
  registry: [],
  projects: [],
  imports: [],
};
