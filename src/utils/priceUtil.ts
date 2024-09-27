import { PaymentToken } from "@/types/payment-token";
import { useLogger } from "./useLogger";
import { ELMT_TOKEN_ADDRESS, WETH_TOKEN_ADDRESS } from "@/lib/web3/constants";

const PRICE_MULTIPLIER_GOLD = 1.0;
const PRICE_MULTIPLIER_SILVER = 1.0;

const logger = useLogger("mineral-prices", "debug");

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
  logger.log("[priceUtil/getPrice] prices", { prices, tokenPrice });
  let price = 0;
  if (isGold(name, sku)) {
    price = Number(prices.goldPrice);
  } else if (isSilver(name, sku)) {
    price = Number(prices.silverPrice);
  } else {
    throw new Error("[priceUtil/getPrice] Unknown product");
  }

  const result = Number((price / tokenPrice).toFixedDecimal());
  logger.log("[priceUtil/getPrice] result", result, price, tokenPrice);
  return result;
}

export const getPrices = async (forceRefresh: boolean = false): Promise<MineralPrices> => {
  // if (["staging", "local"].includes(process.env.NEXT_PUBLIC_DEPLOY_STAGE ?? "production")) {
  //   const factor = 1 // (Math.random() * 100000 % 100);
  //   return {
  //     goldPrice: 0.005 * factor,
  //     silverPrice: 0.001 * factor,
  //   };
  // }

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

export function getTokenAddress(token: PaymentToken): `0x${string}` {
  switch(token) {
    case PaymentToken.ETH:
      return WETH_TOKEN_ADDRESS;
    case PaymentToken.ELMT:
    default:
      return ELMT_TOKEN_ADDRESS;
  }
}

Number.prototype.toFixedDecimal = function (this: number, decimalsToRight: number = 2) {
  if (this === 0) return this.toString();
  const isNegative = this < 0;
  let inputCopy1 = this * (isNegative ? -1 : 1);
  let numDecimals = 0;
  while (inputCopy1 < 1) {
    numDecimals++;
    inputCopy1 = inputCopy1 * 10;
  }
  return this.toFixed(numDecimals + decimalsToRight)
}