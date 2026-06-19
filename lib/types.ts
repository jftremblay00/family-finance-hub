export type Category = "Shared" | "JF Personal" | "Jade Personal" | "Baby" | "Review";
export type Tag =
  | "Grocery"
  | "Restaurant"
  | "Coffee"
  | "Home"
  | "Costco"
  | "IKEA"
  | "Travel"
  | "Insurance"
  | "Subscription"
  | "Baby"
  | "Medical"
  | "Other";

export type BabyCategory =
  | "Furniture"
  | "Transportation"
  | "Feeding"
  | "Diapers"
  | "Clothing"
  | "Health"
  | "Toys"
  | "Safety"
  | "Other";

export type RegistryStatus = "Needed" | "Purchased" | "Gifted";
export type SourceType = "statement" | "receipt" | "manual";

export type Project = {
  id: string;
  name: string;
  type: "Trip" | "Project";
  notes: string;
  createdAt: string;
};

export type Transaction = {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  cardholder: "JF" | "Jade";
  paidBy: "JF" | "Jade";
  statementMonth: string;
  category: Category;
  tag: Tag;
  notes: string;
  projectId: string;
  sourceType: SourceType;
  sourceId: string;
  deletedAt: string;
};

export type Rule = {
  id: string;
  merchantPattern: string;
  category: Category;
  tag: Tag;
  autoApply: boolean;
};

export type RentEntry = {
  id: string;
  date: string;
  amount: number;
  description: string;
};

export type BabyPurchase = {
  id: string;
  date: string;
  item: string;
  category: BabyCategory;
  amount: number;
  notes: string;
};

export type RegistryItem = {
  id: string;
  item: string;
  category: BabyCategory;
  status: RegistryStatus;
  estimatedCost: number;
  notes: string;
};

export type ImportHistory = {
  id: string;
  sourceId: string;
  statementName: string;
  statementPeriod: string;
  fileName: string;
  importedAt: string;
  statementMonth: string;
  transactions: number;
  reviewItems: number;
};

export type AppData = {
  settings: {
    startDate: string;
    carryOverBalance: number;
  };
  transactions: Transaction[];
  rules: Rule[];
  rentLedger: RentEntry[];
  babyPurchases: BabyPurchase[];
  registry: RegistryItem[];
  projects: Project[];
  imports: ImportHistory[];
};
