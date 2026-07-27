const SCALES = [
  { value: 1e18, suffix: "Qi" },
  { value: 1e15, suffix: "Qa" },
  { value: 1e12, suffix: "T"  },
  { value: 1e9,  suffix: "B"  },
  { value: 1e6,  suffix: "M"  },
  { value: 1e3,  suffix: "K"  },
];

const SUFFIX_MULTIPLIERS = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, q: 1e15, qi: 1e18 };

function format(amount, opts = {}) {
  const symbol   = opts.symbol   || "";
  const suffix   = opts.suffix   || (symbol ? "" : "$");
  const decimals = opts.decimals != null ? opts.decimals : 2;

  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${symbol}0${suffix}`;
  }

  amount = Number(amount);

  if (amount === Infinity)  return `${symbol}∞${suffix}`;
  if (amount === -Infinity) return `-${symbol}∞${suffix}`;
  if (!isFinite(amount))    return `${symbol}NaN${suffix}`;

  const negative = amount < 0;
  const abs = Math.abs(amount);

  const scale = SCALES.find(s => abs >= s.value);
  if (scale) {
    const scaled = (abs / scale.value).toFixed(decimals);
    const clean  = scaled.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
    return `${negative ? "-" : ""}${symbol}${clean}${scale.suffix}${suffix}`;
  }

  const parts = abs.toFixed(decimals).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const decPart = decimals > 0 ? `.${parts[1]}`.replace(/\.0+$/, "") : "";
  return `${negative ? "-" : ""}${symbol}${parts[0]}${decPart}${suffix}`;
}

function parse(input) {
  if (input === null || input === undefined) return NaN;
  if (typeof input === "number") return Math.floor(input);

  input = String(input).trim().toLowerCase().replace(/[$,\s]/g, "");
  if (!input) return NaN;

  const match = input.match(/^(-?\d+(?:\.\d+)?)([a-z]{1,2})?$/i);
  if (!match) return NaN;

  let value = parseFloat(match[1]);
  if (isNaN(value)) return NaN;

  const suffix = match[2];
  if (suffix) {
    const mult = SUFFIX_MULTIPLIERS[suffix];
    if (!mult) return NaN;
    value *= mult;
  }

  return Math.floor(value);
}

function clamp(amount, min, max) {
  amount = Number(amount) || 0;
  if (min != null && amount < min) return min;
  if (max != null && amount > max) return max;
  return amount;
}

function canAfford(balance, cost) {
  return Number(balance) >= Number(cost);
}

function percent(amount, pct) {
  return Math.floor((Number(amount) || 0) * (Number(pct) || 0) / 100);
}

module.exports = {
  format,
  parse,
  clamp,
  canAfford,
  percent,
};

