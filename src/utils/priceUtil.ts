import { useLogger } from "./logger";

const PRICE_MULTIPLIER_GOLD = 1.10;
const PRICE_MULTIPLIER_SILVER = 1.40;

const logger = useLogger("mineral-prices");

export interface MineralPrices {
  goldPrice: number;
  silverPrice: number;
}

export const isGold = (name: string, sku: string) => {
  return /gold/i.test(name ?? "") || /gold/i.test(sku ?? "");
}

export const isSilver = (name: string, sku: string) => {
  return /silver/i.test(name ?? "") || /silver/i.test(sku ?? "");
}

export const getPrice = (prices: MineralPrices, name: string, sku: string, tokenPrice: number) => {
  logger.log("[getPrice] prices", prices, tokenPrice);
  let price = 0;
  if (isGold(name, sku)) {
    price = Number(prices.goldPrice);
  } else if (isSilver(name, sku)) {
    price = Number(prices.silverPrice);
  }

  const result = Number((price / tokenPrice).toFixed());
  logger.log("[getPrice] result", result, price, tokenPrice);
  return result;
}

export const getPrices = async (forceRefresh: boolean = false): Promise<MineralPrices> => {
  if (localStorage.getItem('is_test_mode') === "true") {
    return {
      goldPrice: 0.005,
      silverPrice: 0.001,
    };
  }

  const cacheKey = "goldprice";
  const cacheEntry = localStorage.getItem(cacheKey);
  if (cacheEntry && !forceRefresh) {
    const cacheData = JSON.parse(cacheEntry);
    if (Date.now() - cacheData.ts < 1000 * 60 * 15) { // cache for 15 minutes
      return toPrices(cacheData);
    }
  }

  const data = await fetchPrices();
  localStorage.setItem(cacheKey, JSON.stringify(data));

  return toPrices(data);
}

const toPrices = (data: any): MineralPrices => {
  return {
    goldPrice: data.items[0].xauPrice * PRICE_MULTIPLIER_GOLD,
    silverPrice: data.items[0].xagPrice * PRICE_MULTIPLIER_SILVER,
  };
}

const fetchPrices = async () => {
  const response = await fetch("https://data-asg.goldprice.org/dbXRates/USD", {
    body: null,
    method: "GET",
  });
  const data = await response.json();
  return data;
}