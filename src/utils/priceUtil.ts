const PRICE_MULTIPLIER_GOLD = 1.10;
const PRICE_MULTIPLIER_SILVER = 1.40;

export interface MineralPrices {
  goldPrice: number;
  silverPrice: number;
}

export const isGold = (name: string, description: string, code: string) => {
  return /gold/i.test(name ?? "") || /gold/i.test(description ?? "") || /gold/i.test(code ?? "");
}

export const isSilver = (name: string, description: string, code: string) => {
  return /silver/i.test(name ?? "") || /silver/i.test(description ?? "") || /silver/i.test(code ?? "");
}

export const getPrice = (prices: MineralPrices, name: string, description: string, code: string, tokenPrice: number) => {
  console.log("[getPrice] prices", prices, tokenPrice);
  let price = 0;
  if (isGold(name, description, code)) {
    price = Number(prices.goldPrice);
  } else if (isSilver(name, description, code)) {
    price = Number(prices.silverPrice);
  }

  const result = Number((price / tokenPrice).toFixed());
  console.log("[getPrice] result", result, price, tokenPrice);
  return result;
}

export const getPrices = async (forceRefresh: boolean = false): Promise<MineralPrices> => {
  // // TODO: remove this
  // return {
  //   goldPrice: 0.001,
  //   silverPrice: 0.0005,
  // };

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