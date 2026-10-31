import { emptyState } from "./store.js";
import { dayKey } from "./budget.js";
import { initialAccounts } from "./accounts.js";
export function demoState() {
  const d = emptyState();
  const now = new Date();
  d.settings.budget = 25000;
  d.settings.cycle = "monthly";
  const dateAt = (day, hour = 12) => {
    const x = new Date(
      now.getFullYear(),
      now.getMonth(),
      Math.min(day, now.getDate()),
      hour,
    );
    return x.toISOString();
  };
  const rows = [
    ["income", 32000, "Salary", "Monthly salary", 1, "bank"],
    ["expense", 8500, "Housing", "Apartment rent", 1, "bank"],
    ["expense", 1580, "Groceries", "Weekly market", 4, "card"],
    ["expense", 580, "Food", "Dinner with friends", 6, "ewallet"],
    ["expense", 799, "Subscriptions", "Internet plan", 8, "card"],
    ["expense", 420, "Transport", "Weekday commute", 11, "ewallet"],
    ["expense", 1260, "Shopping", "A few essentials", 15, "card"],
    ["expense", 2180, "Groceries", "Grocery restock", 18, "card"],
    ["income", 4500, "Freelance", "Design project", 20, "bank"],
    ["expense", 650, "Health", "Vitamins", 22, "cash"],
    ["expense", 450, "Entertainment", "Movie night", 24, "card"],
  ];
  d.transactions = rows.map(
    ([type, amount, category, note, day, paymentMethod], i) => ({
      id: `demo-${i}`,
      type,
      amount,
      category,
      note,
      date: dateAt(day),
      paymentMethod,
      tags: [],
    }),
  );
  const recent = [
    ["Food", 280, "Lunch break", 0, 12],
    ["Coffee", 140, "Morning coffee", 0, 9],
    ["Transport", 65, "Ride home", 1, 18],
    ["Groceries", 890, "Fresh produce", 1, 15],
    ["Food", 320, "Dinner", 2, 19],
    ["Coffee", 120, "Iced latte", 3, 10],
    ["Transport", 90, "Commute", 4, 8],
    ["Food", 210, "Lunch", 5, 12],
    ["Shopping", 480, "Home supplies", 6, 16],
  ];
  recent.forEach(([category, amount, note, ago, hour], i) => {
    const date = new Date(now);
    date.setDate(now.getDate() - ago);
    date.setHours(hour, 15, 0, 0);
    d.transactions.push({
      id: `demo-recent-${i}`,
      type: "expense",
      amount,
      category,
      note,
      date: date.toISOString(),
      paymentMethod: i % 2 ? "ewallet" : "cash",
      tags: [],
    });
  });
  d.templates = [
    { id: "demo-coffee", category: "Coffee", name: "Coffee run", amount: 140 },
    { id: "demo-lunch", category: "Food", name: "Lunch", amount: 180 },
    {
      id: "demo-fare",
      category: "Transport",
      name: "Daily commute",
      amount: 30,
    },
  ];
  d.goals = [
    {
      id: "demo-goal",
      name: "A little breathing room",
      target: 50000,
      saved: 18500,
      icon: "shield-check",
      deadline: dayKey(new Date(now.getFullYear() + 1, 4, 1)),
    },
    {
      id: "demo-trip",
      name: "Next adventure",
      target: 25000,
      saved: 9200,
      icon: "airplane-tilt",
    },
  ];
  const due = new Date(now);
  due.setDate(due.getDate() + 4);
  d.bills = [
    {
      id: "demo-bill",
      name: "Internet plan",
      type: "expense",
      category: "Subscriptions",
      amount: 799,
      dueDate: dayKey(due),
      frequency: "monthly",
      anchorDay: due.getDate(),
      paymentMethod: "card",
    },
  ];
  d.categoryBudgets = {
    Food: 5000,
    Groceries: 6000,
    Shopping: 2500,
    Transport: 2000,
  };
  const opening = {
    cash: 3000,
    card: 10000,
    savings: 18500,
    bank: 0,
    ewallet: 3000,
  };
  d.accounts = initialAccounts(d).map((a) => ({
    ...a,
    openingBalance: opening[a.type] || 0,
    configured: true,
  }));
  return d;
}
