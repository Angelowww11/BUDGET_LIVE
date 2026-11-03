// Parse money arithmetic without executing JavaScript or accepting identifiers.
export function calculateAmount(expression) {
  const source = String(expression)
    .replace(/,/g, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/\s/g, "");
  if (!source || source.length > 120 || /[^\d.+*/%()\-]/.test(source))
    throw new Error("Enter an amount or calculation.");
  let index = 0;
  function primary() {
    let value;
    if (source[index] === "+" || source[index] === "-") {
      const sign = source[index++];
      return (sign === "-" ? -1 : 1) * primary();
    }
    if (source[index] === "(") {
      index++;
      value = sum();
      if (source[index++] !== ")") throw new Error("Close the parentheses.");
    } else {
      const match = source.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
      if (!match) throw new Error("Complete your calculation.");
      index += match[0].length;
      value = Number(match[0]);
    }
    while (source[index] === "%") {
      index++;
      value /= 100;
    }
    return value;
  }
  function product() {
    let value = primary();
    while (source[index] === "*" || source[index] === "/") {
      const op = source[index++],
        next = primary();
      if (op === "/" && next === 0) throw new Error("Cannot divide by zero.");
      value = op === "*" ? value * next : value / next;
    }
    return value;
  }
  function sum() {
    let value = product();
    while (source[index] === "+" || source[index] === "-") {
      const op = source[index++],
        next = product();
      value = op === "+" ? value + next : value - next;
    }
    return value;
  }
  const result = sum();
  if (index !== source.length) throw new Error("Check your calculation.");
  if (!Number.isFinite(result) || result < 0 || result > 1e12)
    throw new Error("Use an amount between zero and one trillion.");
  return Math.round((result + Number.EPSILON) * 100) / 100;
}
