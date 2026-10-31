import { round } from "./model.js";

export const accountTypes = {
  cash: { name: "Cash", icon: "coins", color: "#4b8062" },
  card: { name: "Card", icon: "credit-card", color: "#687eae" },
  savings: { name: "Savings", icon: "piggy-bank", color: "#ad7c45" },
  bank: { name: "Bank", icon: "bank", color: "#668c95" },
  ewallet: { name: "E-wallet", icon: "wallet", color: "#9c729e" },
};

export function initialAccounts(value = {}) {
  const methods = new Set([
    "cash",
    "card",
    "savings",
    ...(value.transactions || []).map((t) => t.paymentMethod),
    ...(value.templates || []).map((t) => t.paymentMethod),
    ...(value.bills || []).map((t) => t.paymentMethod),
  ]);
  return [...methods]
    .filter((type) => accountTypes[type])
    .map((type) => ({
      id: `account-${type}`,
      name: accountTypes[type].name,
      type,
      openingBalance: 0,
      includeInSpending: type !== "savings",
      configured: false,
    }));
}

export function transactionAccountId(data, transaction) {
  if (transaction.accountId) return transaction.accountId;
  const type = transaction.paymentMethod || "cash";
  return (
    (
      data.accounts.find((a) => a.type === type) ||
      data.accounts.find((a) => a.type === "cash") ||
      data.accounts[0]
    )?.id || ""
  );
}

export function accountFor(data, transaction) {
  return data.accounts.find(
    (a) => a.id === transactionAccountId(data, transaction),
  );
}

export function accountBalances(data, asOf = new Date()) {
  const end = new Date(asOf);
  end.setHours(23, 59, 59, 999);
  const amounts = new Map(
    data.accounts.map((a) => [a.id, Number(a.openingBalance)]),
  );
  for (const t of data.transactions) {
    if (new Date(t.date) > end) continue;
    const id = transactionAccountId(data, t);
    amounts.set(
      id,
      (amounts.get(id) || 0) +
        (t.type === "income" ? 1 : -1) * Number(t.amount),
    );
  }
  for (const t of data.transfers) {
    if (new Date(t.date) > end) continue;
    amounts.set(t.fromId, (amounts.get(t.fromId) || 0) - Number(t.amount));
    amounts.set(t.toId, (amounts.get(t.toId) || 0) + Number(t.amount));
  }
  return data.accounts.map((a) => ({
    ...a,
    balance: round(amounts.get(a.id) || 0),
  }));
}

export function accountSummary(data, asOf = new Date()) {
  const accounts = accountBalances(data, asOf);
  return {
    accounts,
    total: round(accounts.reduce((n, a) => n + a.balance, 0)),
    spendable: round(
      accounts
        .filter((a) => a.includeInSpending)
        .reduce((n, a) => n + a.balance, 0),
    ),
    savings: round(
      accounts
        .filter((a) => !a.includeInSpending)
        .reduce((n, a) => n + a.balance, 0),
    ),
    configured: accounts.some((a) => a.configured || a.openingBalance !== 0),
  };
}

export function openingForCurrentBalance(data, id, desired, asOf = new Date()) {
  const account = accountBalances(data, asOf).find((a) => a.id === id);
  if (!account) return round(desired);
  return round(
    Number(desired) - (account.balance - Number(account.openingBalance)),
  );
}

export function methodForAccount(data, id) {
  const account = data.accounts.find((a) => a.id === id);
  return account?.type === "savings" ? "bank" : account?.type || "cash";
}
