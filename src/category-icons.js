// Small, purpose-drawn symbols for the app's everyday spending categories.
const shapes={
  Food:'<path d="M5 3v7m3-7v7M5 7h3m-2 3v11M17 3c-3 2-4 5-4 9h4v9m0-18v9"/>',
  Groceries:'<path d="M4 9h16l-2 12H6L4 9Zm2 0 2-5m10 5-2-5M9 14v3m6-3v3"/>',
  Transport:'<path d="M5 16V7c0-2 2-3 7-3s7 1 7 3v9H5Zm0-5h14M7 20v-4m10 4v-4M8 8h2m4 0h2"/>',
  Bills:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6m-6 4h3"/>',
  Shopping:'<path d="M4 8h16l-1 13H5L4 8Zm4 0V6a4 4 0 0 1 8 0v2"/>',
  Health:'<path d="M12 20s-8-5-8-11a4 4 0 0 1 7-3l1 1 1-1a4 4 0 0 1 7 3c0 6-8 11-8 11Z"/><path d="M7 12h3l1-2 2 4 1-2h3"/>',
  Entertainment:'<path d="M7 4v14a3 3 0 1 1-2-3l10-3V5L7 8m8 4v4a3 3 0 1 1-2-3"/>',
  Education:'<path d="m2 9 10-5 10 5-10 5L2 9Zm4 3v5c3 3 9 3 12 0v-5M22 9v7"/>',
  Subscriptions:'<path d="M7 6a8 8 0 0 1 12 4m0-4v4h-4M17 18a8 8 0 0 1-12-4m0 4v-4h4"/>',
  Housing:'<path d="m3 11 9-8 9 8v10H3V11Zm7 10v-7h4v7"/>',
  Clothing:'<path d="m8 4 4 2 4-2 5 4-3 4-2-1v10H8V11l-2 1-3-4 5-4Z"/>',
  Snacks:'<path d="M6 4h12l-1 17H7L6 4Zm2 5h8m-7 4h6m-3-9v5"/>',
  Savings:'<path d="M4 12a8 8 0 0 1 15-3l2 1v5l-2 1a8 8 0 0 1-2 3v2h-3v-2H9v2H6v-3a8 8 0 0 1-2-6Zm5-3h4m5 3h.01"/>',
  Salary:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12c5 3 13 3 18 0m-9 0v3"/>',
  Allowance:'<path d="M3 8h18v12H3V8Zm3-4h12v4M8 14h8m-4-3v6"/>',
  Freelance:'<path d="M5 3h10l4 4v14H5V3Zm10 0v5h4M8 13h8m-8 4h5"/>',
  Gifts:'<path d="M3 9h18v4H3V9Zm2 4h14v8H5v-8Zm7-4v12M12 9C4 9 6 3 9 3c2 0 3 3 3 6Zm0 0c8 0 6-6 3-6-2 0-3 3-3 6Z"/>',
  Investments:'<path d="M4 19V5m0 14h16M7 15l4-4 3 2 5-6m-4 0h4v4"/>',
  Other:'<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
};
const palettes={Food:['#fff0db','#e28a1d'],Groceries:['#e2f4df','#54a75c'],Transport:['#e5efff','#4078d6'],Bills:['#fce7db','#cd7451'],Shopping:['#e6edff','#5574ca'],Health:['#ffe6e9','#d95d77'],Entertainment:['#f1e6ff','#9663ca'],Education:['#e1f5f3','#3d9c94'],Subscriptions:['#e8e6fa','#7768b5'],Housing:['#f4e8db','#a67646'],Clothing:['#fbe4ed','#c45c86'],Snacks:['#fff0da','#d69631'],Savings:['#e1f3e7','#4a9a67'],Salary:['#dff3e8','#38896a'],Allowance:['#e5f2dc','#739a45'],Freelance:['#e5edff','#5a7bc7'],Gifts:['#ffe5ef','#cc5d8e'],Investments:['#e2f3ef','#3e9c82'],Other:['#e9edf1','#7b8c9c']};
export const expenseCategories=['Food','Groceries','Transport','Bills','Shopping','Health','Entertainment','Education','Subscriptions','Housing','Clothing','Snacks','Other'];
export const incomeCategories=['Salary','Allowance','Freelance','Gifts','Investments','Other'];
export function categoryIcon(category,type='expense'){
  const name=shapes[category]?category:type==='income'?'Salary':'Other';
  const [bg,fg]=palettes[name];
  return `<span class="category-icon" style="--cat-bg:${bg};--cat-fg:${fg}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${shapes[name]}</svg></span>`;
}
