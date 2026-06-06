export type CurrencyType = 'USD' | 'INR' | 'AED' | 'SAR' | 'QAR' | 'KWD' | 'OMR' | 'BHD' | 'EUR';

export interface PlanPricing {
  value: number;
  formatted: string;
  symbol: string;
}

export const CURRENCY_SYMBOLS: Record<CurrencyType, string> = {
  USD: '$',
  INR: '₹',
  AED: 'AED ',
  SAR: 'SR ',
  QAR: 'QR ',
  KWD: 'KD ',
  OMR: 'OMR ',
  BHD: 'BD ',
  EUR: '€',
};

export const EXCHANGE_RATES: Record<CurrencyType, number> = {
  USD: 1.0,
  INR: 83.0,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
  OMR: 0.385,
  BHD: 0.377,
  EUR: 0.92,
};

export const SUPPORTED_CURRENCIES: { key: CurrencyType; label: string; symbol: string }[] = [
  { key: 'USD', label: 'USD ($)', symbol: '$' },
  { key: 'INR', label: 'INR (₹)', symbol: '₹' },
  { key: 'EUR', label: 'EUR (€) - Ireland', symbol: '€' },
  { key: 'AED', label: 'AED (د.إ)', symbol: 'AED ' },
  { key: 'SAR', label: 'SAR (SR)', symbol: 'SR ' },
  { key: 'QAR', label: 'QAR (QR)', symbol: 'QR ' },
  { key: 'KWD', label: 'KWD (KD)', symbol: 'KD ' },
  { key: 'OMR', label: 'OMR (RO)', symbol: 'OMR ' },
  { key: 'BHD', label: 'BHD (BD)', symbol: 'BD ' },
];

/**
 * Converts a plan price between currencies.
 * Uses exact rounded mappings for standard subscription tiers if base values are standard.
 */
export const convertPrice = (value: number, from: string, to: string): number => {
  const normFrom = from.toUpperCase() as CurrencyType;
  const normTo = to.toUpperCase() as CurrencyType;
  
  if (normFrom === normTo) return value;
  
  // First convert to USD
  let valueInUSD = value;
  if (normFrom !== 'USD') {
    const rateFrom = EXCHANGE_RATES[normFrom] || 1.0;
    valueInUSD = value / rateFrom;
  }
  
  // Check if standard USD price to do nice clean round values for target currencies
  const usdRounded = Math.round(valueInUSD);
  if (usdRounded === 49 || usdRounded === 149 || usdRounded === 399) {
    if (normTo === 'INR') {
      if (usdRounded === 49) return 4000;
      if (usdRounded === 149) return 12500;
      if (usdRounded === 399) return 33500;
    }
    if (normTo === 'AED') {
      if (usdRounded === 49) return 180;
      if (usdRounded === 149) return 550;
      if (usdRounded === 399) return 1460;
    }
    if (normTo === 'SAR') {
      if (usdRounded === 49) return 185;
      if (usdRounded === 149) return 560;
      if (usdRounded === 399) return 1500;
    }
    if (normTo === 'QAR') {
      if (usdRounded === 49) return 180;
      if (usdRounded === 149) return 540;
      if (usdRounded === 399) return 1450;
    }
    if (normTo === 'KWD') {
      if (usdRounded === 49) return 15;
      if (usdRounded === 149) return 45;
      if (usdRounded === 399) return 125;
    }
    if (normTo === 'OMR') {
      if (usdRounded === 49) return 19;
      if (usdRounded === 149) return 57;
      if (usdRounded === 399) return 154;
    }
    if (normTo === 'BHD') {
      if (usdRounded === 49) return 18;
      if (usdRounded === 149) return 56;
      if (usdRounded === 399) return 150;
    }
    if (normTo === 'EUR') {
      if (usdRounded === 49) return 45;
      if (usdRounded === 149) return 135;
      if (usdRounded === 399) return 365;
    }
  }

  // Fallback: regular exchange rate conversion
  const rateTo = EXCHANGE_RATES[normTo] || 1.0;
  return Math.round(valueInUSD * rateTo);
};

/**
 * Helper to format price with the target currency symbol.
 */
export const formatPlanPrice = (
  price: number,
  planCurrency: string,
  targetCurrency: CurrencyType
): string => {
  const converted = convertPrice(price, planCurrency, targetCurrency);
  const symbol = CURRENCY_SYMBOLS[targetCurrency] || '$';
  if (targetCurrency === 'EUR') {
    return `${symbol}${converted}`;
  }
  return `${symbol}${converted.toLocaleString()}`;
};

/**
 * Returns plan pricing based on plan slug and currency choice.
 * Keeps compatibility with existing synchronous calls by returning default values.
 */
export const getPlanPricing = (planSlug: string, currency: CurrencyType): PlanPricing => {
  const norm = planSlug.toLowerCase();
  const symbol = CURRENCY_SYMBOLS[currency] || '$';

  // Base USD values
  let usdValue = 0;
  if (norm.includes('basic')) {
    usdValue = 49;
  } else if (norm.includes('professional') || norm.includes('pro')) {
    usdValue = 149;
  } else if (norm.includes('enterprise')) {
    usdValue = 399;
  } else {
    return { value: 0, formatted: 'Custom', symbol: '' };
  }

  const convertedValue = convertPrice(usdValue, 'USD', currency);
  const formattedVal = currency === 'EUR' ? `${symbol}${convertedValue}` : `${symbol}${convertedValue.toLocaleString()}`;
  return {
    value: convertedValue,
    formatted: formattedVal,
    symbol,
  };
};

/**
 * Maps database features slugs/keys to clean, human-readable labels.
 */
export function formatFeatureName(feature: string): string {
  const FEATURE_LABELS: Record<string, string> = {
    service_requests: 'Service Requests & Portal',
    work_orders: 'Work Orders & Scheduling',
    invoices: 'Invoices & Payments',
    basic_reports: 'Basic Reports & Dashboard',
    estimates: 'Estimates & Quotes',
    scheduling: 'AI Scheduling & Dispatch',
    advanced_reports: 'Advanced Analytics',
    api_access: 'API & Integration Access',
    custom_fields: 'Custom Fields & Forms',
    webhooks: 'Real-time Webhooks',
    ai_features: 'AI Predictive Maintenance & QA',
  };
  
  const clean = feature.trim();
  return FEATURE_LABELS[clean] || FEATURE_LABELS[clean.toLowerCase()] || clean.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
