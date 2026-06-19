"use client";

import {
  AlertCircle,
  Baby,
  Camera,
  CalendarDays,
  Check,
  CreditCard,
  Download,
  FileText,
  Home,
  Moon,
  PiggyBank,
  Plus,
  ReceiptText,
  RefreshCw,
  Scale,
  Search,
  Settings2,
  Sun,
  Upload,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { babyCategories, categories, registryStatuses, tags } from "@/lib/data";
import {
  activeBabyPurchases,
  activeRentLedger,
  activeTransactions,
  applyRules,
  calculateSummary,
  createRule,
  currency,
  currentStatementMonth,
  exportSheets,
  extractPdfTransactions,
  makeImportHistory,
  monthLabel,
  netPositionCopy,
  parseReceiptText,
  rowsToCsv,
  runReceiptOcr,
  uniqueTransactions,
} from "@/lib/finance";
import { loadData, resetData, saveData } from "@/lib/storage";
import type { AppData, BabyCategory, Category, ImportHistory, RegistryStatus, Tag, Transaction } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";
import { ActivityRow, InsightCard, MetricCard, MiniRail, PageIntro, SectionHeader, StatusBadge } from "@/components/design-system";

type Tab = "dashboard" | "import" | "transactions" | "review" | "rent" | "baby" | "registry" | "scanner" | "sync";
type TransactionFilters = {
  month: string;
  category: string;
  tag: string;
  cardholder: string;
  search: string;
};

const navItems: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "transactions", label: "Cards", icon: CreditCard },
  { id: "review", label: "Review", icon: Check },
  { id: "baby", label: "Baby", icon: Baby },
  { id: "scanner", label: "Scan", icon: Camera },
];

const allTabs: { id: Tab; label: string; icon: typeof Home }[] = [
  ...navItems,
  { id: "import", label: "Import", icon: Upload },
  { id: "rent", label: "Rent", icon: Home },
  { id: "registry", label: "Registry", icon: ReceiptText },
  { id: "sync", label: "Sheets", icon: RefreshCw },
];

export default function FamilyFinanceHub() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [tab, setTab] = useState<Tab>("dashboard");
  const [dark, setDark] = useState(false);
  const [month, setMonth] = useState(() => currentStatementMonth(loadData().transactions));
  const [toast, setToast] = useState("Ready");

  useEffect(() => saveData(data), [data]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const months = useMemo(() => [...new Set(data.transactions.map((transaction) => transaction.statementMonth))].sort().reverse(), [data.transactions]);
  const selectedMonth = months.includes(month) ? month : months[0] ?? "2026-06";
  const summary = useMemo(() => calculateSummary(data, selectedMonth), [data, selectedMonth]);

  function updateData(next: AppData | ((current: AppData) => AppData), message = "Saved") {
    setData((current) => (typeof next === "function" ? next(current) : next));
    setToast(message);
  }

  return (
    <main className="min-h-screen pb-24 md:pb-0">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-4 sm:px-6 md:py-7">
        <aside className="sticky top-7 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 rounded-lg border border-border/80 bg-card/80 p-3 shadow-soft backdrop-blur-xl md:block">
          <Brand summary={summary} />
          <nav className="mt-6 space-y-1">
            {allTabs.map((item) => (
              <NavButton key={item.id} active={tab === item.id} item={item} onClick={() => setTab(item.id)} />
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">JF and Jade</p>
              <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Family Finance Hub</h1>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedMonth} onChange={(event) => setMonth(event.target.value)} className="hidden w-40 sm:block">
                {months.map((item) => (
                  <option key={item} value={item}>
                    {monthLabel(item)}
                  </option>
                ))}
              </Select>
              <Button variant="secondary" size="icon" onClick={() => setDark((value) => !value)} aria-label="Toggle dark mode">
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            </div>
          </header>

          <div className="mb-5 rounded-lg border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
            {toast}
          </div>

          {tab === "dashboard" && <Dashboard data={data} summary={summary} month={selectedMonth} setTab={setTab} updateData={updateData} />}
          {tab === "import" && <StatementImport data={data} updateData={updateData} />}
          {tab === "transactions" && <Transactions data={data} updateData={updateData} selectedMonth={selectedMonth} />}
          {tab === "review" && <ReviewQueue data={data} updateData={updateData} />}
          {tab === "rent" && <RentLedger data={data} updateData={updateData} />}
          {tab === "baby" && <BabySpending data={data} updateData={updateData} />}
          {tab === "registry" && <BabyRegistry data={data} updateData={updateData} />}
          {tab === "scanner" && <ReceiptScanner data={data} updateData={updateData} setTab={setTab} />}
          {tab === "sync" && (
            <SheetsSync
              data={data}
              onReset={() => {
                resetData();
                setData(loadData());
                setToast("Sample data restored");
              }}
            />
          )}
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-card/92 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-panel backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1 rounded-lg bg-muted/45 p-1">
          {navItems.map((item) => (
            <NavButton key={item.id} active={tab === item.id} item={item} onClick={() => setTab(item.id)} mobile />
          ))}
        </div>
      </nav>
    </main>
  );
}

function Brand({ summary }: { summary: ReturnType<typeof calculateSummary> }) {
  return (
    <div className="rounded-lg border border-primary/15 bg-primary p-4 text-primary-foreground shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">Balance</p>
        <Scale className="size-4 opacity-70" />
      </div>
      <p className="money-figure mt-3 text-xl font-semibold leading-tight tracking-[-0.03em]">{netPositionCopy(summary.netPosition)}</p>
      <p className="mt-3 text-xs leading-5 opacity-70">Shared half, adjusted for Jade&apos;s rent credits.</p>
    </div>
  );
}

function NavButton({
  item,
  active,
  onClick,
  mobile = false,
}: {
  item: { id: Tab; label: string; icon: typeof Home };
  active: boolean;
  onClick: () => void;
  mobile?: boolean;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "focus-ring flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
        active && "bg-foreground text-background shadow-sm hover:bg-foreground hover:text-background",
        mobile && "h-[52px] flex-col justify-center gap-1 px-1 py-2 text-[11px]",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span>{item.label}</span>
    </button>
  );
}

function Dashboard({
  data,
  summary,
  month,
  setTab,
  updateData,
}: {
  data: AppData;
  summary: ReturnType<typeof calculateSummary>;
  month: string;
  setTab: (tab: Tab) => void;
  updateData: (next: AppData | ((current: AppData) => AppData), message?: string) => void;
}) {
  const transactions = activeTransactions(data);
  const babyPurchases = activeBabyPurchases(data);
  const review = transactions.filter((transaction) => transaction.category === "Review");
  const latest = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const babyBreakdown = babyPurchases.reduce<Record<string, number>>((groups, item) => {
    groups[item.category] = (groups[item.category] ?? 0) + item.amount;
    return groups;
  }, {});
  const topBabyCategory = Object.entries(babyBreakdown).sort((a, b) => b[1] - a[1])[0];
  const largestMonthly = [...transactions.filter((transaction) => transaction.statementMonth === month)].sort((a, b) => b.amount - a.amount)[0];
  const kpis = [
    { label: "Net position", value: netPositionCopy(summary.netPosition), detail: `${currency(summary.sharedOwedToJF)} shared half - ${currency(summary.rentCredits)} rent`, tone: "ink" as const, icon: <Scale className="size-4" />, action: "See math" },
    { label: "Shared this month", value: currency(summary.shared), detail: `${monthLabel(month)} household spend`, tone: "paper" as const, icon: <WalletCards className="size-4" /> },
    { label: "Baby this month", value: currency(summary.baby), detail: topBabyCategory ? `${topBabyCategory[0]} leads spending` : "No baby spending yet", tone: "coral" as const, icon: <Baby className="size-4" /> },
    { label: "Needs review", value: String(summary.review), detail: "Unknown merchants to classify", tone: summary.review > 0 ? ("lavender" as const) : ("mint" as const), icon: <AlertCircle className="size-4" /> },
  ];

  return (
    <div className="space-y-7">
      <PageIntro
        eyebrow={monthLabel(month)}
        title="A calm read on shared money."
        description={`Tracking starts ${data.settings.startDate}. Older settled statement activity stays out of the ledger.`}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <StartDateControl data={data} updateData={updateData} />
            <Button variant="secondary" onClick={() => setTab("import")}>
              <Upload className="size-4" /> Import statement
            </Button>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <MetricCard key={kpi.label} {...kpi} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <InsightCard title="Shared balance" actionLabel="Rent ledger" onAction={() => setTab("rent")}>
          <div className="space-y-4">
            <div className="rounded-lg border border-border/70 bg-muted/35 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Formula</p>
              <p className="mt-2 text-lg font-semibold tracking-[-0.02em]">Shared expenses / 2 - rent credits</p>
            </div>
            <FormulaRow label="Total shared expenses" value={currency(summary.shared)} />
            <FormulaRow label="Jade share at 50%" value={currency(summary.sharedOwedToJF)} />
            <FormulaRow label="Rent credits paid by Jade" value={`-${currency(summary.rentCredits)}`} />
            <div className="border-t border-border/70 pt-4">
              <FormulaRow label="Net position" value={netPositionCopy(summary.netPosition)} strong />
            </div>
          </div>
        </InsightCard>

        <InsightCard title="Review queue" actionLabel="Classify" onAction={() => setTab("review")}>
          <div className="space-y-1">
            {review.slice(0, 4).map((transaction) => (
              <ActivityRow
                key={transaction.id}
                title={transaction.merchant}
                meta={`${transaction.date} · ${transaction.cardholder}`}
                amount={currency(transaction.amount)}
                badge={<StatusBadge tone="lavender">Review</StatusBadge>}
              />
            ))}
            {!review.length && <EmptyState title="All merchants classified" detail="New unknown merchants will land here after import or scan." />}
          </div>
        </InsightCard>
      </section>

      <section>
        <SectionHeader title="Money movement" description="Recent card activity, with personal and shared items separated by classification." actionLabel="Open table" onAction={() => setTab("transactions")} />
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardContent className="pt-3 sm:pt-4">
              {latest.map((transaction) => (
                <ActivityRow
                  key={transaction.id}
                  title={transaction.merchant}
                  meta={`${transaction.date} · ${transaction.cardholder} · ${transaction.category}`}
                  amount={currency(transaction.amount)}
                  badge={transaction.category === "Baby" ? <StatusBadge tone="coral">Baby</StatusBadge> : transaction.category === "Shared" ? <StatusBadge tone="mint">Shared</StatusBadge> : undefined}
                />
              ))}
            </CardContent>
          </Card>
          <InsightCard title="This month at a glance">
            <div className="space-y-5">
              <MiniRail label="Shared split" value={summary.sharedOwedToJF} max={Math.max(summary.shared, summary.rentCredits)} />
              <MiniRail label="Rent credits" value={summary.rentCredits} max={Math.max(summary.shared, summary.rentCredits)} />
              <div className="rounded-lg border border-border/70 bg-muted/35 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Largest transaction</p>
                <p className="mt-2 truncate text-sm font-semibold">{largestMonthly?.merchant ?? "No transactions"}</p>
                <p className="money-figure mt-1 text-lg font-semibold">{currency(largestMonthly?.amount ?? 0)}</p>
              </div>
            </div>
          </InsightCard>
        </div>
      </section>

      <section>
        <SectionHeader title="Family planning" description="Baby spending and registry progress stay visible without crowding the finance view." actionLabel="Open baby hub" onAction={() => setTab("baby")} />
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard label="Baby total" value={currency(summary.babyAllTime)} detail="Since start date" tone="coral" icon={<Baby className="size-4" />} />
          <MetricCard label="Registry" value={`${data.registry.filter((item) => item.status !== "Needed").length}/${data.registry.length}`} detail="Purchased or gifted" tone="paper" icon={<ReceiptText className="size-4" />} />
          <MetricCard label="Rent credits" value={currency(summary.rentCredits)} detail="Since start date" tone="mint" icon={<PiggyBank className="size-4" />} />
        </div>
      </section>
    </div>
  );
}

function StartDateControl({ data, updateData }: { data: AppData; updateData: (next: AppData | ((current: AppData) => AppData), message?: string) => void }) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-lg border border-border/80 bg-card px-3 text-sm shadow-sm">
      <CalendarDays className="size-4 text-muted-foreground" />
      <span className="hidden text-muted-foreground sm:inline">Start</span>
      <input
        type="date"
        value={data.settings.startDate}
        onChange={(event) =>
          updateData(
            (current) => ({
              ...current,
              settings: {
                ...current.settings,
                startDate: event.target.value,
              },
            }),
            `Tracking starts ${event.target.value}`,
          )
        }
        className="h-8 border-0 bg-transparent p-0 text-sm focus:ring-0"
      />
    </label>
  );
}

function FormulaRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 text-sm", strong && "text-base font-semibold")}>
      <span className="text-muted-foreground">{label}</span>
      <span className="money-figure text-right">{value}</span>
    </div>
  );
}

function StatementImport({ data, updateData }: { data: AppData; updateData: (next: AppData | ((current: AppData) => AppData), message?: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(`Upload a BMO Mastercard PDF. Imports start from ${data.settings.startDate}; card payments are skipped.`);
  const [pendingImport, setPendingImport] = useState<{ history: ImportHistory; transactions: Transaction[] } | null>(null);

  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const parsedTransactions = await extractPdfTransactions(file, data.rules, data.settings.startDate);
      const statementMonth = parsedTransactions[0]?.statementMonth ?? currentStatementMonth(data.transactions);
      const history = makeImportHistory(file.name, statementMonth, parsedTransactions);
      const existingStatement = data.imports.find((item) => item.sourceId === history.sourceId || item.statementMonth === history.statementMonth);

      if (!parsedTransactions.length) {
        setPendingImport(null);
        setMessage(`No expense transactions were found from ${data.settings.startDate} onward. No data was imported.`);
        return;
      }

      if (existingStatement) {
        const replacementHistory = { ...history, sourceId: existingStatement.sourceId };
        const replacementTransactions = parsedTransactions.map((transaction) => ({ ...transaction, sourceId: existingStatement.sourceId }));
        setPendingImport({ history: replacementHistory, transactions: replacementTransactions });
        setMessage("Statement already imported. Cancel or replace the existing statement.");
        return;
      }

      commitStatementImport(history, parsedTransactions, false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  function commitStatementImport(history: ImportHistory, transactions: Transaction[], replaceExisting: boolean) {
    updateData((current) => {
      const retainedTransactions = replaceExisting ? current.transactions.filter((transaction) => transaction.sourceId !== history.sourceId) : current.transactions;
      const retainedImports = replaceExisting ? current.imports.filter((item) => item.sourceId !== history.sourceId) : current.imports;
      const unique = uniqueTransactions(transactions, retainedTransactions);
      const finalHistory = {
        ...history,
        transactions: unique.transactions.length,
        reviewItems: unique.transactions.filter((transaction) => transaction.category === "Review").length,
      };

      setPendingImport(null);
      setMessage(
        replaceExisting
          ? `Replaced ${history.statementName} with ${unique.transactions.length} transactions.`
          : `Imported ${unique.transactions.length} transactions. ${unique.duplicates} duplicates skipped.`,
      );

      return {
        ...current,
        transactions: [...unique.transactions, ...retainedTransactions],
        imports: [finalHistory, ...retainedImports],
      };
    }, replaceExisting ? "Statement replaced" : "Statement imported");
  }

  function deleteStatement(statement: ImportHistory) {
    updateData((current) => ({
      ...current,
      transactions: current.transactions.filter((transaction) => transaction.sourceId !== statement.sourceId),
      imports: current.imports.filter((item) => item.sourceId !== statement.sourceId),
    }), `Deleted ${statement.statementName}`);
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Statement import</CardTitle>
          <p className="text-sm text-muted-foreground">Parse BMO Mastercard PDFs, skip card payments, apply the start date, and send unknown merchants to review.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/70 bg-muted/35 p-4">
            <p className="text-sm font-semibold">Expense start date</p>
            <p className="mt-1 text-sm text-muted-foreground">Transactions before this date are ignored in imports, dashboard math, review, and exports.</p>
            <div className="mt-3 max-w-xs">
              <StartDateControl data={data} updateData={updateData} />
            </div>
          </div>
          <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-4 text-center transition hover:bg-muted">
            <Upload className="mb-3 size-6 text-muted-foreground" />
            <span className="text-sm font-medium">{busy ? "Parsing statement..." : "Choose BMO Mastercard PDF"}</span>
            <span className="mt-1 text-xs text-muted-foreground">{message}</span>
            <input type="file" accept="application/pdf" className="sr-only" disabled={busy} onChange={(event) => void onFile(event.target.files?.[0])} />
          </label>
          {pendingImport && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
              <p className="text-sm font-semibold">Statement already imported</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {pendingImport.history.statementName} is already in Statement Management. Replace it to delete the old transactions and import this fresh version.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setPendingImport(null)}>Cancel</Button>
                <Button onClick={() => commitStatementImport(pendingImport.history, pendingImport.transactions, true)}>Replace Existing</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Statement Management</h2>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {data.imports.map((item) => (
            <div key={item.id} className="grid gap-3 border-b border-border p-4 last:border-b-0 lg:grid-cols-[1.5fr_1fr_auto_auto_auto] lg:items-center">
              <div>
                <p className="text-sm font-medium">{item.statementName}</p>
                <p className="text-xs text-muted-foreground">{item.fileName}</p>
              </div>
              <p className="text-sm">{item.statementPeriod}</p>
              <p className="text-sm text-muted-foreground">{new Date(item.importedAt).toLocaleString()}</p>
              <p className="text-sm">{item.transactions} transactions · {item.reviewItems} review</p>
              <Button variant="danger" size="sm" onClick={() => deleteStatement(item)}>Delete</Button>
            </div>
          ))}
          {!data.imports.length && <EmptyState title="No statements imported" detail="Uploaded BMO Mastercard statements will appear here." />}
        </div>
      </section>
    </div>
  );
}

function Transactions({ data, updateData, selectedMonth }: { data: AppData; updateData: (next: AppData | ((current: AppData) => AppData), message?: string) => void; selectedMonth: string }) {
  const [filters, setFilters] = useState({ month: selectedMonth, category: "All", tag: "All", cardholder: "All", search: "" });
  const transactions = activeTransactions(data);
  const filtered = transactions.filter((transaction) => {
    return (
      (filters.month === "All" || transaction.statementMonth === filters.month) &&
      (filters.category === "All" || transaction.category === filters.category) &&
      (filters.tag === "All" || transaction.tag === filters.tag) &&
      (filters.cardholder === "All" || transaction.cardholder === filters.cardholder) &&
      transaction.merchant.toLowerCase().includes(filters.search.toLowerCase())
    );
  });

  function patchTransaction(id: string, patch: Partial<Transaction>) {
    updateData((current) => ({ ...current, transactions: current.transactions.map((item) => (item.id === id ? { ...item, ...patch } : item)) }), "Transaction updated");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/70 bg-card p-3 text-sm text-muted-foreground">
        Showing transactions from <span className="font-medium text-foreground">{data.settings.startDate}</span> onward. Card payments are excluded during import.
      </div>
      <FilterBar filters={filters} setFilters={setFilters} months={[...new Set(transactions.map((item) => item.statementMonth))].sort().reverse()} />
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              {["Date", "Merchant", "Amount", "Cardholder", "Category", "Tag"].map((header) => (
                <th key={header} className="px-3 py-3 font-semibold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((transaction) => (
              <tr key={transaction.id} className="border-b border-border last:border-b-0">
                <td className="px-3 py-3">{transaction.date}</td>
                <td className="px-3 py-3 font-medium">{transaction.merchant}</td>
                <td className="px-3 py-3">{currency(transaction.amount)}</td>
                <td className="px-3 py-3">
                  <Select value={transaction.cardholder} onChange={(event) => patchTransaction(transaction.id, { cardholder: event.target.value as Transaction["cardholder"] })}>
                    <option>JF</option>
                    <option>Jade</option>
                  </Select>
                </td>
                <td className="px-3 py-3">
                  <Select value={transaction.category} onChange={(event) => patchTransaction(transaction.id, { category: event.target.value as Category })}>
                    {categories.map((category) => <option key={category}>{category}</option>)}
                  </Select>
                </td>
                <td className="px-3 py-3">
                  <Select value={transaction.tag} onChange={(event) => patchTransaction(transaction.id, { tag: event.target.value as Tag })}>
                    {tags.map((tag) => <option key={tag}>{tag}</option>)}
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterBar({
  filters,
  setFilters,
  months,
}: {
  filters: TransactionFilters;
  setFilters: React.Dispatch<React.SetStateAction<TransactionFilters>>;
  months: string[];
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="relative sm:col-span-2 lg:col-span-1">
        <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search merchant" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
      </div>
      <Select value={filters.month} onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))}>
        <option>All</option>
        {months.map((month) => <option key={month}>{month}</option>)}
      </Select>
      <Select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}>
        <option>All</option>
        {categories.map((category) => <option key={category}>{category}</option>)}
      </Select>
      <Select value={filters.tag} onChange={(event) => setFilters((current) => ({ ...current, tag: event.target.value }))}>
        <option>All</option>
        {tags.map((tag) => <option key={tag}>{tag}</option>)}
      </Select>
      <Select value={filters.cardholder} onChange={(event) => setFilters((current) => ({ ...current, cardholder: event.target.value }))}>
        <option>All</option>
        <option>JF</option>
        <option>Jade</option>
      </Select>
    </div>
  );
}

function ReviewQueue({ data, updateData }: { data: AppData; updateData: (next: AppData | ((current: AppData) => AppData), message?: string) => void }) {
  const review = activeTransactions(data).filter((transaction) => transaction.category === "Review");

  function classify(transaction: Transaction, category: Category, tag: Tag, remember: boolean) {
    updateData((current) => {
      const rule = remember ? createRule(transaction.merchant, category, tag) : undefined;
      return {
        ...current,
        rules: rule ? [rule, ...current.rules] : current.rules,
        transactions: current.transactions.map((item) => (item.id === transaction.id ? { ...item, category, tag } : item)),
      };
    }, remember ? "Classified and saved merchant rule" : "Classified transaction");
  }

  return (
    <div className="space-y-4">
      {review.map((transaction) => (
        <ReviewItem key={transaction.id} transaction={transaction} onClassify={classify} />
      ))}
      {!review.length && <EmptyState title="Review queue is clear" detail="Unknown merchants from statement imports and receipts will appear here." />}
    </div>
  );
}

function ReviewItem({ transaction, onClassify }: { transaction: Transaction; onClassify: (transaction: Transaction, category: Category, tag: Tag, remember: boolean) => void }) {
  const [category, setCategory] = useState<Category>("Shared");
  const [tag, setTag] = useState<Tag>("Other");
  const [remember, setRemember] = useState(true);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{transaction.merchant}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{transaction.date} · {transaction.cardholder} · {currency(transaction.amount)}</p>
          </div>
          <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">Review</span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
        <Select value={category} onChange={(event) => setCategory(event.target.value as Category)}>
          {categories.filter((item) => item !== "Review").map((item) => <option key={item}>{item}</option>)}
        </Select>
        <Select value={tag} onChange={(event) => setTag(event.target.value as Tag)}>
          {tags.map((item) => <option key={item}>{item}</option>)}
        </Select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="rounded border-border text-primary focus:ring-ring" />
          Remember this merchant
        </label>
        <Button className="sm:col-span-3" onClick={() => onClassify(transaction, category, tag, remember)}>Save classification</Button>
      </CardContent>
    </Card>
  );
}

function RentLedger({ data, updateData }: { data: AppData; updateData: (next: AppData | ((current: AppData) => AppData), message?: string) => void }) {
  const [form, setForm] = useState({ date: "2026-07-01", amount: "850", description: "Jade paid JF rent" });
  const rentLedger = activeRentLedger(data);
  const total = rentLedger.reduce((sum, item) => sum + item.amount, 0);

  function addEntry() {
    updateData((current) => ({
      ...current,
      rentLedger: [{ id: `rent-${Date.now()}`, date: form.date, amount: Number(form.amount), description: form.description }, ...current.rentLedger],
    }), "Rent credit added");
  }

  return (
    <div className="space-y-4">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader><CardTitle className="text-primary-foreground/75">Cumulative rent credits</CardTitle></CardHeader>
        <CardContent><p className="text-4xl font-semibold">{currency(total)}</p></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Add rent credit</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr_auto]">
          <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          <Input type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <Button onClick={addEntry}><Plus className="size-4" /> Add</Button>
        </CardContent>
      </Card>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {rentLedger.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between gap-4 border-b border-border p-4 last:border-b-0">
            <div><p className="text-sm font-medium">{entry.description}</p><p className="text-xs text-muted-foreground">{entry.date}</p></div>
            <p className="font-semibold">{currency(entry.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BabySpending({ data, updateData }: { data: AppData; updateData: (next: AppData | ((current: AppData) => AppData), message?: string) => void }) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), item: "", category: "Other" as BabyCategory, amount: "", notes: "" });
  const babyPurchases = activeBabyPurchases(data);
  const total = babyPurchases.reduce((sum, item) => sum + item.amount, 0);
  const breakdown = babyCategories.map((category) => ({ category, amount: babyPurchases.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0) }));
  const max = Math.max(...breakdown.map((item) => item.amount), 1);

  function addPurchase() {
    if (!form.item || !form.amount) return;
    updateData((current) => ({
      ...current,
      babyPurchases: [{ id: `baby-${Date.now()}`, date: form.date, item: form.item, category: form.category, amount: Number(form.amount), notes: form.notes }, ...current.babyPurchases],
    }), "Baby purchase added");
    setForm({ ...form, item: "", amount: "", notes: "" });
  }

  return (
    <div className="space-y-4">
      <Card className="border-accent/50 bg-accent/15">
        <CardHeader><CardTitle>Total baby spending</CardTitle></CardHeader>
        <CardContent><p className="text-4xl font-semibold">{currency(total)}</p></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Category breakdown</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {breakdown.map((item) => (
            <div key={item.category} className="grid grid-cols-[110px_1fr_80px] items-center gap-3 text-sm">
              <span className="text-muted-foreground">{item.category}</span>
              <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(item.amount / max) * 100}%` }} /></div>
              <span className="text-right font-medium">{currency(item.amount)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Add baby purchase</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          <Input placeholder="Item" value={form.item} onChange={(event) => setForm({ ...form, item: event.target.value })} />
          <Select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as BabyCategory })}>{babyCategories.map((item) => <option key={item}>{item}</option>)}</Select>
          <Input type="number" placeholder="Amount" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          <Button onClick={addPurchase}><Plus className="size-4" /> Add</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function BabyRegistry({ data, updateData }: { data: AppData; updateData: (next: AppData | ((current: AppData) => AppData), message?: string) => void }) {
  const [form, setForm] = useState({ item: "", category: "Other" as BabyCategory, status: "Needed" as RegistryStatus, estimatedCost: "", notes: "" });

  function addItem() {
    if (!form.item) return;
    updateData((current) => ({
      ...current,
      registry: [{ id: `reg-${Date.now()}`, item: form.item, category: form.category, status: form.status, estimatedCost: Number(form.estimatedCost || 0), notes: form.notes }, ...current.registry],
    }), "Registry item added");
    setForm({ ...form, item: "", estimatedCost: "", notes: "" });
  }

  function patch(id: string, status: RegistryStatus) {
    updateData((current) => ({ ...current, registry: current.registry.map((item) => (item.id === id ? { ...item, status } : item)) }), "Registry updated");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Add registry item</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input placeholder="Item" value={form.item} onChange={(event) => setForm({ ...form, item: event.target.value })} />
          <Select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as BabyCategory })}>{babyCategories.map((item) => <option key={item}>{item}</option>)}</Select>
          <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as RegistryStatus })}>{registryStatuses.map((item) => <option key={item}>{item}</option>)}</Select>
          <Input type="number" placeholder="Estimated cost" value={form.estimatedCost} onChange={(event) => setForm({ ...form, estimatedCost: event.target.value })} />
          <Button onClick={addItem}><Plus className="size-4" /> Add</Button>
        </CardContent>
      </Card>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.registry.map((item) => (
          <Card key={item.id}>
            <CardHeader><CardTitle>{item.item}</CardTitle><p className="text-sm text-muted-foreground">{item.category} · {currency(item.estimatedCost)}</p></CardHeader>
            <CardContent className="space-y-3">
              <Select value={item.status} onChange={(event) => patch(item.id, event.target.value as RegistryStatus)}>{registryStatuses.map((status) => <option key={status}>{status}</option>)}</Select>
              {item.notes && <p className="text-sm text-muted-foreground">{item.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ReceiptScanner({ data, updateData, setTab }: { data: AppData; updateData: (next: AppData | ((current: AppData) => AppData), message?: string) => void; setTab: (tab: Tab) => void }) {
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState({ merchant: "", date: new Date().toISOString().slice(0, 10), amount: "", category: "Review" as Category, tag: "Other" as Tag, createRegistry: false });

  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const parsed = await runReceiptOcr(file);
      setReceipt((current) => ({ ...current, merchant: parsed.merchant, date: parsed.date, amount: parsed.amount ? String(parsed.amount) : current.amount }));
    } catch {
      const text = await file.text().catch(() => "");
      const parsed = parseReceiptText(text);
      setReceipt((current) => ({ ...current, merchant: parsed.merchant, date: parsed.date, amount: parsed.amount ? String(parsed.amount) : current.amount }));
    } finally {
      setBusy(false);
    }
  }

  function saveReceipt() {
    const sourceId = `receipt-${Date.now()}`;
    const transactionBase = {
      id: sourceId,
      date: receipt.date,
      merchant: receipt.merchant || "Receipt merchant",
      amount: Number(receipt.amount || 0),
      cardholder: "Jade" as const,
      statementMonth: receipt.date.slice(0, 7),
      notes: "Created from receipt scan",
      sourceType: "receipt" as const,
      sourceId,
    };
    const transaction = receipt.category === "Review" ? { ...transactionBase, category: "Review" as Category, tag: receipt.tag } : applyRules({ ...transactionBase, merchant: transactionBase.merchant }, data.rules);
    const finalTransaction = { ...transaction, category: receipt.category, tag: receipt.tag };
    updateData((current) => ({
      ...current,
      transactions: [finalTransaction, ...current.transactions],
      babyPurchases:
        receipt.category === "Baby"
          ? [{ id: `baby-${Date.now()}`, date: receipt.date, item: receipt.merchant || "Receipt purchase", category: "Other", amount: Number(receipt.amount || 0), notes: "From receipt scanner" }, ...current.babyPurchases]
          : current.babyPurchases,
      registry:
        receipt.category === "Baby" && receipt.createRegistry
          ? [{ id: `reg-${Date.now()}`, item: receipt.merchant || "Receipt purchase", category: "Other", status: "Purchased", estimatedCost: Number(receipt.amount || 0), notes: "Created from scanned receipt" }, ...current.registry]
          : current.registry,
    }), "Receipt saved");
    setTab(receipt.category === "Baby" && receipt.createRegistry ? "registry" : "transactions");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Add receipt</CardTitle><p className="text-sm text-muted-foreground">Upload an image or take a photo. V1 extracts merchant, date, and total only.</p></CardHeader>
        <CardContent className="space-y-4">
          <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-center hover:bg-muted">
            <Camera className="mb-3 size-6 text-muted-foreground" />
            <span className="text-sm font-medium">{busy ? "Reading receipt..." : "Take photo or upload image"}</span>
            <input type="file" accept="image/*,.txt" capture="environment" className="sr-only" disabled={busy} onChange={(event) => void onFile(event.target.files?.[0])} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Merchant" value={receipt.merchant} onChange={(event) => setReceipt({ ...receipt, merchant: event.target.value })} />
            <Input type="date" value={receipt.date} onChange={(event) => setReceipt({ ...receipt, date: event.target.value })} />
            <Input type="number" placeholder="Amount" value={receipt.amount} onChange={(event) => setReceipt({ ...receipt, amount: event.target.value })} />
            <Select value={receipt.category} onChange={(event) => setReceipt({ ...receipt, category: event.target.value as Category })}>{categories.map((item) => <option key={item}>{item}</option>)}</Select>
            <Select value={receipt.tag} onChange={(event) => setReceipt({ ...receipt, tag: event.target.value as Tag })}>{tags.map((item) => <option key={item}>{item}</option>)}</Select>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={receipt.createRegistry} onChange={(event) => setReceipt({ ...receipt, createRegistry: event.target.checked })} className="rounded border-border text-primary focus:ring-ring" />
              Create registry item
            </label>
          </div>
          <Button onClick={saveReceipt}>Save receipt</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SheetsSync({ data, onReset }: { data: AppData; onReset: () => void }) {
  const sheets = exportSheets(data);
  const [endpoint, setEndpoint] = useState("");
  const [status, setStatus] = useState("Ready to export six tabs for Google Sheets.");

  async function downloadJson() {
    const blob = new Blob([JSON.stringify(sheets, null, 2)], { type: "application/json" });
    downloadBlob(blob, "family-finance-hub-sheets.json");
    setStatus("Downloaded JSON workbook payload");
  }

  async function downloadCsv(tab: keyof typeof sheets) {
    const blob = new Blob([rowsToCsv(sheets[tab] as Record<string, unknown>[])], { type: "text/csv" });
    downloadBlob(blob, `${String(tab).toLowerCase().replaceAll(" ", "-")}.csv`);
    setStatus(`Downloaded ${String(tab)} CSV`);
  }

  async function pushToEndpoint() {
    if (!endpoint) {
      setStatus("Add a Google Apps Script web app URL first.");
      return;
    }
    try {
      await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sheets) });
      setStatus("Sync request sent");
    } catch {
      setStatus("Sync endpoint could not be reached from this browser.");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Google Sheets sync</CardTitle><p className="text-sm text-muted-foreground">Exports active data from the start date onward, plus settings and monthly summary.</p></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Google Apps Script web app URL" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={pushToEndpoint}><RefreshCw className="size-4" /> Sync now</Button>
            <Button variant="secondary" onClick={downloadJson}><Download className="size-4" /> Export JSON</Button>
            <Button variant="secondary" onClick={onReset}><Settings2 className="size-4" /> Reset sample data</Button>
          </div>
          <p className="text-sm text-muted-foreground">{status}</p>
        </CardContent>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {(Object.keys(sheets) as (keyof typeof sheets)[]).map((tab) => (
          <Card key={String(tab)}>
            <CardHeader><CardTitle>{String(tab)}</CardTitle><p className="text-sm text-muted-foreground">{(sheets[tab] as unknown[]).length} rows</p></CardHeader>
            <CardContent><Button variant="secondary" size="sm" onClick={() => void downloadCsv(tab)}><FileText className="size-4" /> Download CSV</Button></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
