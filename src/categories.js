import { icon, iconNames } from "./icons.js";

export const categoryDefaults = {
  Food: { icon: "bowl-food", color: "#bd7337", type: "expense" },
  Groceries: { icon: "basket", color: "#4b8062", type: "expense" },
  Coffee: { icon: "coffee", color: "#98654b", type: "expense" },
  Transport: { icon: "bus", color: "#507ab4", type: "expense" },
  Bills: { icon: "receipt", color: "#b47842", type: "expense" },
  Shopping: { icon: "wallet", color: "#9e6897", type: "expense" },
  Health: { icon: "heartbeat", color: "#c26978", type: "expense" },
  Entertainment: { icon: "film-slate", color: "#8372b3", type: "expense" },
  Education: { icon: "graduation-cap", color: "#568b9a", type: "expense" },
  Subscriptions: { icon: "repeat", color: "#737db5", type: "expense" },
  Housing: { icon: "house-line", color: "#a58358", type: "expense" },
  Clothing: { icon: "t-shirt", color: "#b97b94", type: "expense" },
  Snacks: { icon: "coffee", color: "#bb8848", type: "expense" },
  Savings: { icon: "piggy-bank", color: "#4e8f81", type: "expense" },
  Salary: { icon: "briefcase", color: "#438a70", type: "income" },
  Allowance: { icon: "hand-coins", color: "#75974e", type: "income" },
  Freelance: { icon: "laptop", color: "#5c7fb7", type: "income" },
  Gifts: { icon: "gift", color: "#b67393", type: "income" },
  Investments: { icon: "trend-up", color: "#488b91", type: "income" },
  Other: { icon: "coins", color: "#7f8996", type: "expense" },
};
export const categoryColors = [
  "#4b8062",
  "#507ab4",
  "#b97b94",
  "#bd7337",
  "#8372b3",
  "#c26978",
  "#a58358",
  "#488b91",
];
export const categoryIconNames = [
  "bowl-food",
  "basket",
  "coffee",
  "bus",
  "receipt",
  "wallet",
  "heartbeat",
  "film-slate",
  "graduation-cap",
  "repeat",
  "house-line",
  "t-shirt",
  "piggy-bank",
  "briefcase",
  "hand-coins",
  "laptop",
  "gift",
  "trend-up",
  "flower-lotus",
  "paw-print",
  "airplane-tilt",
  "coins",
  "credit-card",
  "bank",
  "sun",
  "target",
];

export function categoryMeta(data, name, type = "expense") {
  const known = (Object.hasOwn(categoryDefaults, name)
    ? categoryDefaults[name]
    : null) || {
    icon: type === "income" ? "hand-coins" : "coins",
    color: "#7f8996",
    type,
  };
  const custom =
    data.categoryDetails && Object.hasOwn(data.categoryDetails, name)
      ? data.categoryDetails[name]
      : {};
  return {
    ...known,
    ...custom,
    icon: iconNames.includes(custom.icon) ? custom.icon : known.icon,
    color: /^#[0-9a-f]{6}$/i.test(custom.color || "")
      ? custom.color
      : known.color,
  };
}

export function categoryNames(data, type = "expense") {
  const defaults = Object.entries(categoryDefaults)
    .filter(([name, meta]) => meta.type === type && name !== "Other")
    .map(([name]) => name);
  const custom = Object.keys(data.categoryDetails || {}).filter(
    (name) => data.categoryDetails[name].type === type,
  );
  const legacy = type === "expense" ? data.categories : [];
  const ordered = [
    ...new Set([
      ...(data.categoryOrder || []),
      ...defaults,
      ...legacy,
      ...custom,
      "Other",
    ]),
  ];
  return ordered.filter(
    (name) =>
      typeof name === "string" &&
      !(data.hiddenCategories || []).includes(name) &&
      (name === "Other" || categoryMeta(data, name).type === type),
  );
}

export function categoryBadge(data, name, type = "expense", className = "") {
  const meta = categoryMeta(data, name, type);
  return `<span class="category-art ${className}" style="--category-color:${meta.color}">${icon(meta.icon)}</span>`;
}
