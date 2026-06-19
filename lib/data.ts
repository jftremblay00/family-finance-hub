import type { AppData, BabyCategory, Category, RegistryStatus, Rule, Tag } from "./types";

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
  settings: {
    startDate: "2026-02-28",
  },
  transactions: [],
  rules: initialRules,
  rentLedger: [],
  babyPurchases: [],
  registry: [],
  imports: [],
};
